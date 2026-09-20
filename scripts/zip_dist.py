"""Zip dist/ into nirvasan-dist.zip for Amplify's drag-and-drop upload.

Windows PowerShell's Compress-Archive writes entry names with backslashes ("assets\\index.js"),
which Amplify's Linux hosting treats as one odd filename, so every asset 404s and the page is blank.
This writes forward-slash names with index.html at the root.

    node node_modules/vite/bin/vite.js build
    python scripts/zip_dist.py
"""
import sys
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
dist = root / "dist"
target = root / "nirvasan-dist.zip"

if not (dist / "index.html").is_file():
    sys.exit("dist/index.html not found: run the build first")

target.unlink(missing_ok=True)
with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(dist.rglob("*")):
        if path.is_file():
            archive.write(path, path.relative_to(dist).as_posix())

with zipfile.ZipFile(target) as archive:
    names = archive.namelist()
assert "index.html" in names and not any("\\" in name for name in names)
print(f"{target.name}: {len(names)} files, {target.stat().st_size // 1024} KB")
