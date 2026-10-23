# Hearth: the demo video, from set-up to upload

**Goal:** a 2:50 film that looks like a real family in a real Nigerian home using a real device, and that a judge can understand in one watch. It is *not* a screen recording with a voice-over. The family's faces carry it. The software proves it.

**The rule that makes it win:** everything the device says on camera is what it really said. You can cut waiting time and pick the best take, but never fake a reply. Judges can try the demo link, and a fake gets caught. A real device, a real family and an honest trim is stronger than any polished fake.

---

## 0. What you need (all of it exists in the repo)

| Need | Where / how |
|---|---|
| Hearth running on a Raspberry Pi in your parlor or kitchen | `device/README.md`; code is `device/hearth_device.py`. **First run it on the Pi two days before filming**: the audio parts have not been tested on real hardware yet. |
| A server for it to talk to (a laptop on the same Wi-Fi is fine) | `npm install`, `npm run seed:ng`, then `npm start`. |
| A Nigerian-flavoured family archive to talk about | `npm run seed:ng` loads six stories (Lagos, Ibadan, Enugu, Abeokuta, Port Harcourt, Nsukka; Mama Kemi, Papa Emeka, Aunty Ngozi, Ada). Replace them with your real family's stories if you can: nothing beats real. |
| A Nigerian-accented voice for Hearth | Before `npm start`: PowerShell `$env:LEGACYLINK_VOICE_EN="en-NG-EzinneNeural"` (female) or `en-NG-AbeoNeural` (male). |
| Hearth recognising people by voice ("that sounds like Victor Hayes") | Enrol each person once (section 3). It works on the Pi device, not in the browser. |
| The on-screen graphics | `/video/title.html`, `features.html`, `languages.html`, `lowerthird.html`, `end.html` (section 6). |
| Screen view of Hearth's orb | A TV or laptop showing `http://<laptop>:3333/?device=1` mirrors what the Pi is doing (listening, thinking, speaking, the memory stars). |

**Be honest about what the voice recognition is:** it is demo-grade by default. It reliably separates clearly different voices (my tests: 16 of 16 correct on four distinct synthetic voices, unknown voices rejected), but it can confuse siblings with similar voices. For real use, install the neural model with `device/get_speaker_model.sh` and re-enrol. If recognition gets someone wrong on a take, redo the take.

---

## 1. The story of the film (what the judge feels)

1. *Every family has stories that live in one place: someone's memory.* (the problem, in a human way)
2. *A small device on the counter that listens like a person.* (the product)
3. *It knows who is speaking. It plays with the family. It keeps what an elder says. Days later it remembers for you.* (the proof, in a real scene)
4. *It speaks your language. It works on a device or in a browser.* (reach)
5. *And one day a child who is not born yet can still ask.* (the heart, the last emotional beat)

Keep one thread: **the family in the parlor, one evening.** Everything else (languages, features, tech) is a short cutaway.

---

## 2. Cast, places, gear

**Cast (rename to your real people)**
- **Victor Hayes**: you. On camera and narrating. The one Hearth recognises.
- **Two siblings** (Sibling A, Sibling B): play the family-time game and react honestly.
- **An elder** (mum, dad, an aunty or uncle): tells a short story. This is your emotional anchor. If nobody older is available, a sibling can tell a real childhood memory instead, but an elder is far stronger.
- Optional: a child or a younger cousin for the "for generations" moment.

**Places**: the **parlor** (family time, the elder's story) and the **kitchen counter** (close-up of the device, a quiet moment). Tidy but lived-in. Natural window light in the late afternoon, plus a warm lamp. Turn off the TV and the generator noise.

**Gear (a phone is enough)**
- **Camera A (wide):** phone on a tripod, landscape, 4K 30 fps if it can, 1080p 30 fps if not. Frames everyone and the device on the table.
- **Camera B (close):** a second phone (a friend can hold it, or prop it) for faces and reactions. Two angles make editing look professional.
- **Device close-up inserts:** the Hearth device alone, LED ring cycling cyan (listening), violet (thinking), amber (speaking). Film 20 seconds of each at 1080p with macro-like closeness.
- **Sound:** put a phone voice recorder or a lavalier mic *near the device speaker* so Hearth's voice is clean, and one near the family. Record 30 seconds of room tone (silence) for the edit. Do not film with a fan, AC or generator running.
- **Screen footage:** a laptop recording `/?device=1`, the family archive page (`/archive.html`) and the tool-call cards. Record with OBS at 1080p.

---

## 3. Before you film (the evening before)

```text
laptop:   npm install
          npm run seed:ng
          $env:LEGACYLINK_VOICE_EN="en-NG-EzinneNeural"
          npm start                          # note the laptop's IP, e.g. 192.168.1.20
pi:       HEARTH_SERVER=http://192.168.1.20:3333 HEARTH_TELLER="Victor Hayes" \
          HEARTH_WAKEWORD=phrase python hearth_device.py
screen:   open http://192.168.1.20:3333/?device=1 on a TV or laptop in the room
```

**Enrol everyone's voice** (3 minutes, off camera, or film it as a 6-second "set-up" insert):
1. Victor: "Hey Hearth, remember my voice." → Hearth: "Sure. What's your name?" → "Victor Hayes." → Hearth asks for a few natural sentences → speak 3 short phrases → "Got it. From now on I'll know Victor Hayes by voice."
2. Repeat for each sibling and the elder.
3. Test: each person says "Hey Hearth". It should say "Okay, that sounds like <name>. Is that right?" for the right person. Fix problems now (move the mic, reduce room noise, re-enrol in the same room you'll film in, at the same distance).

**Rehearse the whole script twice.** The first rehearsal also **warms the voice cache**: Hearth's replies are generated live, but identical replies are instant the second time, which cuts the waiting on camera.

**Know the delays:** each reply takes about 3 to 8 seconds the first time (speech recognition on the Pi, then the voice). That is normal. In the edit, trim the silence to about 1.5 seconds. Do not trim so hard that it looks like instant magic.

---

## 4. The shoot: scene by scene (target length 2:50)

Times are for the *edit*. Film each scene in several takes.

### 0:00 to 0:12: Cold open (no logo yet)
- **Visual:** the parlor at golden hour. The family laughing off-screen. Slow push-in on the Hearth device on the table, ring glowing amber. Hands holding an old photograph.
- **VO (Victor, calm):** "Every family has stories that live in exactly one place: someone's memory."
- **Text on screen:** none. Let it breathe.

### 0:12 to 0:25: The problem
- **Visual:** B-roll: an elder's hands, framed photographs, a child listening. Cut to Victor looking straight at camera.
- **VO:** "And memories fade. Dates, names, the little details. I wanted our family to keep them, without asking anyone to type or record anything."
- **Graphic:** `title.html` fades in for about 2 seconds over the last words ("HEARTH · The voice that keeps your family's stories alive.").

### 0:25 to 0:55: Hearth knows the family (the signature moment)
Camera A wide, Camera B close on Victor, then on Hearth.
- **Victor:** "Hey Hearth."
- **Hearth:** "Okay, that sounds like Victor Hayes. Is that right?"
- **Victor** (smiling): "Yes."
- **Hearth:** "Lovely to hear you, Victor Hayes."
- **Victor:** "Hey Hearth, let's have family time."
- **Hearth:** "Family time! Who's playing today? Say your names."
- **Victor / Sibling A / Sibling B:** "Victor, Chioma and Tunde." (use your real names)
- **Hearth:** "Lovely: Victor, Chioma, Tunde. Let's begin. Victor, your question: In Mama Kemi's story 'The Christmas we travelled to the village'..." (the exact question is random; the family answers from the choices)
- Let the siblings react, tease each other, argue about the answer. **This is the real part judges will remember.** Film 4 to 5 questions' worth, use the best 15 seconds.
- **Lower-third (graphic):** `lowerthird.html?caption=Hearth%20recognises%20each%20person%20by%20voice` at the moment it says "that sounds like Victor".
- **If recognition misses:** keep the take where it asks "Who is this?", it teaches itself the name. A recovery moment is more convincing than perfection. If it fails twice, re-enrol and reshoot.

### 0:55 to 1:25: An elder tells a story (the emotional beat)
Camera B close on the elder's face, Camera A wide.
- **Elder** (or Victor on their behalf): "Hey Hearth, I want to tell you a story."
- **Hearth:** "I'd love to hear it, <name>. Take your time. Where were you, and who was with you?"
- **Elder** tells a real memory, 15 to 25 seconds, in their own words. Let them pause.
- **Hearth** reacts and asks one gentle follow-up ("That sounds wonderful. Who else was there with you?"). The elder answers briefly.
- **Elder:** "That's all."
- **Hearth:** "Thank you. I've kept ... safe in the family archive ... Your family will treasure this."
- **Cut-in (screen):** `/?device=1` showing a new star appearing in the ring, or `/archive.html` with the new story on the timeline (about 4 seconds).
- **VO (soft, over the screen cut-in):** "It listens, asks like a person would, and keeps the people, the places and the year."

### 1:25 to 1:50: Days later: it remembers for you
- **Visual:** a different day (change a shirt, new light). Victor alone in the kitchen, or with a sibling.
- **Victor:** "Hey Hearth, what did Mama Kemi say about the Christmas in the village?" (or the elder's story: use their name and topic)
- **Hearth** retells the story in the elder's own words.
- **Reaction shot:** a sibling smiling, someone saying "I forgot that!"
- **VO:** "Months later, when a detail slips away, it is still there."
- **Then** Victor, quietly to camera: "Hey Hearth, I want to leave a message for my grandchildren." → Hearth: "Of course, Victor Hayes. Speak to the people who will come after you, as if they were sitting right here." → Victor says one sincere sentence (10 seconds). **Say something true**, even simple.
- **VO over black or a slow shot of the device:** "One day, a child who is not born yet will be able to ask, and be answered."

### 1:50 to 2:08: Languages, a glimpse
- **Visual:** short clips from `/video/languages.html?auto=1` (the page cycles English, Español, Français, 中文, Português, Deutsch, हिन्दी, each with a live question and Hearth's voice, about 5 seconds each; trim to about 2.5 seconds each in the edit).
- Option: a live shot of Victor saying "Hey Hearth, switch to French" on the device, and Hearth answering in French. (Do this only if it works on the day.)
- **VO:** "It speaks English, and six more languages. The same family archive, in the language each person loves."
- **Lower-third:** "7 languages".

### 2:08 to 2:25: Device or app: your choice
- **Visual:** split screen. Left: the Pi device on the counter. Right: the browser app on a phone (`/`), the same orb. Cut to two cards from `features.html` ("On your counter", "Or in your pocket").
- **VO:** "Put it in your kitchen as a standalone device, or open it in any browser. Same family, same memories."

### 2:25 to 2:42: Under the hood, for the judges
- **Visual:** quick cuts, screen recordings:
  1. The tool-call cards on `/` appearing as Hearth answers (`tools/call · retrieve_memory`, `summarize_story`).
  2. The terminal: `npm test` ending with all tests passing.
  3. The repo tree: `src/tools.mjs`, `src/server.mjs`, `device/hearth_device.py`.
- **VO (only say what is true on the day):** "Every answer is a real tool call over MCP, Streamable HTTP: capture a story, retrieve a memory, summarise it, quiz the family. It runs on a Raspberry Pi, with offline speech recognition, offline queueing, and accounts so each family's stories stay private."
- If Bedrock is working: add "Claude on Amazon Bedrock chooses the tools." If not, **leave it out.** Say nothing about AWS you have not run.

### 2:42 to 2:50: Close
- **Visual:** the family together, the device lit softly. Slow fade to `end.html` (set `?demo=` and `?repo=`).
- **VO:** "Hearth. Because the stories we don't keep are the ones we lose first."

---

## 5. Directing the family (so it looks natural)

- **Do not rehearse the reactions**, only the order of events. Laughing at a wrong answer is gold. Let people talk over each other a little.
- Tell everyone to **look at each other, not at the camera**, except Victor in the narration shots.
- **Speak to Hearth like a person**, at normal volume, from about a metre away. Pause a beat after the wake word.
- Film **each interaction 3 times**. Take the best one.
- Film **cutaways**: hands, the device's LED changing colour, a smile, a photograph, the window light. You need 20+ of these to make the edit feel rich.
- Get one **laugh, one quiet moment, and one moment where someone leans in**. Those are the emotional beats.
- If Hearth mishears, **keep the take if the recovery is natural** (it says "Sorry, who is this?" and learns). It proves it is real.

---

## 6. Using the graphics pages

Open each at `http://localhost:3333/video/<page>` (full screen with F11, then screen-record with OBS at 1080p). Add `?rec=1` to hide the hint text.

| Page | Use | Useful options |
|---|---|---|
| `title.html` | Title card (the glowing orb and "HEARTH") | `?tag=your own line` |
| `lowerthird.html` | Name / caption overlays. **Record on green** and key it out in your editor | `?name=Victor Hayes&role=Creator of Hearth&bg=green`, or `?caption=Hearth recognises each person by voice&bg=green` |
| `features.html` | Six animated feature cards (device, app, 7 languages, remembers, family time, generations) | `?sec=3` seconds per card; space = pause, arrows = move |
| `languages.html` | The live language glimpse: asks a question and answers in each of the 7 languages with voice | `?auto=1` to start without clicking, `?only=zh` for one language |
| `end.html` | End card | `?demo=your-app.onrender.com&repo=github.com/you/legacylink`. Add `&bedrock=1` **only if it's true** |

---

## 7. Editing (free tools: DaVinci Resolve or CapCut)

1. **Cut to the voice-over first**, then lay picture on it. Keep the whole film to **2:50 or less** (the rules say judges need not watch past 3:00).
2. **Colour:** a gentle warm grade, skin tones first. Lift the shadows a little. Do not crush the blacks: darker skin needs light on the face, so expose for faces in the shoot and brighten faces slightly in the grade.
3. **Pacing:** trim waiting time to about 1.5 seconds, never to zero. Cut on reactions.
4. **Captions:** burn in English subtitles for all spoken lines, and for the multi-language clips show the original text with an English caption below it. Judges often watch on mute.
5. **Music:** quiet, warm, instrumental, **royalty-free that you have the licence for** (YouTube Audio Library, or Pixabay Music: check the licence text on the track page). **No commercial songs.** Keep it 18 to 20 dB under the voices. Silence during the elder's story: no music at all there.
6. **Sound:** normalise dialogue to about -14 LUFS, remove hiss, add 2 to 3 seconds of room tone under cuts so silence does not drop to dead air.
7. **Lower-thirds:** key out the green from `lowerthird.html` and place at the right moments (section 4).
8. **Export:** 1080p (or 4K), 30 fps, H.264, about 16 Mbps. Check it plays on your phone before uploading.

---

## 8. Upload and submission checklist

- [ ] YouTube (or Vimeo), **public**, **English** (title and description), under 3:00
- [ ] Title: *Hearth: a voice that keeps your family's stories alive (Alexa+ MCP · Raspberry Pi)*
- [ ] Description: what it does, links to the repo and the live demo, the track(s) you are entering, and a note that it was built during the hackathon window
- [ ] Chapters in the description (00:00 Intro, 00:25 Family time, 00:55 A story kept, and so on)
- [ ] No copyrighted music or footage; every person on camera has agreed to appear
- [ ] The video **shows the project running on real hardware** (the Pi) or clearly says what you are showing, and **shows the MCP server working** (the tool-call cards and the test run)
- [ ] Product feedback and friction log submitted (they earn a bonus)
- [ ] The repo README matches what the video claims

---

## 9. Day-of checklist

- [ ] Server up on the laptop, device pointing at it, `?device=1` screen visible
- [ ] Wi-Fi stable (the neural voice needs internet; if it drops, Hearth falls back to a plain offline voice, which sounds different: reshoot those takes)
- [ ] Phones: charged, in airplane mode with Wi-Fi off so nothing buzzes, enough storage, lenses cleaned
- [ ] Everyone's voice enrolled, and test-recognised in the room you will film in
- [ ] Rehearsal done (voice cache warm)
- [ ] 30 seconds of room tone recorded
- [ ] Release forms or a clear spoken yes from everyone on camera

---

## 10. If something goes wrong

| Problem | What to do |
|---|---|
| The device misses "Hey Hearth" | Move closer, reduce noise, or press the button/Enter key to wake it (say "I used the button" if asked; it's a documented feature). Reshoot that take. |
| It names the wrong person | Reshoot, or keep it as the "Who is this?" recovery moment. Re-enrol in the same room if it keeps happening. |
| Voice replies are slow | Do a rehearsal first (cache). Trim in the edit. Check the laptop is on Wi-Fi, not a weak hotspot. |
| The Pi audio isn't working | Fall back to the laptop with a microphone running the same code (`python device/hearth_device.py`), and say so plainly in the video. Do not claim Pi hardware you did not film. |
| No elder available | A sibling tells a real childhood memory. Keep it true. |
| AWS isn't set up | Skip AWS in the VO entirely. The project stands without it. |
