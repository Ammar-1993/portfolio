import re


def consolidate(filename, lang='ar'):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # We will use the exact string of each item to do replacements
    other_str = []
    
    # We will use the exact string of each item to do replacements
    # but BS4 item.__str__() is not the original text exactly.
    # Instead, we split the original content manually.
    
    parts = content.split('<div class="cert-item"')
    new_parts = [parts[0]]
    
    itlegend_count = 0
    all_itlegend_images = []
    
    # First pass: collect all ITLegend images
    for part in parts[1:]:
        org_start = part.find('class="cert-org"')
        if org_start != -1:
            start_tag = part.find('>', org_start) + 1
            end_tag = part.find('</span', start_tag)
            org_text = part[start_tag:end_tag].lower().strip()
            
            if 'itlegend' in org_text:
                # find href
                href_start = part.find('href="')
                if href_start != -1:
                    src_start = href_start + 6
                    src_end = part.find('"', src_start)
                    src = part[src_start:src_end]
                    
                    # find title
                    title_start = part.find('<h3')
                    title_start = part.find('>', title_start) + 1
                    title_end = part.find('</h3', title_start)
                    title = part[title_start:title_end].strip()
                    all_itlegend_images.append({'src': src, 'title': title})

    gallery_html = '\\n              <div class="project-gallery" hidden>\\n'
    for img in all_itlegend_images:
        gallery_html += f'                <img data-src="{img["src"]}" alt="{img["title"]}">\\n'
    gallery_html += '              </div>\\n            '
    
    # Second pass: rebuild content
    for part in parts[1:]:
        rebuilt_part = '<div class="cert-item"' + part
        org_start = part.find('class="cert-org"')
        is_itlegend = False
        is_other = False
        
        if org_start != -1:
            start_tag = part.find('>', org_start) + 1
            end_tag = part.find('</span', start_tag)
            org_text = part[start_tag:end_tag].lower().strip()
            if 'itlegend' in org_text:
                is_itlegend = True
            elif 'udemy' in org_text or 'million' in org_text or 'مليون' in org_text:
                is_other = True
                
        if is_itlegend:
            itlegend_count += 1
            if itlegend_count == 1:
                # Modify first item
                # title
                new_title = "مسار مطور برمجيات متكامل (12 شهادة متخصصة)" if lang == 'ar' else "Full Stack Software Developer Track (12 Specialized Certificates)"
                rebuilt_part = re.sub(r'(<h3[^>]*>).*?(</h3>)', rf'\\1{new_title}\\2', rebuilt_part)
                
                # button
                new_btn_text = "عرض الشهادات" if lang == 'ar' else "View Certificates"
                rebuilt_part = re.sub(r'(<a[^>]*class="[^"]*cert-btn)[^"]*("[^>]*>).*?(</a>)', rf'\\1 cert-btn-gallery\\2{new_btn_text}\\3', rebuilt_part)
                rebuilt_part = re.sub(r'href="[^"]*"', 'href="#"', rebuilt_part, count=1)
                rebuilt_part = rebuilt_part.replace('target="_blank"', '')
                
                # append gallery
                # insert right before the last closing div of the card
                # we know cert-card ends before cert-item
                rebuilt_part = rebuilt_part.replace('</a>\\n            </div>', f'</a>{gallery_html}</div>')
                
                new_parts.append(rebuilt_part)
            else:
                # Skip the other 11 items
                continue
                
        elif is_other:
            # find href for single gallery
            href_start = part.find('href="')
            src = ''
            if href_start != -1:
                src_start = href_start + 6
                src_end = part.find('"', src_start)
                src = part[src_start:src_end]
                
            title_start = part.find('<h3')
            title_start = part.find('>', title_start) + 1
            title_end = part.find('</h3', title_start)
            title = part[title_start:title_end].strip()
            
            single_gallery_html = f'\\n              <div class="project-gallery" hidden>\\n                <img data-src="{src}" alt="{title}">\\n              </div>\\n            '
            
            # update btn
            rebuilt_part = re.sub(r'(<a[^>]*class="[^"]*cert-btn)[^"]*("[^>]*>)', rf'\\1 cert-btn-gallery\\2', rebuilt_part)
            rebuilt_part = re.sub(r'href="[^"]*"', 'href="#"', rebuilt_part, count=1)
            rebuilt_part = rebuilt_part.replace('target="_blank"', '')
            
            # append gallery
            rebuilt_part = rebuilt_part.replace('</a>\\n            </div>', f'</a>{single_gallery_html}</div>')
            
            new_parts.append(rebuilt_part)
        else:
            new_parts.append(rebuilt_part)
            
    # Fix the missing split marker because new_parts already appended the rebuilt part containing it
    # No wait, new_parts[0] is just the start of the file. The others HAVE '<div class="cert-item"' added explicitly
    
    final_content = ''.join(new_parts)
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(final_content)
    print(f"Consolidated {filename}")

if __name__ == '__main__':
    consolidate('index.html', 'ar')
    consolidate('index-en.html', 'en')
