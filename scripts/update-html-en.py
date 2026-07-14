import re

certs_en = [
    ("Introduction to Computer Science", "ITLegend", "course-intro-computer-science-itlegend.webp"),
    ("Algorithms & Problem Solving (L1)", "ITLegend", "course-algorithm-problem-solving-l1-itlegend.webp"),
    ("C# Basics", "ITLegend", "course-csharp-basics-itlegend.webp"),
    ("C# Problem Solving", "ITLegend", "course-csharp-problem-solving-itlegend.webp"),
    ("Object Oriented Programming (C# OOP)", "ITLegend", "course-csharp-oop-itlegend.webp"),
    ("C# OOP Project", "ITLegend", "course-csharp-oop-project-itlegend.webp"),
    ("Data Structures & Algorithms", "ITLegend", "course-data-structures-algorithms-itlegend.webp"),
    ("Advanced SQL Server Database", "ITLegend", "course-advanced-sql-server-itlegend.webp"),
    ("HTML Basics", "ITLegend", "course-html-itlegend.webp"),
    ("CSS Basics", "ITLegend", "course-css-itlegend.webp"),
    ("HTML & CSS Project", "ITLegend", "course-html-css-project-itlegend.webp"),
    ("Career OS", "ITLegend", "course-career-os-itlegend.webp"),
    ("Flutter Development", "Udemy", "course-udemy-9a1fcc40.webp"),
    ("Million Prompters Initiative", "Million Prompters", "course-million-prompters.pdf"),
]

def build_html():
    html = []
    divider_title = "Programming & Development Courses"
    btn_text = "View Certificate"
    
    html.append(f"""
        <!-- Courses Sub-section -->
        <div class="row w-100" style="margin-top: 50px; margin-bottom: 30px; width: 100%;">
          <div class="section-title text-align" style="margin-bottom: 0;">
            <h3 style="font-size: 26px; color: var(--ink); font-weight: 700;">{divider_title}</h3>
          </div>
        </div>
        
        <div class="row cert-grid">""")
            
    for title, org, filename in certs_en:
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
        
        html.append(f"""
          <!-- Cert Item -->
          <div class="cert-item" style="flex: 0 0 calc(33.33% - 16px); max-width: calc(33.33% - 16px);">
            <div class="cert-card" style="padding: 24px 16px;">
              <div class="cert-icon" style="width: 50px; height: 50px; margin-bottom: 15px;">
                {icon}
              </div>
              <div class="cert-info">
                <h3 style="font-size: 17px; margin-bottom: 6px;">{title}</h3>
                <span class="cert-org" style="font-size: 14px; margin-bottom: 15px;">{org}</span>
              </div>
              <a href="images/certs/{filename}" target="_blank" class="cert-btn" style="padding: 6px 16px; font-size: 13px;" aria-label="{btn_text}">{btn_text}</a>
            </div>
          </div>""")
              
    html.append("        </div>")
    return "\n".join(html)

with open("index-en.html", 'r', encoding='utf-8') as f:
    content = f.read()

insertion_point = "      </div>\n    </section>\n    <!--===== Certifications Section End =====-->"
if insertion_point in content:
    content = content.replace(insertion_point, build_html() + "\n" + insertion_point)
    with open("index-en.html", 'w', encoding='utf-8') as f:
        f.write(content)
    print("Done")
else:
    print("Could not find insertion point")
