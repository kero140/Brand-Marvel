# BRAND MARVEL

## مهم جدًا قبل رفع الموقع
النسخة الأصلية التي أرسلتها كانت تحتوي على `YOUR_API_KEY` و`YOUR_PROJECT_ID` داخل `firebase.js`، لذلك صفحة Admin لا يمكنها تسجيل الدخول إلى Firebase. إنشاء مستخدم في Firebase وحده لا يكفي؛ يجب ربط الموقع نفسه بمشروع Firebase.

### 1) اربط الموقع بـFirebase
Firebase Console → Project settings → Your apps → Web app → Config.
انسخ كائن `firebaseConfig` كاملًا والصقه مكان القيم الموجودة في `firebase.js`. لا تضع كلمة مرور الأدمن في الملف.

### 2) Authentication
فعّل: Authentication → Sign-in method → Email/Password.
ثم أنشئ مستخدم الأدمن بنفس البريد وكلمة المرور التي تريدها.

### 3) Realtime Database
أنشئ Realtime Database. البنية المستخدمة: `products`, `categories`, `shipping`, `orders`, `settings`.

### 4) Security Rules
استخدم قواعد تسمح للزائر بقراءة المنتجات والإعدادات العامة، وتسمح للمستخدم الموثق بالكتابة. قبل الإطلاق العام يفضل تقييد الكتابة إلى UID الأدمن فقط.

### 5) GitHub Pages
ارفع محتويات مجلد `Brand-Marvel` إلى Root في Repository، ثم Settings → Pages → Deploy from a branch → main → /root.

### 6) Admin
افتح `admin.html` من نفس رابط GitHub Pages، ثم سجّل الدخول ببريد وكلمة مرور Firebase Authentication.

**لا ترسل كلمة مرور Firebase هنا.** إذا أردت مني ربط النسخة نهائيًا، أرسل فقط `firebaseConfig` الخاص بتطبيق الويب (apiKey/authDomain/databaseURL/projectId/messagingSenderId/appId)، وهو ليس كلمة مرور.
