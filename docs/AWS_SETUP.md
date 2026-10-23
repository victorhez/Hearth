# Getting AWS working for Hearth (step by step, with no money to spend)

> **Submission status:** This project has optional Bedrock, Polly, and DynamoDB integration code, but live AWS use has not been validated. The AWS account phone-verification code has not arrived despite repeated attempts; billing information has been added and AWS Support has been contacted. The local app works without AWS. Do not claim live AWS services or enter the AWS Builder Mini Challenge until you have resolved verification and tested an eligible service.

**What AWS adds (all optional):** Claude on Amazon **Bedrock** as Hearth's brain, **Polly** voices, and **DynamoDB** storage. It is also what qualifies you for the *AWS Builder* mini challenge. Hearth works fully without it, so if you can't get an account, skip this file.

> I wrote this from AWS's published information, not by clicking through your account. Screens change, so if a button is named differently, look for the closest one. Never paste your keys into a chat or a GitHub file.

---

## Part 1: Create the account (free plan)

1. Go to **aws.amazon.com/free** and choose **Create a Free Account**.
2. Enter your email, a password and an account name. Verify the email.
3. Choose the **Free plan** when asked (not "Paid plan"). Since July 2025, new accounts get up to **$200 in credits** ($100 when you sign up, up to $100 more for trying a few services such as Bedrock), valid for 6 months. The free plan is designed to stop rather than bill you when the credits end.
4. **Payment method.** AWS normally asks for a card to verify you are real, even on the free plan. Options if you have no card:
   - a **virtual dollar card** from your bank or a fintech app (many Nigerian banks and apps offer these; fund it with a few dollars. AWS may hold about $1 to verify it, then release it);
   - ask a **family member or friend** to let you use theirs, with their permission, and tell them it is for the free plan with a spending alert;
   - if neither works, **stop here**: skip AWS and enter only the Alexa+ track (the AWS mini challenge needs real AWS use).
5. Phone verification: enter your number and the code sent by SMS or call.
6. When the account is ready, sign in to the **AWS Management Console**.

## Part 2: Protect yourself from surprise bills (do this before anything else)

1. Console search bar → **Billing and Cost Management** → **Budgets** → **Create budget** → *Zero spend budget* (alerts you the moment you spend a cent) → enter your email.
2. Also create a *Monthly cost budget* of **$5** with alerts at 50% and 100%.
3. In Billing → **Billing preferences**, turn on **Receive Free Tier usage alerts** and **credit alerts**.
4. Check **Billing → Credits** to see how much you have and when it expires.

## Part 3: Make a safe user for Hearth (not your root login)

Never use your main (root) login in code.
1. Console search → **IAM** → **Users** → **Create user** → name `hearth-app`. Do *not* give console access.
2. **Attach policies directly**, then add these three (they are limited to what Hearth needs):
   - `AmazonBedrockFullAccess`
   - `AmazonPollyReadOnlyAccess`
   - `AmazonDynamoDBFullAccess` (only if you will use DynamoDB; otherwise skip it)
3. Create the user → open it → **Security credentials** → **Create access key** → choose *Application running outside AWS* → create.
4. **Copy the Access key ID and the Secret access key now** (the secret is shown once). Store them only in the `.env` file in Part 6.

## Part 4: Turn on Claude in Bedrock

1. In the console, set the **region** (top right) to **US East (N. Virginia) us-east-1** (most models are available there).
2. Console search → **Amazon Bedrock**.
3. In the left menu look for **Model catalog** (older consoles: *Model access*). Open an **Anthropic Claude** model.
   - The first time, AWS asks you to describe your **use case** for Anthropic models. Fill it in honestly (a hackathon project that helps families keep their stories) and submit. Access usually arrives within minutes.
   - If you see **Request access** or **Enable**, click it.
4. In the **Playground**, pick the Claude model and send "hello". If it answers, Bedrock works.
5. Copy the exact **Model ID**. If the page offers an **inference profile** ID (for example one starting with `us.`), use that: some newer models can only be called through a profile.
6. Pick a **smaller, cheaper Claude model** if there is a choice. Hearth sends short messages, so it costs very little, and your credits go further.

## Part 5: (Optional) Polly voices and DynamoDB

- **Polly:** nothing to enable. Once your keys are in `.env`, Hearth uses Polly voices automatically instead of the free voices. To force the free voices instead, set `LEGACYLINK_TTS=edge`.
- **DynamoDB** (only if you are hosting online and don't want Upstash): Console → **DynamoDB** → **Create table** → name `legacylink`, partition key `household` (String), sort key `id` (String) → capacity mode **On-demand**. Then set `LEGACYLINK_DDB_TABLE=legacylink` in `.env`.

## Part 6: Connect it to Hearth

1. In the project folder, copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`).
2. Open `.env` in a text editor and fill in:
   ```text
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=...        (from Part 3)
   AWS_SECRET_ACCESS_KEY=...    (from Part 3)
   BEDROCK_MODEL_ID=...         (from Part 4)
   ```
3. Start the server: `npm start` (it reads `.env` automatically).
4. Check it: open `http://localhost:3333/health`. It should show `"llm":"bedrock"`. In the app, the top-right label should read **"Claude on Amazon Bedrock · MCP"**.
5. Ask Hearth something and watch the terminal. If you see `[bedrock fallback]` messages, read the reason printed after it:
   - *AccessDenied / not authorized*: the IAM policy or the model access (Part 3 or 4) is missing.
   - *model identifier is invalid / on-demand throughput isn't supported*: use the inference-profile ID instead of the plain model ID.
   - *credentials*: a key was copied with a space or the wrong region.
   Hearth keeps working on its local engine while you fix it.

If something doesn't work after this, tell me the exact message from the terminal (not your keys) and I'll fix the code or tell you which step to repeat. I'll then test the live Bedrock path end to end.

## Part 7: Keep costs near zero

- Hearth only calls Bedrock when someone talks to it. A whole demo day should cost cents.
- When you are done filming, **delete the access key**: IAM → Users → `hearth-app` → Security credentials → Delete.
- Look at **Billing** once a week until the credits run out or expire.

## What to say in your submission about AWS

Only list services you actually ran, for example: "Claude on Amazon Bedrock via the Converse API for tool-use conversation; Amazon Polly for voices", and describe how, in the feedback box. If you didn't get AWS working, say nothing about it.

---

### Alternatives if AWS isn't possible
- **Kiro** (AWS's AI editor) has a free tier and the contest says building with "Kiro Crew" counts for the AWS challenge. I couldn't find what "Kiro Crew" is, so ask in the hackathon's Discord or on Devpost before relying on it.
- Enter **only the Alexa+ track**. Hearth is complete without AWS.
