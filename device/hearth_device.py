#!/usr/bin/env python3
"""
Hearth device runtime (Raspberry Pi 4/5, or any Linux/macOS/Windows box with a mic + speaker).

  wake word -> record until silence -> local speech-to-text (faster-whisper, offline)
  -> LegacyLink server (/api/say, which drives the MCP tools) -> neural voice (/api/tts) -> speaker

Live state is pushed to /api/device/events so the Hearth screen (index.html?device=1) mirrors the device.
If the server is unreachable, stories are queued on disk and replayed later (offline-first) while a local voice answers.

Wake word options (HEARTH_WAKEWORD):
  phrase            say "Hey Hearth": a keyword spotter built on the same offline Whisper model (no training needed)
  alexa|hey_jarvis|hey_mycroft|/path/model.onnx   openWakeWord models (lighter on CPU; train your own for "Hey Hearth", see device/README.md)
  button            GPIO button / Enter key only

Simulation (no microphone, no Whisper): `python hearth_device.py --simulate script.txt`, one "heard" utterance per line.

Environment: HEARTH_SERVER, HEARTH_HOUSEHOLD (legacy mode), HEARTH_TOKEN (account device token), HEARTH_TELLER, HEARTH_LANG (en es fr zh pt de hi),
HEARTH_STT_MODEL (base.en for English; use "small" or "base" for other languages), HEARTH_BUTTON_GPIO, HEARTH_LED=neopixel, HEARTH_PIPER_MODEL.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
import time

import requests

try:
    import speaker as spk
except Exception:  # numpy missing etc.: voice recognition is optional
    spk = None

SERVER = os.environ.get("HEARTH_SERVER", "http://localhost:3333").rstrip("/")
HOUSEHOLD = os.environ.get("HEARTH_HOUSEHOLD", "home")
TOKEN = os.environ.get("HEARTH_TOKEN", "")
TELLER = os.environ.get("HEARTH_TELLER", "Grandma Rose")
LANG = os.environ.get("HEARTH_LANG", "en")
WAKEWORD = os.environ.get("HEARTH_WAKEWORD", "phrase")
STT_MODEL = os.environ.get("HEARTH_STT_MODEL", "base.en" if LANG == "en" else "small")
QUEUE_FILE = os.environ.get("HEARTH_QUEUE", os.path.expanduser("~/.hearth_queue.jsonl"))
RATE = 16000

WAKE_RE = re.compile(
    r"^\W*(?:(?:hey|hi|ok|okay|hello|hola|oye|salut|bonjour|ol[aá]|hallo|嘿|嗨|你好|नमस्ते|हे)[\s,，]*)?"
    r"(?:hearth|heart|earth|hurt|hard|hearts|alexa|harth|壁炉|赫斯|哈斯|हर्थ|हार्थ)[\s,，.!?。]*", re.I)


def strip_wake(text):
    """Returns (woke, rest_of_utterance)."""
    m = WAKE_RE.match(text or "")
    return (True, text[m.end():].strip()) if m else (False, text or "")


class Leds:
    COLORS = {"idle": (40, 25, 5), "listening": (0, 160, 200), "thinking": (110, 70, 220), "speaking": (240, 170, 70)}

    def __init__(self):
        self.pix = None
        if os.environ.get("HEARTH_LED") == "neopixel":
            try:
                import board  # pip install adafruit-circuitpython-neopixel
                import neopixel
                self.pix = neopixel.NeoPixel(board.D18, int(os.environ.get("HEARTH_LED_COUNT", "12")), brightness=0.3, auto_write=True)
            except Exception as e:  # LEDs are optional
                print("LED init failed:", e)

    def set(self, state):
        if self.pix is not None:
            self.pix.fill(self.COLORS.get(state, (0, 0, 0)))


class Device:
    """Everything that is not raw audio, so it can be tested without hardware."""

    def __init__(self, server=SERVER, token=TOKEN, household=HOUSEHOLD, teller=TELLER, lang=LANG, queue_file=QUEUE_FILE, play_audio=True, voicebook=None):
        self.server, self.teller, self.lang, self.queue_file, self.play_audio = server.rstrip("/"), teller, lang, queue_file, play_audio
        self.voices = voicebook if voicebook is not None else (spk.VoiceBook() if spk and os.environ.get("HEARTH_RECOGNISE_VOICES", "1") == "1" else None)
        self.headers = {"x-household": household}
        if token:
            self.headers["authorization"] = f"Bearer {token}"
        self.json_headers = {**self.headers, "content-type": "application/json"}
        self.session_id = f"device-{int(time.time())}"
        self.leds = Leds()
        self.mode = "idle"
        self.spoken = []  # what Hearth said (handy for tests)

    # ---- state to the screen + LEDs ----
    def push(self, state, **extra):
        self.leds.set(state)
        try:
            requests.post(f"{self.server}/api/device/state", headers=self.json_headers, json={"state": state, **extra}, timeout=1.5)
        except Exception:
            pass  # the screen mirror is best-effort

    # ---- brain ----
    def say(self, utterance, session=None, teller=None, speaker=None):
        body = {"session": session or self.session_id, "utterance": utterance, "teller": teller or self.teller, "lang": self.lang}
        if speaker:
            body["speaker"] = speaker
        r = requests.post(f"{self.server}/api/say", headers=self.json_headers, json=body, timeout=60)
        r.raise_for_status()
        return r.json()

    def who_is_it(self, audio):
        """Voice recognition: a guess is only passed on if it is plausible; the server asks "is that right?" before trusting it."""
        if audio is None or not self.voices or not self.voices.people:
            return None
        name, score = self.voices.identify(audio)
        return {"name": name, "score": round(score, 2)} if name and score >= 0.25 else None

    def handle(self, text, audio=None):
        """One heard utterance -> Hearth's reply (spoken). Falls back to the offline queue when the server is down."""
        self.push("thinking", text=text)
        try:
            out = self.say(text, speaker=self.who_is_it(audio))
        except Exception:
            if text.strip():
                self.enqueue(text)
            self.mode = "idle"
            self.local_voice("I can't reach the family archive right now, but I've kept that safe and I'll save it as soon as I'm back online.")
            return None
        self.mode = out.get("mode") or "idle"
        if out.get("lang") and out["lang"] != self.lang:
            self.lang = out["lang"]
        if out.get("teller"):
            self.teller = out["teller"]
        self.speak(out["reply"])
        return out

    # ---- "remember my voice" ----
    def enroll_flow(self, record, transcribe, samples=3):
        """Hearth has just asked for a name. Hear it, then take a few natural samples of the voice and store them on this device."""
        if not self.voices:
            self.local_voice("Voice recognition isn't available on this device.")
            return None
        try:
            strings = requests.get(f"{self.server}/api/i18n", params={"lang": self.lang}, timeout=10).json()["enroll"]
        except Exception:
            strings = {"sample": "Nice to meet you. Now just talk to me naturally for a few seconds.", "done": "Got it. From now on I'll know :n by voice."}
        raw = transcribe(record()) or ""
        name = re.sub(r"^(my name is|it'?s|i am|i'm|this is|soy|je suis|我是|ich bin|eu sou|मैं)\s+", "", raw.strip(), flags=re.I).strip(" .!?。！？,，")
        if not name:
            self.local_voice("Sorry, I didn't catch your name.")
            return None
        self.speak(strings["sample"])
        clips = []
        for _ in range(samples):
            audio = record()
            if audio is not None and len(audio) > 16000 * 1.5:
                clips.append(audio)
            if len(clips) < samples:
                self.push("listening")
        if not clips:
            self.local_voice("I couldn't hear enough to learn your voice. Let's try again later.")
            return None
        self.voices.enroll(name, clips)
        self.teller = name
        self.speak(strings["done"].replace(":n", name))
        return name

    # ---- offline-first ----
    def enqueue(self, text):
        with open(self.queue_file, "a", encoding="utf8") as f:
            f.write(json.dumps({"teller": self.teller, "text": text, "lang": self.lang, "at": time.time()}, ensure_ascii=False) + "\n")

    def sync_queue(self):
        """Stories captured offline are replayed through the same MCP-backed path once the server is reachable."""
        if not os.path.exists(self.queue_file):
            return 0
        with open(self.queue_file, encoding="utf8") as f:
            lines = [l for l in f.read().splitlines() if l.strip()]
        keep, sent = [], 0
        for line in lines:
            item = json.loads(line)
            try:
                sid = f"{self.session_id}-sync-{int(item['at'] * 1000)}"
                old, self.lang = self.lang, item.get("lang", self.lang)
                try:
                    start = {"en": "I want to tell you a story", "es": "quiero contarte una historia", "fr": "je veux vous raconter une histoire", "zh": "我想讲一个故事",
                             "pt": "quero te contar uma história", "de": "ich möchte dir eine Geschichte erzählen", "hi": "मैं आपको एक कहानी सुनाना चाहता हूँ"}[self.lang]
                    done = {"en": "that's all", "es": "eso es todo", "fr": "c'est tout", "zh": "说完了", "pt": "é só isso", "de": "das war's", "hi": "बस इतना ही"}[self.lang]
                    self.say(start, sid, item["teller"])
                    self.say(item["text"], sid, item["teller"])
                    self.say(done, sid, item["teller"])
                    sent += 1
                finally:
                    self.lang = old
            except Exception:
                keep.append(line)
        with open(self.queue_file, "w", encoding="utf8") as f:
            f.write("".join(l + "\n" for l in keep))
        return sent

    # ---- speech out ----
    def speak(self, text):
        self.spoken.append(text)
        self.push("speaking", reply=text)
        try:
            r = requests.get(f"{self.server}/api/tts", params={"text": text, "who": "hearth", "lang": self.lang}, headers=self.headers, timeout=25)
            if r.status_code == 200 and r.content:
                if self.play_audio:
                    play_mp3(r.content)
                return
        except Exception:
            pass
        if self.play_audio:
            self.local_voice(text)
        else:
            print("[hearth says]", text)

    def local_voice(self, text):
        """Offline fallback: Piper if configured (good quality), else espeak-ng."""
        self.spoken.append(text)
        if not self.play_audio:
            print("[hearth says offline]", text)
            return
        model = os.environ.get("HEARTH_PIPER_MODEL")
        if model:
            try:
                import numpy as np
                import sounddevice as sd
                p = subprocess.Popen(["piper", "--model", model, "--output-raw"], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
                raw, _ = p.communicate(text.encode())
                sd.play(np.frombuffer(raw, dtype=np.int16), 22050)
                sd.wait()
                return
            except Exception:
                pass
        try:
            subprocess.run(["espeak-ng", "-v", self.lang, "-s", "150", text])
        except FileNotFoundError:
            print("[hearth says]", text)


def play_mp3(data):
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        f.write(data)
        path = f.name
    try:
        for player in (["mpg123", "-q"], ["ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet"], ["afplay"]):
            try:
                subprocess.run(player + [path], check=True)
                return
            except (FileNotFoundError, subprocess.CalledProcessError):
                continue
    finally:
        os.unlink(path)


# ---------------- audio (needs real hardware; imported lazily) ----------------
def record_until_silence(dev, max_s=45, silence_s=1.6, start_timeout=6.0):
    """Energy-based endpointing. Story mode passes a longer silence_s so elders can pause to remember."""
    import numpy as np
    import sounddevice as sd
    frames, started, quiet_for, t0, noise = [], False, 0.0, time.time(), None
    block = int(RATE * 0.1)
    with sd.InputStream(samplerate=RATE, channels=1, dtype="int16", blocksize=block) as st:
        while time.time() - t0 < max_s:
            data, _ = st.read(block)
            rms = float(np.sqrt(np.mean(data.astype(np.float32) ** 2)))
            if not started:
                noise = rms if noise is None else min(noise * 1.02, rms)
            if rms > max(350.0, (noise or 0) * 3.0):
                started, quiet_for = True, 0.0
            elif started:
                quiet_for += 0.1
            if started:
                frames.append(data.copy())
                if len(frames) % 3 == 0:
                    dev.push("listening", level=min(1.0, rms / 6000.0))
            if started and quiet_for >= silence_s:
                break
            if not started and time.time() - t0 > start_timeout:
                return None
    return np.concatenate(frames) if frames else None


_whisper = None


def transcribe(audio, lang):
    global _whisper
    import numpy as np
    if _whisper is None:
        from faster_whisper import WhisperModel  # pip install faster-whisper
        _whisper = WhisperModel(STT_MODEL, device="cpu", compute_type="int8")
    segs, _ = _whisper.transcribe(audio.astype(np.float32).flatten() / 32768.0, language=lang, beam_size=1, vad_filter=True)
    return " ".join(s.text.strip() for s in segs).strip()


class Wake:
    """Blocks until 'Hey Hearth' (phrase spotter or openWakeWord), the GPIO button, or Enter. Returns any words said after the wake word."""

    def __init__(self, dev):
        self.dev, self.model, self.button = dev, None, None
        if WAKEWORD not in ("phrase", "button"):
            try:
                import openwakeword  # pip install openwakeword
                from openwakeword.model import Model
                openwakeword.utils.download_models()
                self.model = Model(wakeword_models=[WAKEWORD], inference_framework="onnx")
            except Exception as e:
                print("openWakeWord unavailable (", e, ") -> falling back to the phrase spotter")
        self.phrase = WAKEWORD == "phrase" or (WAKEWORD not in ("button",) and self.model is None)
        pin = os.environ.get("HEARTH_BUTTON_GPIO")
        if pin:
            from gpiozero import Button
            self.button = Button(int(pin))

    def wait(self):
        """Returns (words said after the wake word, the audio of the wake utterance if available)."""
        import numpy as np
        import sounddevice as sd
        evt = threading.Event()
        if self.button:
            self.button.when_pressed = evt.set
        if sys.stdin.isatty():
            threading.Thread(target=lambda: (sys.stdin.readline(), evt.set()), daemon=True).start()
        if self.model:
            with sd.InputStream(samplerate=RATE, channels=1, dtype="int16", blocksize=1280) as st:
                while not evt.is_set():
                    data, _ = st.read(1280)
                    if max(self.model.predict(data.flatten()).values()) > 0.5:
                        self.model.reset()
                        return "", None
            return "", None
        if self.phrase:
            # cheap gate (energy) + short Whisper pass only on speech: no model training, works in every Whisper language
            while not evt.is_set():
                audio = record_until_silence(self.dev, max_s=6, silence_s=0.7, start_timeout=1.0)
                if audio is None or len(audio) < RATE * 0.4:
                    continue
                woke, rest = strip_wake(transcribe(audio, self.dev.lang))
                if woke:
                    return rest, audio
            return "", None
        evt.wait()
        return "", None


CONTINUOUS = ("story", "quiz", "family", "confirm", "enroll")


def main():
    print(f"Hearth device -> {SERVER} (teller {TELLER}, lang {LANG}, wake {WAKEWORD})")
    dev = Device()
    wake = Wake(dev)
    dev.push("idle")
    dev.sync_queue()
    rec = lambda: record_until_silence(dev, silence_s=3.4 if dev.mode == "story" else 1.6)
    stt = lambda a: transcribe(a, dev.lang) if a is not None else ""
    while True:
        try:
            text, audio = "", None
            if dev.mode not in CONTINUOUS:
                dev.push("idle")
                text, audio = wake.wait()
                dev.push("listening")
                if not text:
                    # wake word only: Hearth answers right away ("I'm here" / "that sounds like Victor, is that right?")
                    out = dev.handle("", audio)
                    if out and out.get("action") == "enroll":
                        dev.enroll_flow(rec, stt)
                    continue
            else:
                audio = rec()
                if audio is None:
                    dev.mode = "idle"
                    continue
                dev.push("thinking")
                text = stt(audio)
            if text:
                out = dev.handle(text, audio)
                if out and out.get("action") == "enroll":
                    dev.enroll_flow(rec, stt)
        except KeyboardInterrupt:
            break
        except Exception as e:
            print("loop error:", e)
            time.sleep(1)
    dev.push("idle")


def simulate(path):
    """Run the whole non-audio pipeline from a text file of 'heard' utterances."""
    dev = Device(play_audio=False)
    dev.sync_queue()
    awake = False
    for line in open(path, encoding="utf8").read().splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        woke, rest = strip_wake(line)
        if not awake and not woke and dev.mode not in CONTINUOUS:
            print(f"(asleep, ignored) {line}")
            continue
        awake = True
        text = rest if woke else line
        print(f"> {text or '(wake word only)'}")
        if text:
            out = dev.handle(text)
            if out:
                print(f"  [{out.get('engine')}] {out['reply']}")
        if dev.mode not in CONTINUOUS:
            awake = False


if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "--simulate":
        simulate(sys.argv[2])
    else:
        main()
