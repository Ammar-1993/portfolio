import os

os.chdir("images/certs")

mapping = {
    "academic-certificate-1.webp": "high-school-front.webp",
    "academic-certificate-2.webp": "high-school-back.webp",
    "academic-certificate-3.webp": "bachelor-degree-front.webp",
    "academic-certificate-4.webp": "bachelor-degree-back.webp",
    "academic-certificate-5.webp": "english-transcript-front.webp",
    "academic-certificate-6.webp": "english-transcript-back.webp",
    "academic-certificate-7.webp": "arabic-transcript-front.webp",
    "academic-certificate-8.webp": "arabic-transcript-back.webp",
    "academic-transcript-1.webp": "bachelor-degree-camscanner.webp", # Duplicate
}

for old, new in mapping.items():
    if os.path.exists(old):
        os.rename(old, new)
        print(f"Renamed {old} to {new}")

