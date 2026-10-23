"""
Who is speaking? Lightweight voice recognition for the Hearth device, so it can say "Okay, that sounds like Victor."

Two embedding back-ends:
  * sherpa-onnx speaker-embedding model (recommended; neural, far more accurate, runs on a Pi 4/5):
        pip install sherpa-onnx
        sh device/get_speaker_model.sh        # downloads one ~25 MB ONNX model; you run it, nothing downloads automatically
        export HEARTH_SPEAKER_MODEL=device/models/wespeaker_en_voxceleb_resnet34.onnx
  * built-in MFCC statistics (no downloads; DEMO-GRADE): fine for telling clearly different voices apart
    (e.g. a man, a woman, a child), unreliable for siblings with similar voices. Use the neural model for real use.

Voices are stored locally in a JSON file (HEARTH_VOICES, default ~/.hearth_voices.json). Nothing leaves the device.
"""
import json
import math
import os

import numpy as np

RATE = 16000
VOICES_FILE = os.environ.get("HEARTH_VOICES", os.path.expanduser("~/.hearth_voices.json"))


# ---------------- embeddings ----------------
def _mel_filterbank(n_mels, n_fft, rate):
    def hz2mel(h): return 2595 * math.log10(1 + h / 700)
    def mel2hz(m): return 700 * (10 ** (m / 2595) - 1)
    pts = np.linspace(hz2mel(80), hz2mel(rate / 2 - 100), n_mels + 2)
    bins = np.floor((n_fft + 1) * np.array([mel2hz(p) for p in pts]) / rate).astype(int)
    fb = np.zeros((n_mels, n_fft // 2 + 1))
    for m in range(1, n_mels + 1):
        l, c, r = bins[m - 1], bins[m], bins[m + 1]
        for k in range(l, c): fb[m - 1, k] = (k - l) / max(1, c - l)
        for k in range(c, r): fb[m - 1, k] = (r - k) / max(1, r - c)
    return fb


_FB = None


def mfcc_embedding(samples, rate=RATE, n_mfcc=20):
    """Mean + std of MFCCs over the voiced frames (c0 dropped), plus mean log-mel energy: a crude but dependency-free voice print."""
    global _FB
    x = np.asarray(samples, dtype=np.float32)
    if x.dtype != np.float32 or np.abs(x).max() > 1.5:
        x = x / 32768.0
    x = np.append(x[0], x[1:] - 0.97 * x[:-1])  # pre-emphasis
    n_fft, hop, win = 512, 160, 400
    if len(x) < win * 3:
        raise ValueError("audio too short")
    frames = np.stack([x[i:i + win] * np.hamming(win) for i in range(0, len(x) - win, hop)])
    energy = np.log(np.sum(frames ** 2, axis=1) + 1e-9)
    voiced = energy > (np.percentile(energy, 30) + 0.5 * (np.percentile(energy, 95) - np.percentile(energy, 30)) * 0.3)
    frames = frames[voiced]
    if len(frames) < 10:
        raise ValueError("not enough speech")
    if _FB is None:
        _FB = _mel_filterbank(26, n_fft, rate)
    spec = np.abs(np.fft.rfft(frames, n_fft)) ** 2
    logmel = np.log(spec @ _FB.T + 1e-9)
    n = logmel.shape[1]
    dct = np.cos(np.pi / n * (np.arange(n) + 0.5)[None, :] * np.arange(n_mfcc)[:, None])
    mf = logmel @ dct.T
    mf = mf[:, 1:]
    return np.concatenate([mf.mean(0), mf.std(0), logmel.mean(0) - logmel.mean()])


class Embedder:
    def __init__(self, model_path=None):
        self.model_path = model_path or os.environ.get("HEARTH_SPEAKER_MODEL")
        self.neural = None
        if self.model_path and os.path.exists(self.model_path):
            try:
                import sherpa_onnx  # pip install sherpa-onnx
                cfg = sherpa_onnx.SpeakerEmbeddingExtractorConfig(model=self.model_path, num_threads=2)
                self.neural = sherpa_onnx.SpeakerEmbeddingExtractor(cfg)
            except Exception as e:
                print("neural speaker model unavailable (", e, ") -> using built-in MFCC voice prints")
        self.kind = "neural" if self.neural else "mfcc"

    def embed(self, samples, rate=RATE):
        if self.neural is not None:
            x = np.asarray(samples, dtype=np.float32)
            if np.abs(x).max() > 1.5:
                x = x / 32768.0
            s = self.neural.create_stream()
            s.accept_waveform(sample_rate=rate, waveform=x)
            s.input_finished()
            return np.array(self.neural.compute(s), dtype=np.float32)
        return mfcc_embedding(samples, rate)


# ---------------- the family's voice book ----------------
class VoiceBook:
    def __init__(self, path=VOICES_FILE, embedder=None):
        self.path, self.emb = path, embedder or Embedder()
        self.people = {}  # name -> list of embedding vectors
        if os.path.exists(path):
            try:
                data = json.load(open(path, encoding="utf8"))
                if data.get("kind") == self.emb.kind:  # prints from another back-end are not comparable
                    self.people = {n: [np.array(v, dtype=np.float32) for v in vs] for n, vs in data["people"].items()}
            except Exception:
                pass

    def save(self):
        with open(self.path, "w", encoding="utf8") as f:
            json.dump({"kind": self.emb.kind, "people": {n: [v.tolist() for v in vs] for n, vs in self.people.items()}}, f)

    def enroll(self, name, samples_list):
        vecs = [self.emb.embed(s) for s in samples_list]
        self.people.setdefault(name, []).extend(vecs)
        self.save()
        return len(self.people[name])

    def forget(self, name):
        self.people.pop(name, None)
        self.save()

    # -- scoring --
    def _scale(self):
        allv = [v for vs in self.people.values() for v in vs]
        if self.emb.kind == "neural" or len(allv) < 4:
            return None
        sd = np.std(np.stack(allv), axis=0)  # per-dimension scale from everything enrolled: whitening
        return np.maximum(sd, 1e-3)

    def identify(self, samples, rate=RATE):
        """Returns (name, score 0..1) or (None, 0). Score >= ~0.7 is a confident match."""
        if not self.people:
            return None, 0.0
        try:
            v = self.emb.embed(samples, rate)
        except ValueError:
            return None, 0.0
        if self.emb.kind == "neural":  # cosine similarity
            best, bs = None, -1.0
            for n, vs in self.people.items():
                c = np.mean([self._cos(v, e) for e in vs])
                if c > bs:
                    best, bs = n, c
            return (best, float(max(0.0, min(1.0, (bs - 0.2) / 0.5 + 0.0)))) if bs > 0.3 else (None, 0.0)
        scale = self._scale()
        ds = {}
        for n, vs in self.people.items():
            cen = np.mean(np.stack(vs), axis=0)
            diff = (v - cen) / (scale if scale is not None else 1.0)
            ds[n] = float(np.sqrt(np.mean(diff ** 2)))
        order = sorted(ds.items(), key=lambda kv: kv[1])
        best, d = order[0]
        margin = (order[1][1] - d) / (order[1][1] + 1e-9) if len(order) > 1 else 0.5
        closeness = math.exp(-d)  # d ~ 0 => 1.0
        return best, float(max(0.0, min(1.0, 0.5 * closeness + 0.5 * min(1.0, margin * 2))))

    @staticmethod
    def _cos(a, b):
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))
