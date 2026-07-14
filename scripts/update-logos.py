import os

def update_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    parts = content.split('class="cert-card"')
    new_parts = [parts[0]]
    
    for part in parts[1:]:
        org_text = ""
        # Find org text safely
        org_start = part.find('class="cert-org"')
        if org_start != -1:
            start_tag = part.find('>', org_start) + 1
            end_tag = part.find('</span', start_tag)
            org_text = part[start_tag:end_tag].lower().strip()
            
        logo_html = ''
        if 'itlegend' in org_text:
            logo_html = '<img src="images/itlegend-logo.png" alt="ITLegend Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">'
        elif 'udemy' in org_text:
            logo_html = '<img src="images/udemy-logo.svg" alt="Udemy Logo" style="width: 100%; height: 100%; object-fit: contain;">'
        elif 'million prompters' in org_text or 'مليون' in org_text:
            logo_html = '<img src="images/million-prompters-logo.svg" alt="Million Prompters Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">'
        elif 'جامعة تعز' in org_text or 'taiz' in org_text:
            logo_html = '<svg class="ico" aria-hidden="true" style="width: 32px; height: 32px; color: var(--main-color);"><use href="images/icons.svg#file-cv" /></svg>'
        elif 'مصادقة' in org_text or 'saudi' in org_text:
            logo_html = '<svg class="ico" aria-hidden="true" style="width: 32px; height: 32px; color: var(--main-color);"><use href="images/icons.svg#install" /></svg>'
            
        if logo_html:
            start_idx = part.find('class="cert-icon"')
            if start_idx != -1:
                svg_start = part.find('<svg', start_idx)
                svg_end = part.find('</svg>', svg_start) + 6 if svg_start != -1 else -1
                
                img_start = part.find('<img', start_idx)
                
                if svg_start != -1 and svg_start < part.find('</div>', start_idx):
                    part = part[:svg_start] + logo_html + part[svg_end:]
                elif img_start != -1 and img_start < part.find('</div>', start_idx):
                    img_end = part.find('>', img_start) + 1
                    part = part[:img_start] + logo_html + part[img_end:]

        new_parts.append(part)
        
    final_content = 'class="cert-card"'.join(new_parts)
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(final_content)
    print(f"Updated {filename}")

if __name__ == '__main__':
    update_file('index.html')
    update_file('index-en.html')
