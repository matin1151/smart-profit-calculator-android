# محاسبه‌گر سود هوشمند — نسخه Android

این پروژه نسخه اندروید اپلیکیشن «محاسبه‌گر سود هوشمند» بیدرانو است و رابط وب موجود را با Capacitor داخل Android اجرا می‌کند.

## مشخصات
- نام برنامه: محاسبه‌گر سود هوشمند
- Package ID: `com.bidrano.smartprofitcalculator`
- رابط کاربری: فارسی و RTL
- واحد پول: تومان
- ذخیره محصولات: localStorage دستگاه
- نمودار سود: Canvas
- نسخه فعلی: 1.0.0

## ساخت APK / AAB
پیش‌نیازها:
- Node.js 20+
- JDK 21
- Android Studio + Android SDK

سپس:
```bash
npm install
npx cap add android
npx cap sync android
```

برای APK تستی:
```bash
cd android
./gradlew assembleDebug
```

برای انتشار در کافه‌بازار، بهتر است AAB/APK نهایی با کلید امضای انتشار ساخته شود و آیکون، نسخه و اطلاعات ناشر در Android Studio تکمیل شوند.
