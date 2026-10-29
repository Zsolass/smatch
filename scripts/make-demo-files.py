"""Generates the small sample attachments used by "Load example case".

All files are real files in their stated format and clearly marked as demo data.
Usage: python3 scripts/make-demo-files.py
"""
import math
import struct
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "demo-files"
OUT.mkdir(parents=True, exist_ok=True)


def arch_mesh(n_arc=72, n_ring=14, bumps=True, flip=False):
    """A horseshoe-shaped tube with tooth-like bumps: a stand-in for a dental arch scan."""
    verts = []
    for i in range(n_arc):
        t = -1.15 + 2.3 * i / (n_arc - 1)
        cx, cz = 24 * math.sin(t), 22 * math.cos(t) - 8
        tx, tz = math.cos(t), -math.sin(t)
        nx, nz = -tz, tx  # outward normal in the xz plane
        bump = 1.0 + (0.18 * abs(math.sin(i * math.pi / 4.5)) if bumps else 0)
        for j in range(n_ring):
            a = 2 * math.pi * j / n_ring
            r = 5.0 * bump
            u = math.cos(a) * r
            v = math.sin(a) * r * 0.8
            y = v if not flip else -v
            verts.append((cx + nx * u, y, cz + nz * u))
    tris = []
    for i in range(n_arc - 1):
        for j in range(n_ring):
            a = i * n_ring + j
            b = i * n_ring + (j + 1) % n_ring
            c = (i + 1) * n_ring + j
            d = (i + 1) * n_ring + (j + 1) % n_ring
            tris += [(a, c, b), (b, c, d)]
    # cap both ends
    for end, sign in ((0, 1), (n_arc - 1, -1)):
        centre = np.mean([verts[end * n_ring + j] for j in range(n_ring)], axis=0)
        verts.append(tuple(centre))
        ci = len(verts) - 1
        for j in range(n_ring):
            a = end * n_ring + j
            b = end * n_ring + (j + 1) % n_ring
            tris.append((ci, a, b) if sign > 0 else (ci, b, a))
    return np.array(verts, dtype=np.float32), tris


def write_binary_stl(path, verts, tris, header):
    with open(path, "wb") as f:
        f.write(header.encode("ascii").ljust(80, b" ")[:80])
        f.write(struct.pack("<I", len(tris)))
        for a, b, c in tris:
            p, q, r = verts[a], verts[b], verts[c]
            n = np.cross(q - p, r - p)
            ln = np.linalg.norm(n) or 1.0
            f.write(struct.pack("<12fH", *(n / ln), *p, *q, *r, 0))


def write_ascii_ply(path, verts, tris, comment):
    with open(path, "w", encoding="ascii") as f:
        f.write("ply\nformat ascii 1.0\n")
        f.write(f"comment {comment}\n")
        f.write(f"element vertex {len(verts)}\nproperty float x\nproperty float y\nproperty float z\n")
        f.write(f"element face {len(tris)}\nproperty list uchar int vertex_indices\nend_header\n")
        for v in verts:
            f.write(f"{v[0]:.3f} {v[1]:.3f} {v[2]:.3f}\n")
        for t in tris:
            f.write(f"3 {t[0]} {t[1]} {t[2]}\n")


v, t = arch_mesh()
write_binary_stl(OUT / "DEMO-001_upper-scan.stl", v, t, "DEMO-001 upper scan - SAMPLE FILE, not patient data")
v, t = arch_mesh(flip=True)
write_binary_stl(OUT / "DEMO-001_lower-scan.stl", v, t, "DEMO-001 lower scan - SAMPLE FILE, not patient data")
v, t = arch_mesh(n_arc=40, n_ring=8, bumps=False)
v[:, 1] *= 0.35
write_ascii_ply(OUT / "DEMO-001_bite-scan.ply", v, t, "DEMO-001 bite scan - SAMPLE FILE, not patient data")

# Shade photo: a crop of the veneer render with a clear DEMO label.
src = Image.open(Path(__file__).resolve().parent.parent / "public" / "images" / "case-veneers-800.webp").convert("RGB")
w, h = src.size
photo = src.crop((int(w * 0.12), int(h * 0.18), int(w * 0.88), int(h * 0.82))).resize((640, 480), Image.LANCZOS)
d = ImageDraw.Draw(photo)
d.rectangle((0, 440, 640, 480), fill=(14, 31, 35))
d.text((14, 452), "DEMO-001 shade photo  |  SAMPLE IMAGE - not a patient  |  shade tab A2", fill=(255, 255, 255))
photo.save(OUT / "DEMO-001_shade-photo.jpg", "JPEG", quality=82)


def pdf_escape(s):
    return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


lines = [
    ("F2", 18, "DEMO PRESCRIPTION - SAMPLE DOCUMENT"),
    ("F1", 10, "Fictional case for the Smatch Demo Lab website. Not a real prescription or patient."),
    ("F1", 11, ""),
    ("F1", 11, "Practice: Northfield Dental Studio (demo)"),
    ("F1", 11, "Dentist: Dr. Alex Sample"),
    ("F1", 11, "Case reference / patient code: DEMO-001"),
    ("F1", 11, ""),
    ("F2", 12, "Restoration"),
    ("F1", 11, "Three-unit bridge 13-15, monolithic zirconia, shade A2"),
    ("F1", 11, "13 abutment  |  14 pontic (ovate)  |  15 abutment"),
    ("F1", 11, ""),
    ("F2", 12, "Attached files"),
    ("F1", 11, "Upper scan (STL), lower scan (STL), bite scan (PLY), shade photo (JPG)"),
    ("F1", 11, ""),
    ("F2", 12, "Notes for the lab"),
    ("F1", 11, "Keep canine guidance. Light contacts. Call the practice if margins on 15 are unclear."),
]
content = ["BT", "50 780 Td"]
first = True
for font, size, text in lines:
    if not first:
        content.append(f"0 -{int(size * 1.7)} Td")
    first = False
    content.append(f"/{font} {size} Tf ({pdf_escape(text)}) Tj")
content.append("ET")
stream = "\n".join(content).encode("latin-1")
objects = [
    b"<< /Type /Catalog /Pages 2 0 R >>",
    b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>",
    b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    b"<< /Title (DEMO-001 sample prescription) /Producer (Smatch demo) >>",
]
pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
offsets = []
for i, body in enumerate(objects, start=1):
    offsets.append(len(pdf))
    pdf += f"{i} 0 obj\n".encode() + body + b"\nendobj\n"
xref = len(pdf)
pdf += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
for off in offsets:
    pdf += f"{off:010d} 00000 n \n".encode()
pdf += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
(OUT / "DEMO-001_prescription.pdf").write_bytes(pdf)

for f in sorted(OUT.iterdir()):
    print(f.name, f.stat().st_size)
