# gta6-cover-art-01-huaminyo-v4

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Huaminyo/gta6-cover-art-01-huaminyo-v4/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Huaminyo/gta6-cover-art-01-huaminyo-v4/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Golden Hour — Cover Studio**: a GTA VI-style cover maker with a warm
sunset-gold identity. Upload your own photos (or use the 10 golden-hour
samples) and turn them into a seven-panel crime-poster cover: a pop-out
hero close-up, straight panels with thin dividers, a striped
retro-chrome gold title, role tags, callouts, a quote bar, a WANTED
badge, a seal and a billing block. Everything runs in the browser,
offline — no server, no uploads leaving your device.

## What it does

- **7-panel cover, 10 layouts** — hero left / right / top / bottom /
  centre, mosaic and band arrangements; straight panels throughout.
- **Pop-out hero** — the hero close-up overlaps its neighbours with a
  drop shadow, framed on the face.
- **Face-aware crop** — where the browser offers FaceDetector, each
  photo is framed on its face; otherwise it centres. Double-click a
  panel to re-centre on the face.
- **Crop + position per panel** — click a panel, drag the photo inside
  it, zoom 100–200% with the slider, reset with one click.
- **One photo in several panels** — pick any photo from the strip for
  the selected panel; the same photo can appear anywhere.
- **Editable everything** — title, quote, callouts and role tags are
  all editable in place (click, type, Enter to save). Callouts drag.
- **Title over the art** — toggle the striped chrome-gold title
  between overlaying the hero and sitting below the grid.
- **9 colour grades** — Vice Gold (default), Palm Teal, Sunset Heat,
  Ocean Drive, Desert Dust, Blood Moon, Mono Chrome, Midnight Blue,
  Neon Noir. The grade tints the whole cover, screen and export alike.
- **Full-bleed mode** — the art fills the whole canvas, no frame.
- **Export PNG in 3 sizes** — 1:1 (2048×2048), 4:5 (2048×2560),
  16:9 (2560×1440), rendered on a real canvas and downloaded.
- **Auto-fill** — deals photos into the panels with a seeded shuffle,
  so the same seed always deals the same cover. **Reset** restores
  the samples and the default layout.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Hand it in with `MAKEFUN_OUTPUT_DIR=out node main.ts` (writes
`out/dossier.json` beside the copied app and screenshots).

## Files

- `app/index.html`, `app/style.css` — the studio shell and styling.
- `app/src/` — `main.js` (bootstrap + wiring), `state.js` (state,
  defaults, seeded random), `panels.js` (10 layouts + panel render),
  `facecrop.js` (FaceDetector framing), `grades.js` (9 grades),
  `captions.js` (inline editing + draggable callouts), `export.js`
  (canvas PNG render).
- `app/samples/` — 10 golden-hour photos (4 AI-generated portraits,
  6 CC-BY / public-domain photos via Openverse; see `CREDITS.md`).
- `app/fonts/` — Anton, Oswald, Yellowtail (OFL).
- `screenshots/` — 4 screenshots (1280×800, each under 256 KiB).
- `tools/` — `resave.py` (PIL re-save of the sample photos),
  `shots.py` (Playwright screenshots + verification).

---

<sub>Entered on [make.fun](https://make.fun/?ref=mdd2zzhy&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
