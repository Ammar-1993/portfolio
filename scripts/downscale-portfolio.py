"""
downscale-portfolio.py
Downscale oversized portfolio screenshot images closer to their actual display size.
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow library not found!")
    sys.exit(1)

PORTFOLIO_PATH = Path("images/portfolio")
MAX_SIZE = 900
QUALITY = 85

def format_size(bytes):
    return round(bytes / 1024 / 1024, 2)

def main():
    print("="*50)
    print("Portfolio Image Downscaler")
    print("="*50)
    
    if not PORTFOLIO_PATH.exists():
        print(f"[ERROR] Directory not found: {PORTFOLIO_PATH}")
        sys.exit(1)
        
    webp_files = list(PORTFOLIO_PATH.glob("*.webp"))
    if not webp_files:
        print(f"[!] No WebP files found in {PORTFOLIO_PATH}")
        sys.exit(0)
        
    total_before = sum(f.stat().st_size for f in webp_files)
    print(f"Total folder size before: {format_size(total_before)} MB")
    
    resized_count = 0
    skipped_count = 0
    
    for webp_file in webp_files:
        try:
            with Image.open(webp_file) as img:
                width, height = img.size
                longest_edge = max(width, height)
                
                if longest_edge > MAX_SIZE:
                    ratio = MAX_SIZE / longest_edge
                    new_width = int(width * ratio)
                    new_height = int(height * ratio)
                    
                    resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    
                    # Apply the same background conversion as convert-to-webp.py just in case
                    if resized_img.mode in ('RGBA', 'LA', 'P'):
                        background = Image.new('RGB', resized_img.size, (255, 255, 255))
                        if resized_img.mode == 'P':
                            resized_img = resized_img.convert('RGBA')
                        background.paste(resized_img, mask=resized_img.split()[-1] if resized_img.mode == 'RGBA' else None)
                        resized_img = background
                    
                    # Overwrite in place
                    resized_img.save(webp_file, 'WebP', quality=QUALITY, method=6)
                    resized_count += 1
                    print(f"[RESIZED] {webp_file.name}: {width}x{height} -> {new_width}x{new_height}")
                else:
                    skipped_count += 1
                    
        except Exception as e:
            print(f"[ERROR] processing {webp_file.name}: {e}")
            
    total_after = sum(f.stat().st_size for f in webp_files)
    print("="*50)
    print("Downscale Complete!")
    print(f"Total folder size after:  {format_size(total_after)} MB")
    print(f"Resized: {resized_count}")
    print(f"Skipped: {skipped_count}")

    # Final verification
    exceeded = []
    for webp_file in webp_files:
        with Image.open(webp_file) as img:
            if max(img.size) > MAX_SIZE:
                exceeded.append(webp_file.name)
    
    if exceeded:
        print(f"[WARNING] These files still exceed {MAX_SIZE}px: {', '.join(exceeded)}")
    else:
        print(f"[VERIFIED] No image's longest edge exceeds {MAX_SIZE}px.")

if __name__ == '__main__':
    main()
