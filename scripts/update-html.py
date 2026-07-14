import re

certs_ar = [
    ("أساسيات علوم الحاسوب", "ITLegend", "course-intro-computer-science-itlegend.webp"),
    ("الخوارزميات وحل المشاكل (مستوى 1)", "ITLegend", "course-algorithm-problem-solving-l1-itlegend.webp"),
    ("أساسيات C#", "ITLegend", "course-csharp-basics-itlegend.webp"),
    ("حل المشاكل بـ C#", "ITLegend", "course-csharp-problem-solving-itlegend.webp"),
    ("البرمجة الكائنية (C# OOP)", "ITLegend", "course-csharp-oop-itlegend.webp"),
    ("مشروع البرمجة الكائنية (C# OOP)", "ITLegend", "course-csharp-oop-project-itlegend.webp"),
    ("هياكل البيانات والخوارزميات", "ITLegend", "course-data-structures-algorithms-itlegend.webp"),
    ("قواعد البيانات المتقدمة SQL Server", "ITLegend", "course-advanced-sql-server-itlegend.webp"),
    ("أساسيات HTML", "ITLegend", "course-html-itlegend.webp"),
    ("أساسيات CSS", "ITLegend", "course-css-itlegend.webp"),
    ("مشروع HTML & CSS", "ITLegend", "course-html-css-project-itlegend.webp"),
    ("المسار المهني (Career OS)", "ITLegend", "course-career-os-itlegend.webp"),
    ("Flutter Development", "Udemy", "course-udemy-9a1fcc40.webp"),
    ("مبادرة مليون مبرمج", "Million Prompters", "course-million-prompters.pdf"),
]

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

def build_html(certs_list, is_arabic):
    html = []
    
    divider_title = "شهادات البرمجة والتطوير" if is_arabic else "Programming & Development Courses"
    btn_text = "عرض الشهادة" if is_arabic else "View Certificate"
    
    html.append(f"""
            <!-- Courses Sub-section -->
            <div class="row w-100" style="margin-top: 50px; margin-bottom: 30px; width: 100%;">
              <div class="section-title text-align" style="margin-bottom: 0;">
                <h3 style="font-size: 26px; color: var(--ink); font-weight: 700;">{divider_title}</h3>
              </div>
            </div>
            
            <div class="row cert-grid">""")
            
    for title, org, filename in certs_list:
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
              
    html.append("            </div>")
    return "\n".join(html)

def update_file(filepath, is_arabic):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Update placeholders
    if is_arabic:
        content = content.replace('href="images/cert-placeholder.jpg" target="_blank" class="cert-btn" aria-label="عرض الشهادة الجامعية"', 'href="images/certs/academic-certificate-1.webp" target="_blank" class="cert-btn" aria-label="عرض الشهادة الجامعية"')
        content = content.replace('href="images/cert-placeholder.jpg" target="_blank" class="cert-btn" aria-label="عرض مصادقة الشهادة"', 'href="images/certs/mosadaqa-saudi-authentication.pdf" target="_blank" class="cert-btn" aria-label="عرض مصادقة الشهادة"')
    else:
        content = content.replace('href="images/cert-placeholder.jpg" target="_blank" class="cert-btn" aria-label="View Bachelor Degree"', 'href="images/certs/academic-certificate-1.webp" target="_blank" class="cert-btn" aria-label="View Bachelor Degree"')
        content = content.replace('href="images/cert-placeholder.jpg" target="_blank" class="cert-btn" aria-label="View Saudi Verification"', 'href="images/certs/mosadaqa-saudi-authentication.pdf" target="_blank" class="cert-btn" aria-label="View Saudi Verification"')
    
    # 2. Insert new courses section right before closing div of container
    insertion_point = "          </div>\n        </section>\n        <!--===== Certifications Section End =====-->"
    if insertion_point in content:
        courses_html = build_html(certs_ar if is_arabic else certs_en, is_arabic)
        content = content.replace(insertion_point, courses_html + "\n" + insertion_point)
    else:
        print(f"Could not find insertion point in {filepath}")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_file("index.html", True)
update_file("index-en.html", False)
print("Updated HTML files!")
