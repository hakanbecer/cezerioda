#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_audio.py
=================
Bu script, metinler.json dosyasındaki yönerge ve karşılama metinlerini okuyarak
kurulu olan 'voxcpm2' aracıyla 'spiker' sesini kullanarak çevrimdışı MP3 ses
dosyalarını (audio/giris.mp3, audio/ekran1.mp3, audio/ekran2.mp3) üretir.

Ayrıca HTML tarafında file:// protokolünde de hatasız ve ayrışmadan çalışabilmesi
için js/metinler.js dosyasını metinler.json ile senkronize eder.

Kullanım:
    python tools/generate_audio.py
"""

import os
import sys
import json
import shutil
import subprocess

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    json_path = os.path.join(project_root, "metinler.json")
    if not os.path.exists(json_path):
        print(f"[HATA] metinler.json bulunamadı: {json_path}")
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. js/metinler.js dosyasını senkronize et
    js_path = os.path.join(project_root, "js", "metinler.js")
    os.makedirs(os.path.dirname(js_path), exist_ok=True)
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("(function (global) {\n")
        f.write('  "use strict";\n\n')
        f.write("  global.METINLER = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n")
        f.write("})(window);\n")
    print(f"[OK] js/metinler.js güncellendi.")

    # 2. Üretilecek ses dosyaları listesi
    tasks = [
        {
            "key": "giris",
            "text": data.get("giris", {}).get("metin", ""),
            "rel_path": data.get("giris", {}).get("audio", "audio/giris.mp3")
        },
        {
            "key": "ekran1",
            "text": data.get("ekran1", {}).get("yonerge", ""),
            "rel_path": data.get("ekran1", {}).get("audio", "audio/ekran1.mp3")
        },
        {
            "key": "ekran2",
            "text": data.get("ekran2", {}).get("yonerge", ""),
            "rel_path": data.get("ekran2", {}).get("audio", "audio/ekran2.mp3")
        }
    ]

    audio_dir = os.path.join(project_root, "audio")
    os.makedirs(audio_dir, exist_ok=True)

    voxcpm2_path = shutil.which("voxcpm2")
    has_cli = voxcpm2_path is not None

    print(f"\n--- Ses Dosyası Üretimi (voxcpm2 • spiker) ---")
    if has_cli:
        print(f"voxcpm2 komutu bulundu: {voxcpm2_path}")
    else:
        print("[BİLGİ] 'voxcpm2' sistem PATH'inde bir CLI komutu olarak doğrudan bulunamadı.")
        print("Python modülü veya yerel komut kontrol ediliyor...")

    for task in tasks:
        out_file = os.path.join(project_root, task["rel_path"])
        os.makedirs(os.path.dirname(out_file), exist_ok=True)
        text = task["text"].strip()
        print(f"\n[{task['key']}] -> {task['rel_path']}")
        print(f"Metin: \"{text[:80]}...\"")

        success = False

        # Yöntem 1: voxcpm2 CLI
        if has_cli:
            try:
                cmd = ["voxcpm2", "--voice", "spiker", "--text", text, "--output", out_file]
                print(f"Çalıştırılıyor: {' '.join(cmd)}")
                res = subprocess.run(cmd, capture_output=True, text=True, check=True)
                success = True
                print(f"[BAŞARILI] {out_file} oluşturuldu.")
            except Exception as e:
                print(f"[UYARI] CLI çağrısı hata verdi: {e}")

        # Yöntem 2: python -m voxcpm2
        if not success:
            try:
                cmd = [sys.executable, "-m", "voxcpm2", "--voice", "spiker", "--text", text, "--output", out_file]
                res = subprocess.run(cmd, capture_output=True, text=True)
                if res.returncode == 0:
                    success = True
                    print(f"[BAŞARILI] {out_file} (python -m voxcpm2) ile oluşturuldu.")
            except Exception:
                pass

        # Yöntem 3: voxcpm2 Python API
        if not success:
            try:
                import voxcpm2
                if hasattr(voxcpm2, "generate") or hasattr(voxcpm2, "tts"):
                    func = getattr(voxcpm2, "generate", None) or getattr(voxcpm2, "tts", None)
                    func(text=text, voice="spiker", output=out_file)
                    success = True
                    print(f"[BAŞARILI] {out_file} (voxcpm2 modülü) ile oluşturuldu.")
            except Exception as e:
                pass

        if not success:
            print(f"[BİLGİ] {task['rel_path']} için voxcpm2 henüz bu ortamda çalıştırılamadı.")
            print(f"Kendi makinenizde bu script'i 'python tools/generate_audio.py' komutuyla çalıştırabilirsiniz.")

    print("\nİşlem tamamlandı.")

if __name__ == "__main__":
    main()
