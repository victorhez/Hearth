# Devpost submission guide

Use this as a source of accurate, copy-ready answers for the Devpost form. Replace bracketed fields with your real links or personal details. Do not claim a public deployment, live AWS use, hardware validation, or eligibility facts unless you have personally verified them.

## Project page

### Project name

**Hearth (LegacyLink)**

### Elevator pitch

> Hearth is a voice-first family archive that interviews elders, preserves stories in their own words, and helps younger generations rediscover them—in seven languages.

### About the project

> I built Hearth because I know what it feels like to realize there are stories I can no longer ask my grandparents to tell. They passed away before I had captured some of the experiences only they could describe. Later, parts of those stories reached me through other people—but a secondhand retelling can lose details or change with time. Hearing a story from the person who lived it is not the same as hearing someone else's version.
>
> Hearth is my attempt to make preserving those memories feel less like a task and more like a conversation. A family member can speak naturally; Hearth listens, asks gentle follow-up questions, and saves the memory so relatives can return to it later. Families can retrieve stories, play quizzes based on what was shared, and leave messages for future generations. The goal is not to replace family conversation. It is to help important memories survive it.
>
> The local prototype combines a browser voice experience, a Node.js conversation service, and an MCP server with ten oral-history tools. It supports seven languages and includes a Python runtime intended for a standalone Raspberry Pi device. The core web and conversation flows work locally. I have not yet packaged a finished appliance or published a live deployment.
>
> The current automated JavaScript run passed **11 of 11 tests**. The Python device suite ran **7 tests: 5 passed, 1 failed, and 1 was skipped** in my latest Windows run; the simulation test did not receive its expected reply, so I am treating device validation as incomplete. The local prototype has been exercised, but the physical Raspberry Pi audio/peripheral path is not yet certified.
>
> I also implemented optional integration paths for Amazon Bedrock, Polly, and DynamoDB. I have not validated those services against a live AWS account. My AWS account setup is blocked because the phone-verification code has not arrived despite repeated attempts. I have contacted AWS Support and am waiting for help. The app's local mode does not require AWS.
>
> I learned how to structure oral-history conversations as reusable MCP tools, build multilingual flows, and test the same conversation path across the web app and device runtime. The next steps are to publish and deploy a judge-ready web demo, validate AWS integrations if account verification is resolved, test the runtime on actual Raspberry Pi hardware, and improve privacy protections before real families rely on it.

### Built with (suggested tags)

Node.js, Express, Model Context Protocol (MCP), JavaScript, Python, Raspberry Pi, browser speech APIs, faster-whisper, Upstash Redis, Microsoft neural voices

Only add Amazon Bedrock, Amazon Polly, or DynamoDB as services used if you have actually run them. The code contains optional integration paths, but live AWS validation has not happened yet.

### Try it out links

- **Demo video:** <https://youtu.be/biJjI4HbpH0>
- **Code repository:** <https://github.com/victorhez/Hearth>
- **Live test URL:** Add after deployment and a successful clean-browser test. There is no live URL configured in this checkout yet.

The local `hearth-demo.mp4` is about **107 MB**, exceeding Devpost's 35 MB file-upload limit. Use the YouTube demo link, or create a smaller compressed copy if you want to attach a file.

## Additional information for judges and organizers

### Submitter and eligibility

| Form field | Suggested answer |
|---|---|
| Submitter type | **Individual**, if you are submitting solo. Otherwise select the actual team/organization type. |
| Organization name | **N/A**, if you are not representing an organization. |
| Country of residence | **Choose your actual country**; this is shown in the project gallery. |
| Canadian province | **N/A**, unless you reside in Canada. |
| Age, eligible jurisdiction, and promotion-entity employment confirmations | These are legal attestations. Read and answer each yourself; do not check a box unless it is true for you and every applicable teammate. |

### Primary track

**Alexa+ is the likely fit to verify against the official rules:** the project exposes an MCP server using Streamable HTTP and includes ten tools designed for compatible clients. The repository does **not** demonstrate a live connection to an Alexa+ device or account. Confirm the track rules accept this implementation state before selecting it, and describe it as Alexa+-oriented MCP compatibility—not as a tested Alexa+ skill.

Do not select Fire TV, Bee, or Ring unless you build and demonstrate the required integration for that track.

### New or existing project

Choose based on the project's actual state on **August 31, 2026**:

- Select **New** only if the project did not exist before that date.
- Select **Existing, but significantly updated** if it existed before that date and you made substantial changes during the submission period.

The local checkout had no commit history from which to verify when work began. If it was an existing project, describe only changes you actually made during the contest and demonstrate those changes in the video.

### AWS Builder Mini Challenge

**Recommended answer right now: No.** The project has optional source integrations for Bedrock, Polly, and DynamoDB, and a mocked test of the Bedrock tool-use loop, but no live AWS service invocation has been validated for this submission. An account and billing profile are not evidence of an integration. Reconsider **Yes** only after you have actually used an eligible AWS service and can describe and demonstrate that use.

If you later validate a service, replace the answer with the exact service(s) used and the feature each powers. Do not paste AWS keys into the form or repository.

### Open Source Mini Challenge

The project includes an MIT license. The repository URL is now known, but verify it is publicly accessible and that the project qualifies within the hackathon window before selecting **Yes**.

| Required field | Value |
|---|---|
| Contribution URL | <https://github.com/victorhez/Hearth> (if this new public repository qualifies under the event rules) |
| Project repository URL | <https://github.com/victorhez/Hearth> |
| GitHub username | `victorhez` |
| Description | Use the draft below only after confirming the project qualifies within the event dates. |

**Open-source description draft:**

> I created Hearth (LegacyLink), an MIT-licensed voice-first family oral-history archive. It combines a Node.js web app, an MCP server with ten tools for capturing and retrieving stories, seven-language conversation flows, and a Python device runtime intended for Raspberry Pi. The project helps families preserve firsthand memories and revisit them through conversation and quizzes. The source, setup instructions, tests, current limitations, and roadmap are documented in the repository README.

### Optional feature request

**Priority: Important**

> A documented Alexa+ MCP test harness would let developers validate authentication, tool schemas, and request/response behavior before connecting a real Alexa+ client. A repeatable simulator would shorten integration time and make it easier to distinguish server bugs from client or device setup issues.

### Optional friction log

Keep this entry if it accurately reflects your attempts:

> **Task:** Complete AWS account phone verification so I can obtain credentials and validate the project's optional AWS integrations.  
> **Steps:** Created an AWS account, added billing information, attempted phone verification repeatedly over several days, and contacted AWS Support.  
> **Expected result:** Receive the verification code and finish setup so I can configure AWS credentials securely and test the integrations.  
> **Actual result:** The phone-verification code has not arrived; I cannot complete verification or obtain the credentials required for live testing. Support has not yet responded.  
> **Severity:** High for AWS integration and the AWS Builder Mini Challenge; it does not prevent local use of the project.  
> **Workaround:** Continue using the local conversation engine and non-AWS voice/storage options; wait for Support. No AWS workaround has been completed.  
> **Suggestion:** Provide a reliable alternate phone-verification path and clearer escalation guidance for time-sensitive hackathon participants.

### Project testing link and instructions

There is no public test URL yet. After deployment, replace this with the HTTPS link and test steps. Until then, judges can run the source locally:

```bash
npm install
npm run seed
npm start
```

Then open `http://localhost:3333` in Chrome or Edge. The app also serves `/archive.html` and `/kitchen.html`. Current test results and device limitations are recorded in the repository README. Do not describe the local URL as publicly accessible.

## Feedback questions

Use only the tools you actually used. Edit the notes to reflect your own direct experience.

### 1. Which developer tools, APIs, and SDKs did you use and for what?

> I used Node.js and Express for the application server and web APIs; the official JavaScript Model Context Protocol SDK for the Streamable HTTP MCP endpoint and oral-history tools; browser speech APIs for the voice-first web experience; and Python with faster-whisper and audio-device libraries for the device runtime. The project includes Microsoft neural TTS through `msedge-tts`. The AWS SDK integrations for Bedrock, Polly, and DynamoDB are present in the source, but I have not validated them against live AWS services. The Upstash adapter was exercised against a local fake API, not a live Redis database.

### 2. For each tool, API, or SDK, what worked well?

> The MCP tools gave the conversation a clear interface: stories can be captured, retrieved, summarized, and turned into quizzes through named operations. The local engine and automated scenarios made it possible to test seven-language flows without cloud credentials. The browser prototype and local storage path made it possible to demonstrate the core idea before deployment. The AWS integrations are designed to be optional, so local use does not depend on an AWS account.

### 3. What needs work?

> A real Alexa+ client test path would make MCP integration easier to verify. Browser speech support and recognition quality vary by browser and language. The Raspberry Pi microphone, speaker, and LED path still needs hardware validation and packaging. The AWS phone-verification process blocked live service testing in my case. Privacy protections also need work before production use, including encryption at rest and account recovery.

### 4. How was onboarding?

> Local onboarding was straightforward: install Node.js dependencies, seed the demo family, and start the server. The device runtime needs separate Python dependencies and hardware-specific setup. AWS onboarding was not completed because the account phone-verification code did not arrive, so I could not reach the point of testing a live AWS integration.

### 5. Would you build with these devices and services again?

> **Yes for the local MCP and voice-first prototype workflow:** it let me test a useful family experience without requiring cloud access. I would also continue exploring the AWS integrations once account verification is resolved. I would want a supported Alexa+ test harness and a more predictable hardware setup path before relying on them for a production launch.

## AI tools and learning

- **AI tools used while working on the project:** GitHub Copilot in VS Code for development and documentation assistance. Add any other tools you personally used.
- **Learning level:** Select **Significant** only if that matches your experience. A reasonable description is: “I learned to design an MCP-backed conversation flow, build and test multilingual oral-history scenarios, and plan the boundary between a local-first prototype and cloud/device deployment.”
- **Did you gain AI value for your career?** Select **Yes** only if that reflects your experience; a possible explanation is that the project gave you hands-on practice with conversational AI integration and evaluation.

## Before clicking submit

- [ ] Confirm the repository is publicly accessible and the GitHub page displays the MIT license.
- [ ] Add your YouTube video URL.
- [ ] Check the video is publicly viewable. The local MP4 is too large for the 35 MB attachment limit.
- [ ] If entering Open Source, confirm the public project/contribution qualifies within the event window and fill all required fields.
- [ ] If entering AWS Builder, first validate an eligible AWS service live and update the description to match.
- [ ] Deploy and smoke-test the public app before entering a testing link.
- [ ] Review personal, country, date, and eligibility answers yourself.
- [ ] Keep the test counts and AWS/hardware caveats consistent across the form, video, and repository.
