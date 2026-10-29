# Composite a transparent render onto a flat colour for quick inspection.
import sys
from PIL import Image
src, bg, out = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(src).convert("RGBA")
base = Image.new("RGBA", im.size, bg)
base.alpha_composite(im)
base.convert("RGB").save(out)
