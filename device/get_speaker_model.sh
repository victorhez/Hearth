#!/bin/sh
# Optional: better voice recognition for the Hearth device (neural speaker embeddings via sherpa-onnx).
# Run this yourself; nothing downloads automatically. One file, about 25 MB, from the official sherpa-onnx releases.
# If the URL ever changes, find "speaker recognition models" at https://github.com/k2-fsa/sherpa-onnx/releases
set -e
cd "$(dirname "$0")"
mkdir -p models
curl -L -o models/wespeaker_en_voxceleb_resnet34.onnx \
  https://github.com/k2-fsa/sherpa-onnx/releases/download/speaker-recongition-models/wespeaker_en_voxceleb_resnet34.onnx
pip install sherpa-onnx
echo
echo "Done. Now run the device with:"
echo "  export HEARTH_SPEAKER_MODEL=$(pwd)/models/wespeaker_en_voxceleb_resnet34.onnx"
echo "Then re-enrol everyone (say: 'Hey Hearth, remember my voice'); voice prints from the other engine are not compatible."
