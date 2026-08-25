# BRAND MARVEL

متجر Mobile First يعمل على GitHub Pages، والطلبات تُرسل إلى WhatsApp.

## 1) Firebase
أنشئ مشروع Firebase مجاني، ثم:
- أضف Web App.
- فعّل Authentication > Email/Password.
- فعّل Realtime Database.
- فعّل Storage إذا كنت ستخزن الصور داخله.
- انسخ Firebase Web Config إلى `firebase.js`.

**مهم:** لا تضع كلمة مرور الأدمن داخل أي ملف JavaScript.

أنشئ مستخدم الأدمن من Firebase Authentication بالبريد الذي تختاره وكلمة المرور التي تختارها.

## 2) Realtime Database
البنية المقترحة:
- `products`
- `categories`
- `shipping`
- `orders`
- `settings`

## 3) Security Rules
استخدم Authentication للأدمن. مثال مبدئي يحتاج إلى تخصيص أكثر قبل الإطلاق:

```json
{
  "rules": {
    ".read": true,
    "products": {
      ".write": "auth != null"
    },
    "categories": {
      ".write": "auth != null"
    },
    "shipping": {
      ".write": "auth != null"
    },
    "settings": {
      ".write": "auth != null"
    },
    "orders": {
      ".write": true,
      ".read": "auth != null"
    }
  }
}
```

للاستخدام الحقيقي، الأفضل تقييد الكتابة بحساب أدمن محدد عبر custom claims أو قائمة UID مسموحة. لا تعتبر القواعد أعلاه إعدادًا أمنيًا نهائيًا.

## 4) GitHub Pages
ارفع الملفات الموجودة في Root إلى Repository ثم:
Settings > Pages > Deploy from a branch > main > /root > Save

## 5) الصور
النسخة الحالية تدعم روابط صور المنتجات من لوحة الأدمن. يمكن تطوير رفع الصور مباشرة إلى Firebase Storage بعد ربط المشروع، مع مراعاة حدود الـFree Tier.

## 6) WhatsApp
رقم الطلبات الحالي:
+201286560161

Orange Cash:
01286560161

الموقع لا يعتبر Orange Cash مدفوعًا تلقائيًا؛ التأكيد يدوي.

## 7) ملاحظة مهمة
صفحة `admin.html` لا تعمل على Firebase فعليًا إلا بعد وضع Firebase config وإنشاء حساب Admin في Authentication. كلمة المرور التي وردت في مواصفات المشروع لم يتم تضمينها في الكود عمدًا.
