"""Composite renders onto studio backgrounds and export responsive WebP files.

Usage: python3 scripts/render/post.py   (reads scripts/render/out, writes public/images)
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

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


LIGHT = ("#f7f5f0", "#e4dfd5")
DARK = ("#21434b", "#0b181c")


def over(name, bg, centre=(0.5, 0.42)):
    fg = Image.open(OUT / f"{name}.png").convert("RGBA")
    base = radial(fg.size, *bg, centre=centre)
    base.alpha_composite(fg)
    return base.convert("RGB")


def vignette(img, strength=0.35):
    w, h = img.size
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.hypot(x / w - 0.5, y / h - 0.45)
    k = 1 - strength * np.clip((d - 0.25) / 0.5, 0, 1) ** 1.5
    arr = np.asarray(img).astype(np.float32) * k[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")


def split(solid, wire, angle=0.35, start=0.48, end=0.68):
    w, h = solid.size
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    t = (x / w + (y / h - 0.5) * angle - start) / (end - start)
    m = np.clip(t, 0, 1)
    m = m * m * (3 - 2 * m)
    a = np.asarray(solid).astype(np.float32)
    b = np.asarray(wire).astype(np.float32)
    return Image.fromarray((a * (1 - m[..., None]) + b * m[..., None]).astype(np.uint8), "RGB")


def export(img, name, widths, aspect=None):
    if aspect:
        w, h = img.size
        target_h = int(w / aspect)
        if target_h < h:
            top = (h - target_h) // 2
            img = img.crop((0, top, w, top + target_h))
    for wd in widths:
        ht = round(img.size[1] * wd / img.size[0])
        img.resize((wd, ht), Image.LANCZOS).save(DEST / f"{name}-{wd}.webp", "WEBP", quality=82, method=6)
    print(name, img.size, widths)


hero = split(over("hero-solid", DARK, (0.5, 0.48)), over("hero-wire", DARK, (0.5, 0.48)))
export(vignette(hero, 0.25), "hero", [800, 1400])

for name in ["crowns-bridges", "implants", "full-arch", "veneers", "dentures"]:
    export(over(f"service-{name}", LIGHT), f"service-{name}", [600, 1200])
splint = Image.open(OUT / "service-splints.png").convert("RGB")
export(splint, "service-splints", [600, 1200])

for name in ["bridge", "implant", "veneers", "full-arch", "denture"]:
    export(vignette(over(f"case-{name}", DARK)), f"case-{name}", [800, 1600])
export(vignette(Image.open(OUT / "case-splint.png").convert("RGB")), "case-splint", [800, 1600])

cad = split(over("cad-solid", DARK), over("cad-wire", DARK), angle=0.2, start=0.4, end=0.6)
export(vignette(cad, 0.3), "cad-design", [800, 1600])
