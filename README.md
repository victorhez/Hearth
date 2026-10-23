# Hearth (LegacyLink)

**A voice-first family archive that helps keep your family's stories alive.**

Hearth invites elders to share memories in conversation, preserves those memories in a family archive, and helps younger relatives hear and revisit them later. It is designed for the kitchen: a browser today, with a standalone Raspberry Pi device as the next deployment step.

**Repository:** [github.com/victorhez/Hearth](https://github.com/victorhez/Hearth)

> **Prototype status:** The web experience and conversation flows run locally. The repository includes a Raspberry Pi runtime and an MCP server, but this is not yet a packaged appliance or a completed public deployment. Live AWS services and the physical Pi audio/peripheral path have not been validated.

## The problem, and why I built Hearth

I know what it feels like to realize there are stories I can no longer ask my grandparents to tell. They passed away before I had captured some of the experiences only they could describe. Later, parts of those stories reached me through other people—but a secondhand retelling can lose details or change with time. Hearing a story from the person who lived it is not the same as hearing someone else's version.

Hearth is my attempt to make preserving those memories feel less like a task and more like a conversation. An elder can speak naturally instead of typing or managing a recording. The family can then return to the story, hear it in context, and share it with younger generations. The goal is not to replace family conversation; it is to help important memories survive it.

## What Hearth does

- **Guided oral-history conversations:** invites a person to tell a memory and asks gentle follow-up questions about people, places, time, and feelings.
- **A searchable family archive:** saves stories and lets relatives retrieve and hear them again.
- **Family activities:** creates quizzes from saved stories and supports family-time conversations.
- **Future messages:** gives elders a way to leave a message for descendants.
- **Voice-first interaction:** supports wake-word and spoken conversation in the browser, with a Python device runtime intended for a Raspberry Pi.
- **Seven languages:** English, Spanish, French, Mandarin Chinese, Portuguese, German, and Hindi.
- **MCP interface:** provides ten oral-history tools over Streamable HTTP, designed so compatible clients can call Hearth.
- **Family accounts and storage options:** includes account and household isolation flows, with local-file, Upstash Redis, and DynamoDB storage adapters.

## Current stage and test evidence

This is a working local prototype—not a finished, production-ready service. The browser discussion flow and speech experience have been exercised locally. The repository also contains a device runtime and offline queue, but final Raspberry Pi assembly, real microphone/speaker/LED validation, and packaging as a ready-to-install appliance remain future work.

The latest verification in this workspace:

| Check | Result | Notes |
|---|---:|---|
| `npm test` | **9 passed, 0 failed** | Covers accounts and household isolation, MCP conversation flow, seven-language scenarios, mocked Bedrock tool selection, and Upstash behavior against a fake API. |
| `python -m unittest device/test_device.py` | **5 passed, 1 failed, 1 skipped** | The `test_simulate_script` assertion did not receive its expected archive reply in this Windows run. The full device suite is therefore not green yet. |

These results are automated local tests, not evidence of a live cloud deployment or physical-device certification. The automated suite does not verify a real browser microphone session or Raspberry Pi peripherals. The built-in speaker-recognition test data uses generated voices; its results should not be read as proof of reliable identification between real family members.

## AWS status

The project contains optional integrations for Amazon Bedrock (conversation and embeddings), Amazon Polly (speech), and DynamoDB (storage). The Bedrock agent loop has a mocked-client test, but these AWS services have **not** been run against a live AWS account for this submission.

I created an AWS account and added billing information, but the phone-verification code has not arrived despite repeated attempts over several days. I have contacted AWS Support and am waiting for a response. Without completing verification, I cannot obtain the credentials needed to validate the live integrations. This is a current blocker—not a claim that AWS deployment is complete.

The application works locally without AWS credentials. Free hosting with Render and Upstash is a separate path and does not depend on AWS; see [the deployment guide](docs/DEPLOY.md).

## Roadmap

| Phase | Focus | Work |
|---|---|---|
| **Now — local prototype** | Core experience | Conversation, archive, quizzes, seven-language flows, accounts, MCP tools, and local testing. Continue fixing the device simulation test and keep results documented. |
| **Next — public demo** | Shareable web experience | Publish the MIT-licensed repository, deploy the web app using the included Render blueprint and persistent Upstash storage, then test the HTTPS demo and judge instructions from a clean browser. Add the published video URL and live test link to the submission. |
| **Next — AWS validation** | Optional cloud integrations | After account verification, exercise Bedrock, Polly, and/or DynamoDB with least-privilege credentials, cost controls, and documented results. Only then claim live AWS service use or enter the AWS Builder Mini Challenge. |
| **After the demo — device build** | Hardware readiness | Install on the target Raspberry Pi, validate microphone, speech recognition, speaker, wake phrase, LED feedback, reconnect/offline sync, and startup behavior; then create repeatable packaging and setup instructions. |
| **Longer term — trust and reach** | Responsible expansion | Add encryption at rest, account verification and recovery, privacy controls for consent/export/deletion, real-family usability testing, and a supported Alexa+ integration/test path. |

## Run locally

Requirements: Node.js 22 or later. Python device dependencies are separate and listed in `device/requirements.txt`.

```bash
npm install
npm run seed
npm start
```

Open `http://localhost:3333` in Chrome or Edge. The browser's speech capabilities depend on browser support and microphone permissions. Other useful pages:

- `http://localhost:3333/archive.html` — family archive
- `http://localhost:3333/kitchen.html` — interactive demo scene
- `http://localhost:3333/?device=1` — device display mirror
- `http://localhost:3333/health` — local service status

Run the automated checks:

```bash
npm test
python -m unittest device/test_device.py
```

The device suite needs Node.js, the project dependencies, and the Python packages from `device/requirements.txt`. The device runtime can also exercise its non-audio flow using a text script; see [device setup and current limitations](device/README.md).

## Architecture

| Component | Implementation |
|---|---|
| Web app and API | Express server, static browser UI, conversation and archive endpoints |
| MCP | Official JavaScript MCP SDK, Streamable HTTP endpoint at `POST /mcp`, ten tools in `src/tools.mjs` |
| Conversation | Local deterministic conversation engine; optional Bedrock tool-use path |
| Speech | Browser speech features and neural TTS; optional Polly path |
| Storage | Local JSON by default; optional Upstash Redis or DynamoDB adapters |
| Device | Python runtime for wake phrase, offline speech recognition, voice profiles, LED state, and queued sync |

Read the source guide in [docs/](docs/), including [AWS setup](docs/AWS_SETUP.md), [deployment](docs/DEPLOY.md), and the [submission copy guide](docs/SUBMISSION.md).

## Deployment status

The repository includes a Dockerfile and a Render blueprint. These are deployment configuration, **not a deployed URL**. The recommended initial public demo is Render plus Upstash; it requires configuring the host and storage accounts but does not require AWS. Vercel-specific configuration is not included, and the device's live state uses server-sent events, so the current Express deployment path should be validated before attempting a serverless conversion.

There is no public GitHub remote or deployed testing link configured in this checkout yet. Add those URLs only after publishing and verifying them.

## Privacy and limitations

Hearth is a prototype for family stories, which can be sensitive. Stories are not encrypted at rest by the current storage adapters. Do not use it for sensitive real-family material until you have reviewed the deployment and storage configuration. Account verification and password recovery are not implemented. The local speaker-recognition path is experimental and can confuse similar voices. Browser speech support varies by browser and language.

## License

This project is released under the [MIT License](LICENSE).
