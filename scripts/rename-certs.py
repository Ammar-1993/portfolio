import os
import glob

# Ensure we are in the correct directory
cert_dir = "images/certs"
if not os.path.exists(cert_dir):
    print("Error: Directory not found")
    exit(1)

os.chdir(cert_dir)

mapping = {
    "Ammar Ali Abdo Morshed Al-Najjar - Introduction to computer science ITLegend certificate.webp": "course-intro-computer-science-itlegend.webp",
    "Ammar Ali Abdo Morshed Al-Najjar - Algorithm and problem solving level 1 ITLegend certificate.webp": "course-algorithm-problem-solving-l1-itlegend.webp",
    "Ammar Ali Abdo Morshed Al-Najjar - C# Basics ITLegend certificate.webp": "course-csharp-basics-itlegend.webp",
    "Ammar Ali Abdo Morshed Al-Najjar - C# Problem Solving  ITLegend certificate.webp": "course-csharp-problem-solving-itlegend.webp",
    "Ammar Ali Abdo Morshed - C# oop  ITLegend certificate.webp": "course-csharp-oop-itlegend.webp",
    "Ammar Ali Abdo Morshed - C# OOP Project  ITLegend certificate.webp": "course-csharp-oop-project-itlegend.webp",
    "Ammar Ali Abdo Morshed - Data structures and Algorithms  ITLegend certificate.webp": "course-data-structures-algorithms-itlegend.webp",
    "Ammar Ali Abdo Morshed - Advanced Sql Server Database ITLegend certificate.webp": "course-advanced-sql-server-itlegend.webp",
    "Ammar Ali Abdo Morshed Al-Najjar - HTML ITLegend certificate.webp": "course-html-itlegend.webp",
    "Ammar Ali Abdo Morshed - Css ITLegend certificate.webp": "course-css-itlegend.webp",
    "Ammar Ali Abdo Morshed - HTML and CSS project  ITLegend certificate.webp": "course-html-css-project-itlegend.webp",
    "Ammar Ali Abdo Morshed - Career OS ITLegend certificate.webp": "course-career-os-itlegend.webp",
    "UC-9a1fcc40-ad01-4867-a330-b7eb8efed452.webp": "course-udemy-9a1fcc40.webp",
    "Report.pdf": "mosadaqa-saudi-authentication.pdf",
}

for old_name, new_name in mapping.items():
    if os.path.exists(old_name):
        os.rename(old_name, new_name)
        print(f"Renamed: {old_name} -> {new_name}")

# Delete original PNGs and JPGs that have WEBP equivalents
png_files = glob.glob("*.png") + glob.glob("*.jpg")
for f in png_files:
    webp_version = os.path.splitext(f)[0] + ".webp"
    # Note: after rename, the webp version is gone under the old name, so we check if the new name exists OR if we renamed it.
    # A safer way: just delete all pngs/jpgs if they were in the mapping or have a webp.
    if os.path.exists(webp_version) or (webp_version in mapping and os.path.exists(mapping[webp_version])):
        try:
            os.remove(f)
            print(f"Deleted original: {f}")
        except Exception as e:
            print(f"Could not delete {f}: {e}")

# Rename generic IMG_*.webp files
img_files = glob.glob("IMG_*.webp")
img_files.sort()
for i, f in enumerate(img_files, 1):
    new_name = f"academic-certificate-{i}.webp"
    if not os.path.exists(new_name):
        os.rename(f, new_name)
        print(f"Renamed: {f} -> {new_name}")

if os.path.exists("CamScanner 13-07-2025 01.19_2.webp"):
    os.rename("CamScanner 13-07-2025 01.19_2.webp", "academic-transcript-1.webp")
    print("Renamed CamScanner file.")
    if os.path.exists("CamScanner 13-07-2025 01.19_2.jpg"):
        os.remove("CamScanner 13-07-2025 01.19_2.jpg")

print("Renaming and cleanup complete!")
