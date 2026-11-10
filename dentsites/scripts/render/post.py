"""Composite renders onto studio backgrounds and export responsive WebP files.

Usage: python3 scripts/render/post.py   (reads scripts/render/out, writes public/images)
"""
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).parent
OUT = HERE / "out"
DEST = HERE.parent.parent / "public" / "images"
DEST.mkdir(parents=True, exist_ok=True)


def hexrgb(h):
    return np.array([int(h[i : i + 2], 16) for i in (1, 3, 5)], dtype=np.float32)


def radial(size, inner, outer, centre=(0.5, 0.42), spread=0.85):
    w, h = size
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.hypot((x / w - centre[0]) * (w / max(w, h)), (y / h - centre[1]) * (h / max(w, h))) / spread
    t = np.clip(d, 0, 1)[..., None] ** 1.4
    rgb = hexrgb(inner) * (1 - t) + hexrgb(outer) * t
    # fine grain avoids banding in the gradients
    rgb += np.random.default_rng(7).normal(0, 0.9, rgb.shape)
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


# Studio backgrounds in the clinic palette (see src/config/clinic.ts).
IVORY = ("#f8f4ea", "#e6ddca")
SAGE = ("#e6ecdf", "#c2cfb8")
GREEN = ("#2f5a4b", "#10221c")


def over(name, bg, centre=(0.5, 0.42)):
    fg = Image.open(OUT / f"{name}.png").convert("RGBA")
    base = radial(fg.size, *bg, centre=centre)
    base.alpha_composite(fg)
    return base.convert("RGB")


def vignette(img, strength=0.3):
    w, h = img.size
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.hypot(x / w - 0.5, y / h - 0.45)
    k = 1 - strength * np.clip((d - 0.25) / 0.5, 0, 1) ** 1.5
    arr = np.asarray(img).astype(np.float32) * k[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")


def split(solid, wire, angle=0.3, start=0.42, end=0.6):
    w, h = solid.size
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    t = (x / w + (y / h - 0.5) * angle - start) / (end - start)
    m = np.clip(t, 0, 1)
    m = m * m * (3 - 2 * m)
    a = np.asarray(solid).astype(np.float32)
    b = np.asarray(wire).astype(np.float32)
    return Image.fromarray((a * (1 - m[..., None]) + b * m[..., None]).astype(np.uint8), "RGB")


def export(img, name, widths):
    for wd in widths:
        ht = round(img.size[1] * wd / img.size[0])
        img.resize((wd, ht), Image.LANCZOS).save(DEST / f"{name}-{wd}.webp", "WEBP", quality=82, method=6)
    print(name, img.size, widths)


export(vignette(over("hero", GREEN, (0.5, 0.45)), 0.22), "hero", [750, 1500])

# Before/after pairs share one background so only the teeth differ.
for name in ["implant", "full-arch", "veneers", "aligners"]:
    for phase in ["before", "after"]:
        export(vignette(over(f"case-{name}-{phase}", GREEN, (0.5, 0.48))), f"case-{name}-{phase}", [800, 1600])

for name in ["implant", "full-arch", "veneers", "emergency", "general"]:
    export(over(f"treat-{name}", SAGE if name in ("full-arch", "general") else IVORY), f"treat-{name}", [700, 1400])
# The aligner tray is rendered with its own opaque background (see shots.js).
export(Image.open(OUT / "treat-aligners.png").convert("RGB"), "treat-aligners", [700, 1400])

scan = split(over("tech-scan-solid", GREEN, (0.5, 0.48)), over("tech-scan-wire", GREEN, (0.5, 0.48)))
export(vignette(scan, 0.25), "tech-scan", [800, 1600])
export(over("tech-lab", IVORY), "tech-lab", [700, 1400])
