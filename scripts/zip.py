import zipfile
import os
import sys

if len(sys.argv) < 3:
    print("Uso: python3 zip.py <diretorio_origem> <arquivo_destino.zip>")
    sys.exit(1)

out_dir = sys.argv[1]
zip_path = sys.argv[2]

if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(out_dir):
        for f in files:
            full = os.path.join(root, f)
            rel = os.path.relpath(full, out_dir)
            z.write(full, rel)

print(f"Arquivo zip criado com sucesso: {zip_path}")
