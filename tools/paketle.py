#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cezeri'nin Çocukluk Odası — SCORM 1.2 Zip Paketleyici

imsmanifest.xml kök dizinde olacak şekilde cezeri-oda içeriğini
EBA uyumlu SCORM 1.2 .zip paketine dönüştürür.
"""

import argparse
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

EXCLUDED_DIRS = {"tools", "__pycache__", ".git", ".github", ".vscode"}
EXCLUDED_FILES = {
    ".DS_Store",
    "Thumbs.db",
    ".gitkeep",
    ".gitignore",
    ".gitattributes",
    ".nojekyll",
    "README.md",
    "LICENSE",
    "LICENSE.md",
}


def collect_runtime_files(package_root: Path) -> list[Path]:
    files: list[Path] = []
    for path in sorted(package_root.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(package_root)
        if any(part in EXCLUDED_DIRS for part in rel.parts):
            continue
        if path.name in EXCLUDED_FILES or path.suffix.lower() == ".zip":
            continue
        files.append(path)
    return files


def validate_manifest(manifest_path: Path, package_root: Path, runtime_files: list[Path]) -> None:
    if not manifest_path.is_file():
        raise FileNotFoundError(f"imsmanifest.xml bulunamadı: {manifest_path}")

    tree = ET.parse(manifest_path)
    root = tree.getroot()

    listed_hrefs: set[str] = set()
    for elem in root.iter():
        if elem.tag.endswith("}file") or elem.tag == "file":
            href = elem.attrib.get("href", "").strip()
            if href:
                listed_hrefs.add(href.replace("\\", "/"))

    if not listed_hrefs:
        raise ValueError("imsmanifest.xml içinde hiç <file href=\"...\"/> tanımı yok.")

    missing_on_disk = [
        href for href in sorted(listed_hrefs) if not (package_root / href).is_file()
    ]
    if missing_on_disk:
        raise FileNotFoundError(
            "imsmanifest.xml içinde listelenen ancak diskte bulunmayan dosyalar: "
            + ", ".join(missing_on_disk)
        )

    runtime_rels = {
        path.relative_to(package_root).as_posix()
        for path in runtime_files
        if path.name != "imsmanifest.xml"
    }
    unlisted_on_disk = sorted(runtime_rels - listed_hrefs)
    if unlisted_on_disk:
        print(
            "UYARI: Diskte olup imsmanifest.xml içinde listelenmeyen dosyalar var:\n  - "
            + "\n  - ".join(unlisted_on_disk),
            file=sys.stderr,
        )


def create_scorm_zip(package_root: Path, output_zip: Path) -> tuple[int, Path]:
    manifest_path = package_root / "imsmanifest.xml"
    runtime_files = collect_runtime_files(package_root)
    validate_manifest(manifest_path, package_root, runtime_files)

    output_zip.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for file_path in runtime_files:
            arcname = file_path.relative_to(package_root).as_posix()
            zf.write(file_path, arcname=arcname)

    return len(runtime_files), output_zip


def main() -> int:
    package_root = Path(__file__).resolve().parent.parent
    default_out = package_root.parent / "cezeri-oda-scorm12.zip"

    parser = argparse.ArgumentParser(
        description="cezeri-oda klasörünü imsmanifest.xml kök dizinde olacak şekilde SCORM 1.2 zip'ine paketler."
    )
    parser.add_argument(
        "-o",
        "--out",
        type=Path,
        default=default_out,
        help=f"Çıktı zip dosya yolu (varsayılan: {default_out})",
    )
    args = parser.parse_args()

    try:
        count, zip_path = create_scorm_zip(package_root, args.out.resolve())
    except Exception as exc:
        print(f"HATA: Paketleme başarısız: {exc}", file=sys.stderr)
        return 1

    size_kb = zip_path.stat().st_size / 1024.0
    print(f"SCORM 1.2 paketi oluşturuldu: {zip_path}")
    print(f"Toplam dosya: {count} | Boyut: {size_kb:.1f} KB | Kök: imsmanifest.xml")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
