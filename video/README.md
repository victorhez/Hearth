# The Hearth demo film (rendered by code)

An illustrated 2:50 film: a Nigerian family kitchen, the Ankara-wrapped Hearth device with its Raspberry Pi cutaway, a family playing "family time", an elder's story, a French-speaking cousin, a glimpse of the other languages, a message for the future, and a proof screen. Nobody's real face appears.

**What is real:** every line Hearth says on screen was produced by the project's server while the film was made (`prepare.mjs` has the actual conversations with the actual MCP-backed server). The tool calls and test counts on the proof screen are real. **What is illustrated:** the people, the kitchen and the device. The film says so on screen ("Illustrated demonstration · fictional family"), and the narration says Hearth is *built* for a Raspberry Pi; it does not claim the device was filmed running.

## Rebuild it

```bash
npm install
node video/prepare.mjs                 # 1. real conversations -> voices -> timing  (needs internet for the neural voices)
node video/render.mjs --at 5,30,80     # (optional) check a few stills in video/out/qa
node video/render.mjs --all --out frames   # 2. every frame (about 40 minutes at 2 fps)
node video/mix.mjs                     # 3. music + effects + mix + encode -> video/out/hearth-demo.mp4
```

Needs Node, `ffmpeg`/`ffprobe` on the PATH, and Chrome or Edge installed (it is driven headlessly with `puppeteer-core`; nothing is downloaded).

## Change the story

* **Script and lines:** `video/storyboard.mjs` (the human lines, narration, and which Hearth replies are shown).
* **Voices:** `video/voices.mjs` (Nigerian English voices with pitch/rate per character; French for Mireille).
* **Look:** `video/film/art.js` (SVG kitchen, people, device, cutaway) and `video/film/film.js` (camera, animation, subtitles, scenes).
* Total length is printed by `prepare.mjs`. Keep it under 178 s for the 3-minute limit.

## Honest limits
* The music is synthesized (original, no samples). It is simple and warm, not a composer's score.
* Characters are flat vector illustrations with lip-sync driven by the voice loudness, not full animation.
* Quiz questions and story replies are excerpts of the real replies (story titles and a few trailing sentences are trimmed for time).
