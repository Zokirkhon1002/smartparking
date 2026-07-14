# 🅿️ Smart Parking

![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

Avtoturargoh (parking) uchun mashinalarning kirish/chiqishini, parking to'lovini va mijozlar uchun **loyalty ball** tizimini boshqaruvchi Express + MongoDB REST API.

---

## 📋 Mundarija

- [Xususiyatlar](#-xususiyatlar)
- [Texnologiyalar](#️-texnologiyalar)
- [Loyiha strukturasi](#-loyiha-strukturasi)
- [O'rnatish](#-ornatish)
- [Muhit o'zgaruvchilari](#-muhit-ozgaruvchilari)
- [Ishga tushirish](#-ishga-tushirish)
- [API haqida qisqacha](#-api-haqida-qisqacha)
- [Narx va ball hisoblash mantig'i](#-narx-va-ball-hisoblash-mantigi)
- [Litsenziya](#-litsenziya)

---

## ✨ Xususiyatlar

- 🚗 Mashina **kirishi** va **chiqishi** (parking sessiyasi)ni to'liq kuzatib borish
- 💰 Parking vaqtiga qarab **avtomatik narx hisoblash** (24 soatgacha va undan keyin turli tarif)
- ⭐ Har bir mashina raqami uchun **loyalty ball** to'plash tizimi (maksimum 25 ball)
- 📜 Mashina bo'yicha **to'liq tarix** (barcha sessiyalar + ball ma'lumoti)
- 🧱 **Controller/Router** arxitekturasiga bo'lingan, toza va kengaytiriladigan kod tuzilishi
- 🛡️ Barcha endpoint'larda izchil **xatolik ushlash** (`asyncHandler`) va bir xil javob formati

---

## 🛠️ Texnologiyalar

| Texnologiya | Vazifasi |
|---|---|
| [Express](https://expressjs.com/) | HTTP server va routing |
| [Mongoose](https://mongoosejs.com/) | MongoDB uchun ODM |
| [MongoDB](https://www.mongodb.com/) | Ma'lumotlar bazasi |
| [cors](https://www.npmjs.com/package/cors) | Cross-Origin so'rovlarni boshqarish |
| Node.js `--env-file` | `.env` faylini o'qish (`dotenv` kutubxonasisiz) |

---

## 📁 Loyiha strukturasi

```
smart-parking/
├── controllers/
│   ├── carController.js     # mashina bilan bog'liq barcha route logikasi
│   └── pointController.js   # loyalty ball logikasi
├── routes/
│   ├── carRoutes.js         # /cars, /cars/:id, /exit-car
│   └── pointRoutes.js       # /points
├── models/
│   ├── userModel.js         # CarNumbers — bitta parking sessiyasi
│   └── pointModel.js        # Points — mashina bo'yicha ball tarixi
├── helpers/
│   └── helpers.js           # narx (getPrice) va vaqt (getHours) hisoblash
├── utils/
│   ├── asyncHandler.js      # try/catch takrorlanishini yo'q qiluvchi wrapper
│   └── response.js          # bir xil { state, message, data } javob shakli
├── plan/
│   └── planA.drawio         # ma'lumotlar modeli/oqim diagrammasi
├── index.js                 # Express sozlamalari, CORS, Mongo ulanish
├── FRONTEND_API.md          # frontend dasturchilar uchun to'liq API qo'llanma
├── CLAUDE.md                # loyiha arxitekturasi hujjati
└── package.json
```

---

## 🚀 O'rnatish

```bash
# repozitoriyni klonlash
git clone https://github.com/Zokirkhon1002/smartparking.git
cd smartparking

# bog'liqliklarni o'rnatish
npm install

# .env faylini sozlash
cp .env.copy .env
```

`.env` faylini o'zingizning MongoDB ulanish satringiz bilan to'ldiring (pastga qarang).

---

## 🔐 Muhit o'zgaruvchilari

`.env` faylida quyidagilar belgilanadi (`.env.copy` — namuna):

| O'zgaruvchi | Izoh | Standart qiymat |
|---|---|---|
| `PORT` | Server ishga tushadigan port | `4000` |
| `URL` | MongoDB ulanish satri (connection string) | — (majburiy) |

---

## ▶️ Ishga tushirish

```bash
# oddiy rejim
npm start

# auto-restart bilan (fayllar o'zgarganda serverni qayta yuklaydi)
npm run dev
```

Server ishga tushgach konsolda quyidagini ko'rasiz:

```
server is running on port: 4000
MongoDB is connected
```

---

## 📡 API haqida qisqacha

To'liq so'rov/javob namunalari, xatolik holatlari va batafsil tushuntirishlar uchun **[FRONTEND_API.md](./FRONTEND_API.md)** faylига qarang.

| Metod | Yo'l | Vazifasi |
|---|---|---|
| `GET` | `/cars` | Barcha mashina sessiyalari (tarix) |
| `GET` | `/cars/:id` | Mashina raqami bo'yicha tarix + ball ma'lumoti |
| `POST` | `/cars` | Mashina parkovkaga kiritish |
| `PUT` | `/cars` | Joriy narxni oldindan hisoblash (o'zgartirmasdan) |
| `PUT` | `/exit-car` | To'lov qilib mashinani chiqarish |
| `GET` | `/points` | Barcha mashinalarning loyalty ball ma'lumoti |

Barcha javoblar bir xil shaklda qaytadi:

```json
{ "state": true, "message": "success", "data": { } }
```

---

## 🧮 Narx va ball hisoblash mantig'i

- **Narx**: birinchi 24 soat — har soatiga **2000 so'm**, 24 soatdan keyin — har soatiga **1800 so'm**.
- **Ball**: mashina har safar to'lov qilib chiqqanda **1 ball** qo'shiladi, maksimal — **25 ball**.

Batafsil izoh va misollar uchun [FRONTEND_API.md](./FRONTEND_API.md) dagi tegishli bo'limlarga qarang.

---

## 📄 Litsenziya

Ushbu loyiha [ISC](https://opensource.org/licenses/ISC) litsenziyasi ostida tarqatiladi.

---

<p align="center">Zokirkhon tomonidan yaratilgan 🅿️</p>
