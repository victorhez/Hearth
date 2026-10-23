// Storage with three interchangeable backends:
//   file     (default)  data/<household>.json, fully private, zero cost
//   dynamodb            set LEGACYLINK_DDB_TABLE (pk=household, sk=id); fits the AWS free tier
//   upstash             set LEGACYLINK_UPSTASH_URL + _TOKEN; free tier, no credit card, works on any host
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

const here = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.LEGACYLINK_DATA_DIR || path.join(here, "..", "data");
const DIR = DATA_DIR;
const safe = (h) => String(h || "home").replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || "home";
export const upstashConfigured = () => Boolean(process.env.LEGACYLINK_UPSTASH_URL && process.env.LEGACYLINK_UPSTASH_TOKEN);
const dynamodbTable = () => process.env.LEGACYLINK_DDB_TABLE || process.env.DYNAMODB_TABLE_NAME;
export const dynamodbConfigured = () => Boolean(dynamodbTable());
const dynamodbKeys = () => ({
  partition: process.env.DYNAMODB_TABLE_PARTITION_KEY || "household",
  sort: process.env.DYNAMODB_TABLE_SORT_KEY || "id",
});

const fileStore = (household) => {
  const f = path.join(DIR, `${safe(household)}.json`);
  const read = () => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return []; } };
  const write = (a) => { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(f, JSON.stringify(a, null, 2)); };
  return {
    kind: "file",
    all: async () => read(),
    add: async (m) => { const a = read(); a.push(m); write(a); return m; },
    remove: async (id) => { const a = read(); write(a.filter((x) => x.id !== id)); },
    clear: async () => write([]),
  };
};

let ddbDoc;
const ddbStore = (household) => {
  const T = process.env.LEGACYLINK_DDB_TABLE, pk = safe(household);
  return {
    kind: "dynamodb",
    async client() {
      if (!ddbDoc) {
        const { DynamoDBClient } = await import("@aws-sdk/client-dynamodb");
        const lib = await import("@aws-sdk/lib-dynamodb");
        const credentials = process.env.VERCEL && process.env.AWS_ROLE_ARN
          ? awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN })
          : undefined;
        ddbDoc = { c: lib.DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1", credentials })), lib };
      }
      return ddbDoc;
    },
    async all() {
      const { c, lib } = await this.client(), keys = dynamodbKeys(), out = []; let k;
      do {
        const r = await c.send(new lib.QueryCommand({ TableName: T, KeyConditionExpression: "#pk = :h", ExpressionAttributeNames: { "#pk": keys.partition }, ExpressionAttributeValues: { ":h": pk }, ExclusiveStartKey: k }));
        out.push(...(r.Items || []).map((item) => ({
          ...item,
          id: item.id || item[keys.sort],
          ...(keys.partition === "household" ? {} : { [keys.partition]: undefined }),
          ...(keys.sort === "id" ? {} : { [keys.sort]: undefined }),
        })));
        k = r.LastEvaluatedKey;
      } while (k);
      return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async add(m) {
      const { c, lib } = await this.client(), keys = dynamodbKeys();
      await c.send(new lib.PutCommand({ TableName: T, Item: { household: pk, ...m, [keys.partition]: pk, [keys.sort]: m.id } }));
      return m;
    },
    async remove(id) {
      const { c, lib } = await this.client(), keys = dynamodbKeys();
      await c.send(new lib.DeleteCommand({ TableName: T, Key: { [keys.partition]: pk, [keys.sort]: id } }));
    },
    async clear() { for (const m of await this.all()) await this.remove(m.id); },
  };
};

// Upstash Redis over plain HTTPS (free tier, no card): works on any host, including serverless.
// LEGACYLINK_UPSTASH_URL / LEGACYLINK_UPSTASH_TOKEN. One hash per household, one field per item.
const redis = async (...cmd) => {
  const r = await fetch(process.env.LEGACYLINK_UPSTASH_URL, { method: "POST", headers: { authorization: `Bearer ${process.env.LEGACYLINK_UPSTASH_TOKEN}`, "content-type": "application/json" }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error("upstash: " + j.error);
  return j.result;
};
const conversationKey = (id) => `ll:session:${crypto.createHash("sha256").update(String(id)).digest("hex")}`;
export async function getConversation(id) {
  const value = await redis("GET", conversationKey(id));
  return value ? JSON.parse(value) : null;
}
export async function setConversation(id, state) {
  await redis("SET", conversationKey(id), JSON.stringify(state), "EX", 86400);
}

const upstashStore = (household) => {
  const key = `ll:${safe(household)}`;
  return {
    kind: "upstash",
    async all() {
      const flat = (await redis("HGETALL", key)) || [], out = [];
      for (let i = 0; i < flat.length; i += 2) out.push(JSON.parse(flat[i + 1]));
      return out.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    },
    async add(m) {
      await redis("HSET", key, m.id, JSON.stringify(m));
      if (household.startsWith("demo-")) await redis("EXPIRE", key, 86400); // visitor sandboxes clean themselves up
      return m;
    },
    async remove(id) { await redis("HDEL", key, id); },
    async clear() { await redis("DEL", key); },
  };
};

export const forHousehold = (household) => (dynamodbConfigured() ? ddbStore(household) : upstashConfigured() ? upstashStore(household) : fileStore(household));
