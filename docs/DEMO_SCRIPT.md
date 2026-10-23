> **Superseded by `docs/VIDEO_PLAN.md`**, the full real-life shoot plan (family scenes, shot list, editing, graphics pack). This file is the shorter screen-capture-only script.

# Hearth · 3-minute demo script

Judges may stop at 3:00, so the strongest material is first. Target length **2:50**. Total voice-over is about 330 words, so speak slowly. Most of the runtime is the scene's own dialogue.

**Before recording:** `npm run seed`, `npm start`, open `/kitchen.html` in Chrome fullscreen (F11), speakers on and not muted, and run the scene once so the audio is cached. Record the screen with OBS, and the physical device with your phone. Do not use music with a copyright claim; YouTube Audio Library or silence is safest.

---

## 0:00–0:15 · Cold open (no logo yet)

**Shot:** the kitchen scene, 5 seconds of ambient quiet. Grandma Rose's bubble appears: *"Hey Hearth, I want to tell you about how Walter and I met."*
**VO (start over the first line):**
> "My grandmother is eighty-four. Every story she's ever told me lives in exactly one place: her memory."

## 0:15–0:35 · The problem and the idea

**Shot:** slow push-in on the kitchen, Hearth's ring pulsing amber.
**VO:**
> "Families lose their history because recording it takes effort nobody has. Hearth removes the effort. It's a voice that lives in the kitchen, listens like a person, and keeps every story safe, so the family can *use* it, not just store it."

## 0:35–1:20 · The interview (the heart of the demo)

**Shot:** let the scene play with its real dialogue. Hearth asks gentle follow-ups; the cyan **listening** ring, the violet **thinking** ring, and the amber **speaking** ring are all visible. Bottom-left shows the live `tools/call` cards.
**VO (only in the gaps, short):**
> "No screens, no typing. She just talks. Hearth asks one gentle question at a time... and when she's done, it extracts the people, places, dates and feelings, and saves it to a private archive."

**Cut to:** `/` (the Hearth orb page) with the new story glowing as a new star in the memory constellation (about 5 seconds).

## 1:20–1:50 · The family uses the memory

**Shot:** back to the kitchen. Maya enters: *"Hey Hearth, what did Grandma say about her first job?"* Hearth retells it. Then *"Quiz me on Grandma Rose's stories."* One right answer, one wrong with a warm correction.
**VO:**
> "Later, her granddaughter asks about a story she never heard. Hearth finds it by meaning, not keywords, and retells it in natural speech. Then it turns the memories into a quiz, so young people actually engage with them."

## 1:50–2:05 · It speaks your language

**Shot:** `/` with the language chips visible. Say *"Switch to French"*; the whole screen and Hearth's voice change. Ask *"Qu'est-ce que Mamie Colette a dit sur le pain ?"* and let it answer in French. Then tap 中文 and let Hearth greet in Mandarin.
**VO:**
> "Hearth speaks seven languages, because every family's stories are told in their own."

## 2:05–2:20 · The device

**Shot (your phone):** the physical Raspberry Pi unit: the LED ring turning cyan, the screen showing the orb, you saying the wake word. Show the internals for 3 seconds if it's open.
**VO:**
> "It's a standalone device: a Raspberry Pi with wake-word detection and speech recognition that run offline. If the internet drops, stories are saved on the device and sync when it's back. No phone, no app, one friendly object on the counter."

## 2:20–2:42 · Under the hood

**Shot:** split screen: the tool-call cards, then the repo's `src/tools.mjs`, then a terminal running `npm test` passing.
**VO:**
> "Every answer comes from real tool calls over MCP, Streamable HTTP: capture, retrieve, summarize, quiz. That's exactly the interface Alexa+ uses. On Amazon Bedrock, Claude decides which tools to call, Titan embeddings power semantic search, and Polly gives Hearth its voice. Stories live in DynamoDB, one private archive per household."

*(Only say the AWS sentence if you have turned those services on. See "Truth check" below.)*

## 2:42–2:55 · Close

**Shot:** the end card ("Every family has stories worth keeping").
**VO:**
> "Hearth: a living family archive. Because the stories we don't record are the ones we lose first."

---

## Optional "talk back" beat (10 seconds, strong for judges)

In `/kitchen.html`, press **YOUR TURN**, and interrupt Hearth mid-sentence by saying *"Hey Hearth, stop. Quiz me instead."* This shows it is a conversation, not a script. Only use it if it works on your machine on the day (barge-in depends on your mic and speakers); rehearse first.

## Truth check before you publish

* Only claim what's running in the video. If Bedrock, Polly or DynamoDB are not enabled when you record, delete those words from the 2:15–2:40 segment and say "runs locally and privately; Bedrock, Polly and DynamoDB plug in with environment variables".
* The brain label in the top-right of `/` shows **"Claude on Amazon Bedrock · MCP"** or **"Local engine · MCP"**, so the video will show which is true.
* The Bee/Ring/Fire TV tracks are not used. Enter **Alexa+** as the track, plus the **AWS Builder** and **Open Source** mini challenges only if you really meet them.

## Devpost checklist

- [ ] Public YouTube/Vimeo link, under 3:00, English
- [ ] Repo public with the MIT `LICENSE` (it already has one), or private and shared with `testing@devpost.com` plus the Amazon reviewers
- [ ] README explains how to run (done) and that the repo calls MCP in code (`src/tools.mjs`, `src/brain.mjs`)
- [ ] Product feedback for each tool you used (MCP SDK, Bedrock, Polly, ...)
- [ ] Friction log (earns up to 10% bonus): note every problem you hit while building, with what you expected and what happened
- [ ] State clearly that the project was built during the submission window

## Backup plan for the physical device shot

If the Pi isn't ready, film the device-mirror screen: run the server and open `http://localhost:3333/?device=1` full screen, then run `python device/hearth_device.py` on any laptop with a mic. Say plainly in the video that it is the device runtime on a laptop, and do not claim Pi hardware you didn't film.
