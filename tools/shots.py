#!/usr/bin/env python3
"""Playwright verification + screenshots for Golden Hour — Cover Studio.

Expects the dev server running (node serve.ts --port 8102) and writes
the 4 screenshots from shots.json into screenshots/ (1280x800 JPEG,
each under 256 KiB). Runs the interaction checks and prints a
pass/fail line per check plus a summary. Exits non-zero on failure.
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.join(HERE, "..")
BASE = "http://127.0.0.1:8102"

CHECKS = []


def check(name, ok, detail=""):
    CHECKS.append((name, bool(ok)))
    print(f"[{'PASS' if ok else 'FAIL'}] {name} {detail}")


def main():
    with open(os.path.join(REPO, "shots.json")) as f:
        shots = json.load(f)

    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        page.goto(BASE + "/", wait_until="networkidle")
        page.wait_for_function("window.__goldenHourReady === true", timeout=30000)
        check("page loads + ready flag", True)

        # FaceDetector availability + face-aware crop on load.
        has_fd = page.evaluate("() => 'FaceDetector' in window")
        offsets = page.evaluate(
            """() => Array.from(document.querySelectorAll('.panel img'))
                 .map(img => img.style.objectPosition)"""
        )
        print(f"  FaceDetector available: {has_fd}; panel object-positions: {offsets}")
        check("7 panels rendered", page.locator(".panel").count() == 7)
        check(
            "face-aware crop ran (hero offset set)",
            offsets[0] != "" and offsets[0] != "50% 50%" if has_fd else offsets[0] == "50% 50%",
            f"hero={offsets[0]}",
        )

        # Drag reposition on panel 5 (middle-right, clear of the title
        # and callouts): drag left 60px, offset must change.
        before = page.evaluate(
            "() => document.querySelectorAll('.panel img')[4].style.objectPosition"
        )
        box = page.locator(".panel").nth(4).bounding_box()
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.mouse.down()
        page.mouse.move(box["x"] + box["width"] / 2 - 60, box["y"] + box["height"] / 2, steps=8)
        page.mouse.up()
        after = page.evaluate(
            "() => document.querySelectorAll('.panel img')[4].style.objectPosition"
        )
        check("drag repositions photo", before != after, f"{before} -> {after}")

        # Zoom slider on the selected panel.
        page.locator("#zoom-slider").fill("160")
        page.locator("#zoom-slider").dispatch_event("input")
        zoomed = page.evaluate(
            "() => document.querySelectorAll('.panel img')[4].style.transform"
        )
        check("zoom slider scales photo", "1.6" in zoomed, zoomed)

        # Caption edit: title.
        page.locator("#cover-title").click()
        page.keyboard.press("Control+a")
        page.keyboard.type("SUNSET CREW")
        page.keyboard.press("Enter")
        title = page.locator("#cover-title").inner_text()
        check("title editable inline", title.strip() == "SUNSET CREW", title)
        # Restore the default title for the screenshots.
        page.locator("#cover-title").click()
        page.keyboard.press("Control+a")
        page.keyboard.type("GOLDEN HOUR")
        page.keyboard.press("Enter")

        # Grade switch.
        page.locator(".grade-btn", has_text="Sunset Heat").click()
        tint = page.evaluate("() => document.getElementById('cover-tint').style.background")
        check("grade switch changes tint", "255, 90, 40" in tint, tint[:60])
        page.locator(".grade-btn", has_text="Vice Gold").click()

        # Layout switch.
        page.locator(".layout-btn", has_text="Hero Top").click()
        areas = page.evaluate(
            "() => document.getElementById('cover-grid').style.gridTemplateAreas"
        )
        check("layout switch changes grid", '"h h h"' in areas, areas[:60])
        page.locator(".layout-btn", has_text="Hero Left").click()

        # Upload: feed one sample photo through the file input.
        sample = os.path.join(REPO, "app", "samples", "05-lookout.jpg")
        page.set_input_files("#file-input", sample)
        page.wait_for_timeout(800)
        thumbs = page.locator(".photo-thumb").count()
        check("upload adds a photo thumb", thumbs == 11, f"thumbs={thumbs}")

        # Export 1:1: real PNG 2048x2048.
        with page.expect_download(timeout=30000) as dl_info:
            page.locator("#btn-export").click()
            page.locator("#export-list button[data-size='1:1']").click()
        download = dl_info.value
        out_path = "/tmp/golden-hour-export-1x1.png"
        download.save_as(out_path)
        from PIL import Image, ImageStat

        with Image.open(out_path) as im:
            check(
                "export 1:1 is a real 2048x2048 PNG",
                im.format == "PNG" and im.size == (2048, 2048),
                f"{im.format} {im.size} {os.path.getsize(out_path)} bytes",
            )
            # Content check: a photo-filled cover has real colour
            # variance; an empty (background-only) render is near-flat.
            stat = ImageStat.Stat(im.convert("RGB"))
            spread = sum(stat.stddev) / 3
            check("export actually contains photos", spread > 25, f"mean channel stddev={spread:.1f}")

        # Screenshots per shots.json.
        os.makedirs(os.path.join(REPO, "screenshots"), exist_ok=True)
        for shot in shots:
            page.goto(BASE + "/" + shot["query"], wait_until="networkidle")
            page.wait_for_function("window.__goldenHourReady === true", timeout=30000)
            page.wait_for_timeout(600)
            path = os.path.join(REPO, "screenshots", shot["name"])
            page.screenshot(path=path, type="jpeg", quality=82)
            size = os.path.getsize(path)
            check(f"screenshot {shot['name']} < 256 KiB", size < 262144, f"{size} bytes")

        check("0 JS errors", len(errors) == 0, f"errors={errors[:3]}")
        browser.close()

    failed = [name for name, ok in CHECKS if not ok]
    print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} checks passed")
    if failed:
        print("FAILED:", ", ".join(failed))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
