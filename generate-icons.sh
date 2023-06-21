#!/bin/bash

set -euo pipefail

sizes=(16 19 32 38 48 64 96 128 256 512)

for size in "${sizes[@]}"; do
    rsvg-convert -h "$size" ./src/icon.svg > "public/icons/$size.png"
done
