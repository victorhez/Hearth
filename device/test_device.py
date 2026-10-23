"""Device pipeline tests against a real LegacyLink server (everything except microphone, Whisper and speaker).
Run:  python -m unittest device/test_device.py   (needs Node and `npm install` done in the repo root)"""
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
import unittest
import wave

import numpy as np
import requests

sys.path.insert(0, os.path.dirname(__file__))
import hearth_device as hd  # noqa: E402
import speaker as spk  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


def start_server(accounts=False):
    port, data = free_port(), tempfile.mkdtemp(prefix="ll-dev-")
    env = {**os.environ, "PORT": str(port), "LEGACYLINK_DATA_DIR": data, "LEGACYLINK_ACCOUNTS": "1" if accounts else ""}
    proc = subprocess.Popen(["node", "src/server.mjs"], cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    for _ in range(60):
        try:
            requests.get(f"http://127.0.0.1:{port}/health", timeout=0.5)
            break
        except Exception:
            time.sleep(0.25)
    else:
        proc.kill()
        raise RuntimeError("server did not start")
    return proc, port, data


class WakePhrase(unittest.TestCase):
    def test_wakes_in_each_language(self):
        for text, rest in [("Hey Hearth, what did Dad say about fishing?", "what did Dad say about fishing?"), ("hey heart I want to tell you a story", "I want to tell you a story"),
                           ("Hola Hearth, quiero contarte una historia", "quiero contarte una historia"), ("你好 Hearth，我想讲一个故事", "我想讲一个故事"),
                           ("नमस्ते Hearth, मैं एक कहानी सुनाना चाहता हूँ", "मैं एक कहानी सुनाना चाहता हूँ"), ("Hearth", "")]:
            woke, got = hd.strip_wake(text)
            self.assertTrue(woke, text)
            self.assertEqual(got, rest, text)

    def test_ordinary_speech_does_not_wake(self):
        for text in ["It was hard in those days", "my heart was racing", "we sat by the hearth that winter", ""]:
            self.assertFalse(hd.strip_wake(text)[0], text)


class Pipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.proc, cls.port, cls.data = start_server()
        cls.url = f"http://127.0.0.1:{cls.port}"
        requests.post(cls.url + "/api/demo/reset", headers={"x-household": "home"})

    @classmethod
    def tearDownClass(cls):
        cls.proc.kill()
        shutil.rmtree(cls.data, ignore_errors=True)

    def device(self, **kw):
        q = tempfile.mktemp(suffix=".jsonl")
        self.addCleanup(lambda: os.path.exists(q) and os.unlink(q))
        return hd.Device(server=kw.pop("server", self.url), queue_file=q, play_audio=False, **kw)

    def archive_count(self):
        return len(requests.get(self.url + "/api/archive", headers={"x-household": "home"}).json()["memories"])

    def test_interview_retrieval_and_state_events(self):
        events = []

        def listen():
            with requests.get(self.url + "/api/device/events", headers={"x-household": "home"}, stream=True) as r:
                for line in r.iter_lines():
                    if line.startswith(b"data:"):
                        events.append(json.loads(line[5:]))
                    if len(events) > 40:
                        break

        threading.Thread(target=listen, daemon=True).start()
        time.sleep(0.5)
        before, dev = self.archive_count(), self.device()
        out = dev.handle("I want to tell you a story")
        self.assertEqual(out["mode"], "story")
        self.assertEqual(dev.mode, "story")
        dev.handle("In 1999 we drove to Lagos and I was so happy.")
        dev.handle("that's all")
        self.assertEqual(self.archive_count(), before + 1)
        out = dev.handle("what did Rose say about her first job?")
        self.assertIn("Kowalski", out["reply"])
        time.sleep(0.5)
        states = {e.get("state") for e in events if e["type"] == "state"}
        self.assertTrue({"thinking", "speaking"} <= states, states)
        self.assertTrue(any(e["type"] == "reply" for e in events))

    def test_voice_language_switch_updates_device(self):
        dev = self.device()
        dev.handle("switch to French")
        self.assertEqual(dev.lang, "fr")
        out = dev.handle("Qu'est-ce que Mamie Colette a dit sur le pain ?")
        self.assertIn("pain", out["reply"])

    def test_offline_queue_then_sync(self):
        dead = self.device(server="http://127.0.0.1:9")
        dead.handle("In 2003 we visited Accra and I was proud of my daughter.")
        self.assertTrue(os.path.exists(dead.queue_file))
        self.assertTrue(any("offline" in s or "can't reach" in s for s in dead.spoken))
        before = self.archive_count()
        live = hd.Device(server=self.url, queue_file=dead.queue_file, play_audio=False)
        self.assertEqual(live.sync_queue(), 1)
        self.assertEqual(self.archive_count(), before + 1)
        self.assertEqual(open(dead.queue_file).read().strip(), "")

    def test_simulate_script(self):
        script = tempfile.mktemp(suffix=".txt")
        open(script, "w", encoding="utf8").write("it was a quiet evening\nHey Hearth, who has shared stories?\n")
        env = {**os.environ, "HEARTH_SERVER": self.url, "HEARTH_QUEUE": tempfile.mktemp()}
        r = subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "hearth_device.py"), "--simulate", script], env=env, capture_output=True, text=True, timeout=60)
        os.unlink(script)
        self.assertIn("(asleep, ignored)", r.stdout)
        self.assertIn("In the family archive", r.stdout)


class DeviceToken(unittest.TestCase):
    def test_device_token_with_accounts(self):
        proc, port, data = start_server(accounts=True)
        try:
            url = f"http://127.0.0.1:{port}"
            owner = requests.post(url + "/api/auth/signup", json={"email": "o@x.com", "password": "correct horse", "name": "Olu"}).json()
            tok = requests.post(url + "/api/devices", json={"label": "Kitchen"}, headers={"authorization": "Bearer " + owner["token"]}).json()["token"]
            dev = hd.Device(server=url, token=tok, queue_file=tempfile.mktemp(), play_audio=False)
            out = dev.handle("who has shared stories?")
            self.assertIsNotNone(out)
            self.assertEqual(requests.get(url + "/api/archive").status_code, 401)
        finally:
            proc.kill()
            shutil.rmtree(data, ignore_errors=True)


def load_wav(path):
    w = wave.open(path)
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)


class SpeakerRecognition(unittest.TestCase):
    """Uses four distinct neural voices (two Nigerian English, two US English), generated on the fly with the project's own TTS."""

    @classmethod
    def setUpClass(cls):
        cls.dir = tempfile.mkdtemp(prefix="ll-voices-")
        r = subprocess.run(["node", "device/tools/make_test_voices.mjs", cls.dir], cwd=ROOT, capture_output=True, text=True, timeout=240)
        if r.returncode != 0:
            raise unittest.SkipTest("could not generate test voices (needs internet for the TTS service): " + r.stderr[-200:])
        cls.audio = {f[:-4]: load_wav(os.path.join(cls.dir, f)) for f in os.listdir(cls.dir)}
        cls.proc, cls.port, cls.data = start_server()
        cls.url = f"http://127.0.0.1:{cls.port}"

    @classmethod
    def tearDownClass(cls):
        cls.proc.kill()
        shutil.rmtree(cls.data, ignore_errors=True)
        shutil.rmtree(cls.dir, ignore_errors=True)

    def book(self, people, hold=3):
        vb = spk.VoiceBook(path=tempfile.mktemp(suffix=".json"), embedder=spk.Embedder())
        for n in people:
            vb.enroll(n, [self.audio[f"{n}_{i}"] for i in range(4) if i != hold])
        return vb

    def test_identifies_held_out_sentences(self):
        names = ["abeo", "ezinne", "guy", "jenny"]
        for hold in range(4):
            vb = self.book(names, hold)
            for n in names:
                got, score = vb.identify(self.audio[f"{n}_{hold}"])
                self.assertEqual(got, n, f"hold {hold}: {n} heard as {got} ({score:.2f})")
                self.assertGreater(score, 0.25)

    def test_unknown_voice_scores_low(self):
        vb = self.book(["abeo", "ezinne"], 3)
        for stranger in ["guy", "jenny"]:
            _, score = vb.identify(self.audio[f"{stranger}_3"])
            self.assertLess(score, 0.25, f"{stranger} should not look like a family member")

    def test_voicebook_persists(self):
        vb = self.book(["abeo", "guy"])
        again = spk.VoiceBook(path=vb.path, embedder=spk.Embedder())
        self.assertEqual(sorted(again.people), ["abeo", "guy"])
        self.assertEqual(again.identify(self.audio["guy_3"])[0], "guy")

    def device(self, vb):
        q = tempfile.mktemp(suffix=".jsonl")
        return hd.Device(server=self.url, queue_file=q, play_audio=False, voicebook=vb, teller="Guest")

    def test_wake_word_only_then_confirm(self):
        """The demo moment: 'Hey Hearth' -> 'Okay, that sounds like Victor. Is that right?' -> 'Yes' -> hello Victor."""
        vb = self.book(["abeo"])
        vb.people["Victor Hayes"] = vb.people.pop("abeo")
        dev = self.device(vb)
        out = dev.handle("", self.audio["abeo_3"])
        self.assertIn("sounds like Victor Hayes", out["reply"])
        self.assertEqual(dev.mode, "confirm")
        out = dev.handle("yes", self.audio["abeo_3"])
        self.assertEqual(dev.teller, "Victor Hayes")
        self.assertIn("Victor Hayes", out["reply"])

    def test_stranger_is_not_named(self):
        dev = self.device(self.book(["abeo", "ezinne"]))
        out = dev.handle("", self.audio["guy_3"])
        self.assertNotIn("sounds like", out["reply"])

    def test_remember_my_voice_flow(self):
        vb = spk.VoiceBook(path=tempfile.mktemp(suffix=".json"), embedder=spk.Embedder())
        dev = self.device(vb)
        out = dev.handle("remember my voice")
        self.assertEqual(out["action"], "enroll")
        clips = iter([self.audio["ezinne_0"], self.audio["ezinne_1"], self.audio["ezinne_2"], self.audio["ezinne_3"]])
        heard_name = iter(["it's Ada"])
        name = dev.enroll_flow(lambda: next(clips), lambda a: next(heard_name, ""))
        self.assertEqual(name, "Ada")
        self.assertEqual(dev.teller, "Ada")
        self.assertEqual(len(vb.people["Ada"]), 3)
        self.assertTrue(any("Ada" in s for s in dev.spoken))
        # and afterwards the device knows her
        self.assertEqual(vb.identify(self.audio["ezinne_3"])[0], "Ada")


if __name__ == "__main__":
    unittest.main()
