"""
convert-to-webp.py
Batch convert PNG images to WebP format using Python PIL/Pillow
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("\n" + "="*50)
    print("ERROR: Pillow library not found!")
    print("="*50)
    print("\nPlease install Pillow:")
    print("  pip install Pillow")
    print("\nOr:")
    print("  python -m pip install Pillow")
    print()
    sys.exit(1)

PORTFOLIO_PATH = "images/portfolio"
QUALITY = 85  # Quality setting (0-100, recommended: 80-90)

def format_size(bytes):
    """Convert bytes to KB with 2 decimal places"""
    return round(bytes / 1024, 2)

def main():
    print("="*50)
    print("Portfolio Image Converter: PNG -> WebP")
    print("="*50)
    print()
    
    # Get all PNG files
    portfolio_dir = Path(PORTFOLIO_PATH)
    if not portfolio_dir.exists():
        print(f"[ERROR] Directory not found: {PORTFOLIO_PATH}")
        sys.exit(1)
    
    png_files = list(portfolio_dir.glob("*.png"))
    
    # Additional specific images to convert
    extra_images = [Path("images/hero4.png"), Path("images/about_hero.png")]
    for img in extra_images:
        if img.exists():
            png_files.append(img)
    
    if not png_files:
        print(f"[!] No PNG files found in {PORTFOLIO_PATH}")
        sys.exit(0)
    
    print(f"Found {len(png_files)} PNG files to convert")
    print(f"Quality setting: {QUALITY}")
    print()
    
    converted = 0
    skipped = 0
    failed = 0
    
    for png_file in png_files:
        webp_file = png_file.with_suffix('.webp')
        
        # Skip if WebP already exists
        if webp_file.exists():
            print(f"[SKIP] {png_file.name} (WebP exists)")
            skipped += 1
            continue
        
        print(f"[CONV] {png_file.name} -> ", end='', flush=True)
        
        try:
            # Open and convert image
            with Image.open(png_file) as img:
                # Convert RGBA to RGB if necessary (WebP doesn't handle transparency the same way)
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Create white background
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                
                # Save as WebP
                img.save(webp_file, 'WebP', quality=QUALITY, method=6)
            
            # Get file sizes
            original_size = format_size(png_file.stat().st_size)
            new_size = format_size(webp_file.stat().st_size)
            savings = round((1 - (webp_file.stat().st_size / png_file.stat().st_size)) * 100, 1)
            
            print(f"{webp_file.name} ({original_size} KB -> {new_size} KB, -{savings}%)")
            converted += 1
            
        except Exception as e:
            print(f"FAILED: {str(e)}")
            failed += 1
    
    print()
    print("="*50)
    print("Conversion Complete!")
    print("="*50)
    print(f"+ Converted: {converted}")
    print(f"~ Skipped:   {skipped}")
    print(f"x Failed:    {failed}")
    print()
    
    if converted > 0:
        print("Next Steps:")
        print("1. Portfolio.json already updated with .webp references")
        print("2. Test the portfolio in browser")
        print("3. (Optional) Delete old .png files to save space")

if __name__ == "__main__":
    main()
