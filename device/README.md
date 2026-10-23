# Hearth — the standalone device

A small kitchen-counter unit that answers any time, with no phone or laptop needed.

> Status: the device runtime is implemented, but the latest local run of `python -m unittest device/test_device.py` was not fully green: 5 passed, 1 failed, and 1 was skipped. `test_simulate_script` did not receive its expected archive reply in that Windows run. The microphone, Whisper audio path, speaker, LEDs, and other peripherals have not been validated on a physical Pi; see the main README for the current evidence and roadmap.

## Bill of materials (about $110–140)

| Part | Notes |
|---|---|
| Raspberry Pi 5 (4 GB) or Pi 4 (4 GB) | Pi Zero 2 W works for cloud-STT mode only |
| ReSpeaker 2-Mic Pi HAT **or** USB mic array (e.g. ReSpeaker USB Mic Array v2.0) | far-field pickup + onboard LEDs |
| 3 W speaker (JST/3.5 mm) or USB speaker | for the neural voice |
| 7" DSI touchscreen (800x480) | shows the Hearth orb; optional, a 12-LED NeoPixel ring is the minimal build |
| WS2812B 12-LED ring (optional) | the glowing ring on top: cyan listening, violet thinking, amber speaking |
| Momentary button (optional) | GPIO 17 push-to-talk, for loud rooms |
| 5 V / 3 A USB-C supply, microSD 32 GB | |
| Cylindrical enclosure | see "Case" below |

## Install (Raspberry Pi OS 64-bit Bookworm)

```bash
sudo apt update && sudo apt install -y python3-venv libportaudio2 mpg123 espeak-ng chromium-browser
git clone <your repo> && cd legacylink/device
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
HEARTH_SERVER=http://<server>:3333 HEARTH_HOUSEHOLD=home HEARTH_TELLER="Grandma Rose" python hearth_device.py
```

* **Wake word ("Hey Hearth"), no training needed:** the default `HEARTH_WAKEWORD=phrase` uses a cheap loudness gate plus a short pass of the same offline Whisper model, so it recognises "Hey Hearth" (and "Hola Hearth", "你好 Hearth", ...) in any of the seven languages. It uses more CPU than a dedicated detector (fine on a Pi 5; use `tiny.en` on a Pi 4).
* **Lighter wake word:** `HEARTH_WAKEWORD=alexa` (or `hey_jarvis`, `hey_mycroft`) uses a pretrained openWakeWord model. For a dedicated "Hey Hearth" model, train one with the openWakeWord notebook (<https://github.com/dscripka/openWakeWord>, `notebooks/automatic_model_training.ipynb`; it generates synthetic training clips from text, takes about an hour on a free Colab GPU), then set `HEARTH_WAKEWORD=/path/hey_hearth.onnx`.
* **No wake word:** `HEARTH_WAKEWORD=button` with a GPIO button (`HEARTH_BUTTON_GPIO=17`), or press Enter on a keyboard.
* **Languages:** set `HEARTH_LANG` (`en es fr zh pt de hi`). Saying "switch to French" changes it on the fly. Use a multilingual Whisper model for non-English (`HEARTH_STT_MODEL=small`).
* **Account mode:** in the web app (*Hearth devices*, owner account) create a device token, then run with `HEARTH_SERVER=https://<your-app> HEARTH_TOKEN=<token>`. Tokens can be revoked from the same page.
* **Speech-to-text:** faster-whisper `base.en` runs offline on a Pi 5 (about 1–2 s per sentence). Use `tiny.en` on a Pi 4.
* **Voice out:** neural voices from the server (`/api/tts`). If the server is offline the device falls back to Piper (`HEARTH_PIPER_MODEL=/path/en_US-lessac-medium.onnx`) or espeak-ng.
* **Offline-first:** when the server is unreachable, what the elder says is queued in `~/.hearth_queue.jsonl` and replayed through the same MCP path when connectivity returns.

## Who is speaking? (voice recognition)

Say **"Hey Hearth, remember my voice"**: Hearth asks your name, then asks you to speak naturally three times and stores a voice print **on the device only** (`~/.hearth_voices.json`). Afterwards, the wake word alone gets *"Okay, that sounds like Victor Hayes. Is that right?"*; "yes" confirms, "no" makes it ask who you are and learn the name. When you speak a full request, a confident match just switches the speaker silently (no interruption).

* **Default engine:** built-in MFCC statistics: no downloads, demo-grade. It tells clearly different voices apart reliably and can confuse similar voices (siblings).
* **Better engine:** `sh get_speaker_model.sh` downloads one ~25 MB neural speaker model (you run it; nothing downloads automatically) and installs `sherpa-onnx`; then `export HEARTH_SPEAKER_MODEL=...` and re-enrol everyone. Written to the sherpa-onnx API but **not yet run against real voices**; the MFCC path is the one covered by tests.
* Tests: `python -m unittest device.test_device.SpeakerRecognition` generates four distinct neural voices (two Nigerian English) and checks enrolment, recognition of unseen sentences, rejection of strangers and the full "that sounds like..." conversation.
* Turn it off with `HEARTH_RECOGNISE_VOICES=0`. Delete everyone with `rm ~/.hearth_voices.json`.

## Try the pipeline without hardware

```bash
HEARTH_SERVER=http://localhost:3333 python hearth_device.py --simulate demo.txt   # one "heard" line per line
python -m unittest device/test_device.py
```

## Troubleshooting

* *No sound / wrong mic:* list devices with `python -m sounddevice`, then set `SD_DEFAULT_DEVICE`-style selection via `sounddevice.default.device` or ALSA's `~/.asoundrc`.
* *Wake word fires from the speaker's own voice:* lower the volume, move the mic away from the speaker, or use the ReSpeaker array's echo cancellation.
* *Slow replies:* use a smaller Whisper model, or enable `LEGACYLINK_TTS=polly` on the server (faster than the free voices).

## Screen (kiosk)

The same Hearth orb UI shows what the device is doing, driven by the device's live state stream:

```bash
chromium-browser --kiosk --noerrdialogs --disable-infobars "http://<server>:3333/?device=1&household=home"   # account mode: use ?device=1&token=<device token> instead
```

## Run on boot

```bash
sudo cp hearth.service /etc/systemd/system/ && sudo systemctl enable --now hearth
```

## Wiring

* NeoPixel ring: DIN → GPIO 18 (PWM), 5 V, GND (add a 330 Ω resistor in the data line). Set `HEARTH_LED=neopixel`.
* Button: GPIO 17 ↔ GND, set `HEARTH_BUTTON_GPIO=17`.
* ReSpeaker 2-Mic HAT: install its overlay (`seeed-voicecard`) and it appears as the default ALSA device.

## Case

A 110 mm diameter × 150 mm tall cylinder (3D-printed in matte warm-white PETG, or a wooden turned base) with a diffuser ring on top for the LEDs, an acoustic mesh band around the middle for the speaker and mics, and the 7" screen on the 3D-printed angled stand beside it if you want the orb visible. The kitchen demo page (`/kitchen.html`) shows the intended look.
