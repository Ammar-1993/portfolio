import re

def update_html(filename, is_arabic):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace Flutter with Laravel
    if is_arabic:
        content = content.replace("Flutter Development", "دورة Laravel 12 الشاملة")
    else:
        content = content.replace("Flutter Development", "Laravel 12 Complete Guide")
    
    content = content.replace("course-udemy-9a1fcc40.webp", "course-udemy-laravel.webp")

    # Add MERN stack right after Laravel
    # We find the closing div of the Laravel item, which is a bit tricky, but we can just find the block and insert after it.
    
    # We know Million Prompters is the last one. We can insert MERN before Million Prompters.
    # Let's find Million Prompters block.
    if is_arabic:
        million_search = '                    <h3 style="font-size: 17px; margin-bottom: 6px;">مبادرة مليون مبرمج</h3>'
        title = "تطوير الويب (MERN Stack)"
        btn_text = "عرض الشهادة"
    else:
        million_search = '                    <h3 style="font-size: 17px; margin-bottom: 6px;">Million Prompters Initiative</h3>'
        title = "MERN Stack Development"
        btn_text = "View Certificate"

    # Find the start of the cert-item for Million Prompters
    # Instead of complex regex, let's just replace the exact block if we can, or insert MERN before Million Prompters
    
    icon = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
    mern_html = f"""          <!-- Cert Item -->
          <div class="cert-item" style="flex: 0 0 calc(33.33% - 16px); max-width: calc(33.33% - 16px);">
            <div class="cert-card" style="padding: 24px 16px;">
              <div class="cert-icon" style="width: 50px; height: 50px; margin-bottom: 15px;">
                {icon}
              </div>
              <div class="cert-info">
                <h3 style="font-size: 17px; margin-bottom: 6px;">{title}</h3>
                <span class="cert-org" style="font-size: 14px; margin-bottom: 15px;">Udemy</span>
              </div>
              <a href="images/certs/course-udemy-mern.pdf" target="_blank" class="cert-btn" style="padding: 6px 16px; font-size: 13px;" aria-label="{btn_text}">{btn_text}</a>
            </div>
          </div>
"""
    # Insert MERN before Million Prompters. The Million Prompters block starts with <!-- Cert Item --> right above the h3.
    # It's easier to just split by the Million Prompters title and backtrack to <!-- Cert Item -->
    
    idx = content.find(million_search)
    if idx != -1:
        # backtrack to <!-- Cert Item -->
        start_idx = content.rfind('<!-- Cert Item -->', 0, idx)
        if start_idx != -1:
            content = content[:start_idx] + mern_html + content[start_idx:]
            
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

update_html("index.html", True)
update_html("index-en.html", False)
