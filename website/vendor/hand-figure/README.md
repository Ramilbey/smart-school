# Hand Figure

Qo‘l harakatlari bilan boshqariladigan 3D shakl. Kamera tasvirini va animatsiyani brauzerning o‘zida qayta ishlaydi — backend kerak emas.

## Ishga tushirish

Node.js o‘rnatilgan bo‘lishi kerak.

```bash
npm install
npm run dev
```

Terminalda ko‘rsatilgan manzilni brauzerda oching va kameradan foydalanishga ruxsat bering. `/?demo` manzilida kamerani yoqmasdan animatsiyani sinab ko‘rish mumkin.

## Boshqaruv

- **Birinchi aniqlangan qo‘l** shaklni boshqaradi: shakl qo‘l ustida suzib, uning harakatini kuzatadi.
- Ko‘tarilgan barmoqlar soni shaklni tanlaydi: 0 — silindr, 1 — chiziq, 2 — tekis rom, 3 — uchburchakli prizma, 4 — kub, 5 — beshburchakli prizma.
- **Ikkinchi qo‘l** qo‘shimcha boshqaruv vazifasini bajaradi:
  - barmoqlarni chimchilash yoki qo‘lni yumish — shaklni kichraytiradi; qo‘lni ochish — kattalashtiradi;
  - ko‘rsatkich barmoqni tez siltash — shaklni aylantiradi;
  - bilakni burash — shaklni ekranda qiyalatadi.

## Sozlash

- `src/main.js` ichidagi `CFG` qiymatlari kuzatish tezligi, balandlik, o‘lcham va aylanishni sozlaydi.
- `src/hands.js` boshidagi konstantalar imo-ishoralarni aniqlash chegaralarini sozlaydi.

## Texnologiyalar

- Three.js
- MediaPipe Hand Landmarker
- Vite
