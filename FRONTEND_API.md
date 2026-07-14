# Smart Parking — Frontend uchun API qo'llanmasi

Ushbu hujjat Smart Parking backend API'sidan frontend tomonda foydalanish uchun yozilgan. Barcha endpoint'lar, so'rov/javob formatlari va biznes-mantiq (narx va ball hisoblash) shu yerda batafsil tushuntirilgan.

## Mundarija

- [Umumiy ma'lumot](#umumiy-malumot)
- [Javob formati](#javob-formati)
- [Ma'lumotlar modeli](#malumotlar-modeli)
- [Narx qanday hisoblanadi](#narx-qanday-hisoblanadi)
- [Ball (loyalty points) tizimi](#ball-loyalty-points-tizimi)
- [Endpoint'lar](#endpointlar)
  - [GET /](#get-)
  - [GET /cars](#get-cars)
  - [GET /cars/:id](#get-carsid)
  - [POST /cars — mashina kiritish](#post-cars--mashina-kiritish)
  - [PUT /cars — narxni oldindan ko'rish](#put-cars--narxni-oldindan-korish)
  - [PUT /exit-car — to'lov va chiqish](#put-exit-car--tolov-va-chiqish)
  - [GET /points](#get-points)
- [To'liq foydalanish oqimi (misol)](#toliq-foydalanish-oqimi-misol)
- [Xatoliklar bilan ishlash](#xatoliklar-bilan-ishlash)
- [Muhim eslatmalar](#muhim-eslatmalar)
- [Oxirgi backend yangilanishlari](#oxirgi-backend-yangilanishlari)

---

## Umumiy ma'lumot

- **Base URL**: `http://localhost:PORT` (PORT `.env` faylida belgilanadi, standart qiymat — `4000`; hozirgi ishlab turgan server `5000`-portda).
- **Content-Type**: barcha `POST`/`PUT` so'rovlarida `Content-Type: application/json` yuborilishi shart.
- **CORS**: server faqat quyidagi manbalardan (origin) kelgan so'rovlarga ruxsat beradi:
  - `http://example.com`
  - `http://localhost:3000`

  Agar frontend boshqa portda/domainda ishlasa (masalan `http://localhost:5173` — Vite), backenddagi `allowedOrigins` ro'yxatiga o'sha manzil qo'shilishi kerak, aks holda brauzer so'rovni CORS xatosi bilan bloklaydi.

- **Autentifikatsiya yo'q** — hozircha API ochiq, token yoki login talab qilinmaydi.

---

## Javob formati

API barcha javoblarni bir xil shaklda qaytaradi:

```json
{
  "state": true,
  "message": "success",
  "data": { }
}
```

| Maydon    | Turi               | Izoh                                                                 |
|-----------|---------------------|-----------------------------------------------------------------------|
| `state`   | `boolean`           | `true` — muvaffaqiyatli, `false` — xatolik yoki kutilmagan holat     |
| `message` | `string`            | Inson o'qiy oladigan xabar (ba'zilari o'zbekcha, ba'zilari inglizcha) |
| `data`    | `object \| array \| null` | Qaytarilgan ma'lumot; xatolik holatida odatda `null`            |

> ⚠️ **Muhim**: Ko'pchilik holatlarda (hatto xatolik bo'lganda ham) server **HTTP 200** status kodini qaytaradi — muvaffaqiyat/xatolikni aniqlash uchun HTTP status emas, javob tanasidagi **`state`** maydoniga qarash kerak. Faqat kutilmagan server xatoliklarida (masalan, noto'g'ri formatdagi ID yuborilganda) haqiqiy **HTTP 500** qaytadi (pastdagi [Xatoliklar bilan ishlash](#xatoliklar-bilan-ishlash) bo'limiga qarang).

---

## Ma'lumotlar modeli

### `CarNumbers` — bitta parking sessiyasi

| Maydon          | Turi      | Izoh                                                                |
|-----------------|-----------|----------------------------------------------------------------------|
| `_id`           | `string`  | Sessiyaning noyob ID'si — `PUT /exit-car`da `unique` sifatida ishlatiladi |
| `carNumber`     | `string`  | Mashina raqami (kamida 3 belgi)                                     |
| `pointId`       | `string \| null` | Bog'liq `Points` hujjatining ID'si (`null` bo'lishi mumkin — pastga qarang) |
| `exitTime`      | `string \| null` | Chiqish/to'lov vaqti. `null`/bo'sh bo'lsa — mashina hali parkovkada |
| `price`         | `number`  | To'langan narx (chiqishdan oldin `0`)                                |
| `paymentMethod` | `string`  | To'lov usuli (masalan `"card"`, `"cash"`)                            |
| `createdAt`     | `string`  | Mashina kirgan vaqt (ISO sana)                                       |
| `updatedAt`     | `string`  | Oxirgi yangilangan vaqt                                              |

### `Points` — mashina bo'yicha loyalty ball tarixi

| Maydon      | Turi       | Izoh                                                    |
|-------------|------------|----------------------------------------------------------|
| `_id`       | `string`   | Ball hujjatining ID'si                                    |
| `carNumber` | `string`   | Mashina raqami (har bir mashina uchun bitta `Points` hujjati) |
| `points`    | `number`   | To'plangan ball, **maksimum 25**                          |
| `usedTimes` | `number`   | Mashina necha marta parkovkadan foydalangani               |
| `car_ids`   | `string[]` | Ushbu mashinaning barcha `CarNumbers` sessiyalari ID'lari  |

---

## Narx qanday hisoblanadi

Narx `PUT /cars` (oldindan ko'rish) va real to'lov paytida quyidagi qoida bo'yicha hisoblanadi:

- Har **1 soat** — **2000 so'm** (agar parkovka vaqti **24 soatdan kam** bo'lsa).
- **24 soatdan ko'p** bo'lsa — qolgan har bir soat **1800 so'm** dan hisoblanadi.
- Chegirma (`discount`, foizda) bo'lsa, umumiy summadan foiz sifatida ayiriladi (hozirgi endpoint'larda chegirma ishlatilmaydi, lekin `helpers/helpers.js`dagi `getPrice` funksiyasi buni qo'llab-quvvatlaydi).

**Misol**: mashina 2 soat turgan bo'lsa → `2 × 2000 = 4000 so'm`.

Narx `PUT /cars` chaqirilganda **mashina hali chiqmagan holda** hisoblab beriladi (hech narsani o'zgartirmaydi, faqat oldindan ko'rsatish uchun) — real to'lov faqat `PUT /exit-car` chaqirilganda yozib qo'yiladi.

> `price` maydoni hech qachon manfiy bo'lmaydi — agar hisoblangan vaqt `0` yoki undan kichik chiqib qolsa (masalan server/klient soati farqi tufayli), narx `0` sifatida qaytariladi, manfiy summa emas.

---

## Ball (loyalty points) tizimi

- Har bir mashina raqami uchun bitta `Points` hujjati bo'ladi.
- Mashina birinchi marta **to'lov qilib chiqqanda** (`PUT /exit-car`), agar unga tegishli `Points` hujjati bo'lmasa — yangi hujjat yaratiladi (`points: 1`).
- Agar `Points` hujjati mavjud bo'lsa — har chiqishda `points` **1 taga oshadi**, lekin **25 dan oshmaydi**.
- Mashina **yangi kirganda** (`POST /cars`), agar undan oldin `Points` hujjati bo'lsa, u darhol yangi sessiyaga bog'lanadi (`pointId`) va `usedTimes` oshiriladi — lekin `points` soni faqat chiqishda (to'lovda) oshadi.

---

## Endpoint'lar

### `GET /`

Server ishlab turganini tekshirish uchun test endpoint.

**Javob:**
```json
"Rest API is working perfectly!"
```

---

### `GET /cars`

Barcha mashina sessiyalarini (tarixni) qaytaradi — hozir parkovkada turganlar ham, chiqib ketganlar ham.

**Muvaffaqiyatli javob:**
```json
{
  "state": true,
  "message": "success",
  "data": [
    {
      "_id": "6612799341b22888cd256731",
      "carNumber": "34mg5454",
      "exitTime": "2024-04-07T10:47:21.363Z",
      "price": 16.36,
      "paymentMethod": "card",
      "pointId": "661279b941b22888cd256738",
      "createdAt": "2024-04-07T10:46:43.149Z",
      "updatedAt": "2024-04-07T10:47:21.364Z"
    }
  ]
}
```

**Ma'lumot yo'q bo'lsa:**
```json
{ "state": false, "message": "There is not any data!", "data": null }
```

> Frontendda: hozir parkovkada turgan mashinalarni ko'rsatish uchun bu ro'yxatdan `exitTime` bo'sh/`null` bo'lganlarini filtrlang.

---

### `GET /cars/:id`

`:id` — mashina raqami (`carNumber`), Mongo `_id` emas! Berilgan mashina raqami bo'yicha **butun tarixni** va unga tegishli **ball ma'lumotini** birga qaytaradi.

**So'rov misoli:** `GET /cars/34mg5454`

**Muvaffaqiyatli javob:**
```json
{
  "state": true,
  "message": "success",
  "data": {
    "carData": [ /* CarNumbers massivi — shu raqamdagi barcha sessiyalar */ ],
    "pointData": { /* Points hujjati yoki null */ }
  }
}
```

**Topilmasa:**
```json
{ "state": false, "message": "There is not any data!", "data": null }
```

---

### `POST /cars` — mashina kiritish

Mashina parkovkaga **kirganda** chaqiriladi — yangi ochiq sessiya yaratadi.

**So'rov tanasi:**
```json
{ "carNumber": "01A777BB" }
```

| Qoida | Xato xabari |
|---|---|
| `carNumber` kamida 3 belgi bo'lishi kerak | `"string must be at least 3"` |
| Shu raqamdagi mashina allaqachon parkovkada (ochiq sessiya bor) bo'lsa | `"bu mashina hali chiqib ketmadi!"` |

**Muvaffaqiyatli javob:**
```json
{ "state": true, "message": "success", "data": null }
```

> Frontendda: mashina kiritish formasi shu endpoint'ga bog'lanadi. Muvaffaqiyatdan so'ng foydalanuvchini "mashinalar ro'yxati"ga qaytarish yoki `GET /cars` ni qayta yuklash tavsiya etiladi.

---

### `PUT /cars` — narxni oldindan ko'rish

Hali parkovkada turgan mashinaning **joriy narxini** (agar hozir chiqsa qancha to'lashini) hisoblab beradi. **Hech narsani o'zgartirmaydi** — faqat ko'rsatish uchun.

**So'rov tanasi:**
```json
{ "carNumber": "01A777BB" }
```

**Muvaffaqiyatli javob:**
```json
{
  "state": true,
  "message": "succes",
  "data": {
    "uniqueId": "6a55e61a215553865e263750",
    "price": "2.03",
    "enteredData": "2026-07-14T07:32:42.320Z",
    "today": "2026-07-14T07:32:42.486Z"
  }
}
```

| Maydon | Izoh |
|---|---|
| `uniqueId` | Bu — sessiyaning `_id`'si, `PUT /exit-car` so'rovida `unique` sifatida yuborilishi kerak |
| `price` | Hisoblangan joriy narx (satr ko'rinishida, 2 xonali) |
| `enteredData` | Mashina kirgan vaqt |
| `today` | Hozirgi vaqt (narx shu vaqtga nisbatan hisoblangan) |

**Xatolik holatlari:**
- `carNumber` 3 belgidan kam → `"string must be at least 3"`
- Bu mashina hozir parkovkada yo'q (ochiq sessiya topilmadi) → `"this car did not enter to our parking"`

> Frontendda: "To'lov" ekranini ochishdan oldin shu endpoint chaqirilib, foydalanuvchiga narx va `uniqueId` ko'rsatiladi. Keyin `uniqueId` — `PUT /exit-car`ga yuboriladi.

---

### `PUT /exit-car` — to'lov va chiqish

Mashina uchun **to'lovni yakunlaydi** va sessiyani yopadi (`exitTime` o'rnatiladi). Bu bosqichda ball (`points`) ham yangilanadi.

**So'rov tanasi:**
```json
{
  "unique": "6a55e61a215553865e263750",
  "price": 2.03,
  "paymentMethod": "card"
}
```

| Maydon | Izoh |
|---|---|
| `unique` | `PUT /cars` javobidan olingan `uniqueId` (sessiya `_id`'si) |
| `price` | Foydalanuvchi to'lagan summa |
| `paymentMethod` | To'lov usuli, masalan `"card"` yoki `"cash"` |

**Muvaffaqiyatli javob:**
```json
{ "state": true, "message": "to'lov amalga oshirildi", "data": null }
```

**Xatolik holatlari:**
| Holat | Javob |
|---|---|
| `unique` bo'yicha sessiya topilmadi | `{ "state": false, "message": "bunday mashina topilmadi" }` |
| Bu sessiya uchun to'lov allaqachon qilingan | `{ "state": false, "message": "bu mashina to'lov qilgan" }` |
| `unique` noto'g'ri formatda (masalan bo'sh yoki noto'g'ri ID) | **HTTP 500**, pastga qarang |

---

### `GET /points`

Barcha mashinalarning loyalty ball ma'lumotlarini qaytaradi.

**Muvaffaqiyatli javob:**
```json
{
  "state": true,
  "message": "success",
  "data": [
    {
      "_id": "661279b941b22888cd256738",
      "carNumber": "34mg5454",
      "points": 3,
      "usedTimes": 3,
      "car_ids": ["6612799341b22888cd256731", "661279ca41b22888cd25673f"]
    }
  ]
}
```

**Ma'lumot yo'q bo'lsa:**
```json
{ "state": false, "message": "There is not any data!", "data": null }
```

---

## To'liq foydalanish oqimi (misol)

Odatiy parking sessiyasi frontendda quyidagi tartibda amalga oshiriladi:

1. **Mashina kiradi** → `POST /cars` `{ carNumber: "01A777BB" }`
   → `{ state: true, message: "success" }`

2. **Mashina parkovkada** — kerak bo'lganda joriy holatni ko'rish uchun `GET /cars/01A777BB` chaqiriladi.

3. **Mashina chiqmoqchi, narxni bilish kerak** → `PUT /cars` `{ carNumber: "01A777BB" }`
   → `{ data: { uniqueId, price, ... } }` — narx va `uniqueId` frontendda ko'rsatiladi.

4. **Foydalanuvchi to'laydi** → `PUT /exit-car` `{ unique: uniqueId, price, paymentMethod }`
   → `{ state: true, message: "to'lov amalga oshirildi" }` — sessiya yopiladi, ball yangilanadi.

5. **Tarixni/ballarni ko'rish** → `GET /cars/01A777BB` yoki `GET /points`.

---

## Xatoliklar bilan ishlash

Frontendda har bir so'rovdan keyin **avval `state` maydoniga qarang**:

```js
const res = await fetch("/cars", { method: "POST", ... });
const json = await res.json();

if (!json.state) {
  // json.message — foydalanuvchiga ko'rsatiladigan xato matni
  showError(json.message);
  return;
}

// muvaffaqiyat — json.data bilan ishlang
```

**HTTP 500** holati alohida — bu odatiy biznes-xatolik emas, balki kutilmagan server xatosi (masalan, noto'g'ri formatdagi ID yuborilganda):

```json
{
  "state": false,
  "message": "server error",
  "msg": "Cast to ObjectId failed for value \"bad-id\" ..."
}
```

Bunday holatda `res.ok` (HTTP status 500) orqali ham aniqlash mumkin — frontendda buni "kutilmagan xatolik, keyinroq urinib ko'ring" kabi umumiy xabar bilan ko'rsatish tavsiya etiladi (`msg` maydonini foydalanuvchiga ko'rsatmang — u texnik tafsilot).

---

## Muhim eslatmalar

- **`pointId`** — backendda haqiqiy Mongo `ObjectId`, lekin JSON javobda har doim oddiy hex-satr ko'rinishida keladi (masalan `"661279b941b22888cd256738"`) — frontendda uni oddiy `string` sifatida ishlatishda hech qanday farq yo'q.
- Yangi mashina uchun avval hech qanday ball tarixi bo'lmasa, `pointId` `null` bo'ladi (JSON javobda `"pointId": null`) — bu xato emas, normal holat.
- `GET /cars/:id` dagi `:id` — bu **mashina raqami**, Mongo ID emas (chalkashmaslik kerak, boshqa endpoint'larda `unique`/`_id` ishlatiladi).
- Ko'pchilik muvaffaqiyatsiz holatlarda ham server **HTTP 200** qaytaradi — muvaffaqiyat/xatolikni faqat `state` bo'yicha aniqlang, HTTP status kodiga tayanmang (faqat `500` alohida holat).

---

## Oxirgi backend yangilanishlari

Quyidagi o'zgarishlar backend tomonda qilingan, frontend uchun ta'siri shu:

| O'zgarish | Frontendga ta'siri |
|---|---|
| `pointId` endi `null` bo'ladi (avval bo'sh satr `""` edi) | Frontendda `pointId` mavjudligini tekshirishda `if (pointId)` kabi shart ishlatilsa, hech narsa o'zgartirish shart emas — `null` va `""` ikkalasi ham "falsy" |
| `price` hisoblashda salbiy/noto'g'ri qiymat chiqishi bug'i tuzatildi | `PUT /cars` javobidagi `price` endi kafolatlangan holda `0` yoki undan katta bo'ladi |
| Backendda `carNumber` bo'yicha noyoblik (unique) va boshqa validatsiyalar kuchaytirildi | API javob shakli (`{state, message, data}`) o'zgarmadi — bu faqat ma'lumotlar bazasi darajasidagi ichki himoya, frontend hech narsa qilishi shart emas |
| Barcha endpoint'larda xatoliklarni ushlash (`try/catch`) izchil qilib chiqildi | Endi har qanday kutilmagan server xatosi (masalan noto'g'ri ID formatida) serverni "yiqitmaydi" — doim `{state:false, message:"server error", msg}` va HTTP 500 bilan javob qaytadi |

> Bu jadval — API'ning tashqi ko'rinishi (frontend uchun) deyarli o'zgarmagani, faqat ishonchliligi oshganini ko'rsatish uchun. Yuqoridagi barcha endpoint tavsiflari va misollari joriy holatga mos.
