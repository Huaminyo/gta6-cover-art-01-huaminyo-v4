#!/usr/bin/env python3
"""Re-save every sample photo through PIL in this session.

Sources: 4 media-generated portraits (media-generation-*.jpg) + 6
Openverse downloads (dl-*.jpg, CC-BY / public domain, see CREDITS.md).
Outputs: 01-driver.jpg .. 10-marina.jpg, max 1024 px on the long side,
JPEG quality stepped down until each file lands in 60-250 KiB.
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLES = os.path.join(HERE, "..", "app", "samples")

PAIRS = [
    ("media-generation-01-driver-0-1df181f8-0a1b-48c3-9725-8b89d573d89b.jpg", "01-driver.jpg"),
    ("media-generation-02-fixer-0-885dec66-e5a9-4654-b689-37561462e84e.jpg", "02-fixer.jpg"),
    ("media-generation-03-queen-0-bd6428fa-6ee8-4a32-8ba2-26c097e19699.jpg", "03-queen.jpg"),
    ("media-generation-04-rider-0-667b24de-cc59-465e-b7e6-36c104f5e1b5.jpg", "04-rider.jpg"),
    ("dl-05.jpg", "05-lookout.jpg"),
    ("dl-06.jpg", "06-wheelman.jpg"),
    ("dl-07.jpg", "07-palms.jpg"),
    ("dl-08.jpg", "08-boardwalk.jpg"),
    ("dl-09.jpg", "09-highway.jpg"),
    ("dl-10.jpg", "10-marina.jpg"),
]

for src_name, dst_name in PAIRS:
    src = os.path.join(SAMPLES, src_name)
    dst = os.path.join(SAMPLES, dst_name)
    img = Image.open(src).convert("RGB")
    img.thumbnail((1024, 1024), Image.LANCZOS)
    quality = 88
    while quality >= 55:
        img.save(dst, "JPEG", quality=quality, optimize=True, progressive=False)
        size = os.path.getsize(dst)
        if size <= 250 * 1024 or quality == 55:
            break
        quality -= 6
    print(f"{dst_name}: {img.size[0]}x{img.size[1]} {os.path.getsize(dst)} bytes (q={quality})")
print("done")
