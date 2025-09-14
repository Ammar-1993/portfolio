# Portfolio Website

![Static Site](https://img.shields.io/badge/type-static_site-informational)
![Made with HTML/CSS/JS](https://img.shields.io/badge/made%20with-HTML%2C%20CSS%2C%20JS-blue)
![RTL](https://img.shields.io/badge/support-RTL%20%26%20Arabic-success)
[![Pages](https://img.shields.io/github/deployments/Ammar-1993/portfolio/github-pages?label=GitHub%20Pages\&logo=github)](https://ammar-1993.github.io/portfolio/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow)](#-license)

> **Languages:** 🇸🇦 العربية | 🇬🇧 English (scroll down)

---

## 🇸🇦 نظرة عامة

موقع بورتفوليو شخصي بسيط وسريع مبني بتقنيات **HTML/CSS/JavaScript** ويستهدف متحدثي العربية (اتجاه **RTL**). يحتوي على أقسام: **الرئيسية، من أنا، الخدمات، الأعمال، التقنيات، تواصل** مع أزرار دعوة لاتخاذ إجراء (CTA) وروابط واتساب/بريد.

### ✨ المزايا

* تصميم متجاوب يعمل جيدًا على الموبايل والكمبيوتر.
* دعم اللغة العربية واتجاه **rtl**.
* أقسام واضحة مع روابط تنقل (Navbar) وثابتة.
* وسوم وصفية لتحسين محركات البحث (SEO) وقابلة للتخصيص.
* إمكانية النشر التلقائي عبر **GitHub Pages**.

### 🗂️ هيكل المشروع

```
portfolio/
├── index.html
├── css/
├── js/
├── images/
├── video/           # إن وُجد: اسم المجلد الموصى به
└── assets/          # اختياري: خطوط/أيقونات
```

> **ملاحظة:** إذا كان اسم المجلد الحالي `vedio/` فالأفضل إعادة تسميته إلى `video/` لتجنّب الأخطاء:
>
> ```bash
> git mv vedio video
> git commit -m "chore: rename vedio -> video"
> ```

### 🧑‍💻 تشغيل محليًا

> يتطلّب أي خادم محلي بسيط (لتفادي قيود المتصفح على الملفات المحلية)

**الخيار 1 — Python**

```bash
# داخل مجلد المشروع
python3 -m http.server 8000
# افتح http://localhost:8000
```

**الخيار 2 — Node (http-server)**

```bash
npm i -g http-server
http-server -p 8000
```

**الخيار 3 — VS Code Live Server**

* افتح المشروع في VS Code
* ثبّت إضافة *Live Server*
* اضغط "Go Live"

### ☁️ النشر على GitHub Pages

1. ادفع (push) التعديلات إلى فرع `main`.
2. من إعدادات المستودع → **Pages** → اختر المصدر `Deploy from a branch` → الفرع `main` ومسار `/root`.
3. بعد دقائق سيتوفّر الموقع على: `https://<username>.github.io/portfolio/`.

### 🧩 التخصيص السريع

* **عنوان الصفحة والوصف:** داخل `<head>` في `index.html`.
* **اللغة والاتجاه:** تأكد من السطر:

  ```html
  <html lang="ar" dir="rtl">
  ```
* **الصور:** أضف نصًا بديلاً (alt) وصِف الصورة بدقة.
* **الروابط:** حدّث روابط واتساب/بريد/هاتف.
* **الأقسام:** عدّل النصوص والقوائم حسب خدماتك.

### 🚀 تحسين الأداء وSEO

أضف داخل `<head>`:

```html
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>محفظة أعمال — اسمك</title>
<meta name="description" content="خدمات تطوير مواقع الويب والتطبيقات مع تسليم احترافي." />

<!-- Open Graph / Twitter -->
<meta property="og:type" content="website" />
<meta property="og:title" content="محفظة أعمال — اسمك" />
<meta property="og:description" content="نماذج أعمالي وخدماتي التقنية." />
<meta property="og:image" content="https://your-domain/images/og-cover.jpg" />
<meta property="og:url" content="https://your-domain/" />
<meta name="twitter:card" content="summary_large_image" />
```

تحميل كسول للصور والفيديو:

```html
<img src="images/work1.jpg" alt="مشروع: متجر إلكتروني" loading="lazy" decoding="async" width="640" height="428">
<video src="video/demo.mp4" preload="metadata" controls></video>
```

### 🧪 فحوصات يدوية سريعة (QA)

* [ ] يعمل شريط التنقل ويؤدي إلى الأقسام الصحيحة.
* [ ] لا توجد صور مكسورة أو روابط غير صالحة.
* [ ] الخطوط قابلة للقراءة على الموبايل (اختبر 320px فما فوق).
* [ ] التباين اللوني مناسب (تحقق من **contrast**).
* [ ] عناصر تفاعلية قابلة للوصول بلوحة المفاتيح (**Tab/Enter**).

### 🗺️ خارطة الطريق (اقتراحات)

* تبديل اللغة (AR/EN) بزر في الترويسة.
* إضافة دراسات حالة (Problem → Solution → Stack → Link).
* صفحة "مدونة" خفيفة للمقالات القصيرة.
* ملفات `sitemap.xml` و `robots.txt`.
* ربط تحليلات (Plausible/GA4).

### 🤝 المساهمة

الطلبات مرحّب بها! افتح **Issue** أو **Pull Request** مع وصف واضح.

### 📄 الترخيص

مشروع مفتوح المصدر تحت رخصة **MIT**. راجع ملف [`LICENSE`](./LICENSE).

### 📬 تواصل

* البريد: `<your-email@example.com>`
* واتساب: `https://wa.me/<your-number>`
* لينكدإن: `https://www.linkedin.com/in/<your-handle>/`

---

## 🇬🇧 Overview (English)

A fast, static **HTML/CSS/JavaScript** personal portfolio tailored for **Arabic/RTL**.

### Features

* Responsive layout (mobile‑first).
* Arabic language & RTL direction.
* Clean sections: Home, About, Services, Work, Tech, Contact.
* SEO‑ready `<head>` and social tags.
* Easy **GitHub Pages** deployment.

### Project Structure

```
portfolio/
├── index.html
├── css/
├── js/
├── images/
├── video/
└── assets/
```

### Run Locally

```bash
python3 -m http.server 8000   # or: http-server -p 8000
```

Open `http://localhost:8000`.

### Deploy (GitHub Pages)

Push to `main`, enable **Pages** from repository Settings → Pages → Deploy from a branch → `main` /root.

### SEO & Performance Snippets

See the Arabic section for `<head>` tags, lazy‑loading images, and video tips.

### Roadmap

* Language toggle (AR/EN)
* Case studies with live demos
* Sitemap & robots

### License

Released under the **MIT License** — see [`LICENSE`](./LICENSE).

### Contact

* Email: `<your-email@example.com>`
* WhatsApp: `https://wa.me/<your-number>`
* LinkedIn: `https://www.linkedin.com/in/<your-handle>/`

---

## 📸 لقطات (Screenshots)

ضع لقطات في `docs/` ثم اربطها هنا:

```markdown
![Homepage](docs/screenshot-home.jpg)
![Services](docs/screenshot-services.jpg)
```

## 🔗 روابط مفيدة (Optional)

* أيقونات: [https://icons.getbootstrap.com/](https://icons.getbootstrap.com/) | [https://fontawesome.com/](https://fontawesome.com/)
* مولد شارات: [https://shields.io](https://shields.io)
* فحص التباين: [https://webaim.org/resources/contrastchecker/](https://webaim.org/resources/contrastchecker/)


