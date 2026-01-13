# 🚀 CounterOffer API

![Node](https://img.shields.io/badge/node-18+-green)
![Express](https://img.shields.io/badge/express-4.x-lightgrey)
![MongoDB](https://img.shields.io/badge/mongodb-6.x-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Tests](https://img.shields.io/badge/tests-jest%20%2B%20supertest-brightgreen)
![Deploy](https://img.shields.io/badge/deploy-Railway-purple)

> REST API para sistema de contraofertas de productos.
> Reimplementación moderna en **Node.js** del módulo PrestaShop `iagt_counteroffer`.

🔗 **Live API:** [https://counteroffer-api-production.up.railway.app](https://counteroffer-api-production.up.railway.app)
📦 **Repo:** [https://github.com/luthiwd/counteroffer-api](https://github.com/luthiwd/counteroffer-api)

---

## 📌 ¿Qué es esto?

**CounterOffer API** permite a los clientes hacer ofertas por productos y:

* Si el descuento está dentro del margen → ✅ Se acepta automáticamente y se genera un cupón
* Si se pasa del margen → 🕒 Queda pendiente de revisión por un administrador
* El administrador puede aceptar o rechazar manualmente
* El cliente recibe notificaciones por email en todo el proceso
* Los cupones tienen ciclo de vida completo: `accepted → expired`

Diseñado para integrarse con:

* PrestaShop
* Magento
* Frontends custom
* Cualquier ecommerce

---

## 🔁 Flujo de negocio

```
Cliente hace oferta
        ↓
Se calcula % descuento
        ↓
¿ <= MAX_DISCOUNT ?
   ↓              ↓
  SÍ             NO
  ↓               ↓
ACEPTADA      PENDIENTE
  ↓               ↓
Cupón       Revisión admin
  ↓               ↓
USADO     ACEPTADA / RECHAZADA
  ↓
EXPIRADA
```

---

## 🧱 Tech Stack

* Node.js 18+
* Express
* MongoDB + Mongoose
* JWT + bcrypt
* Nodemailer
* express-validator
* Jest + Supertest

---

## 📦 Instalación

```bash
git clone https://github.com/luthiwd/counteroffer-api.git
cd counteroffer-api
npm install
cp .env.example .env
npm run dev
```

---

## ⚙️ Variables de entorno

| Variable       | Descripción            | Default   |
| -------------- | ---------------------- | --------- |
| `MAX_DISCOUNT` | % máximo auto-aceptado | 20        |
| `SHOP_NAME`    | Nombre de la tienda    | Mi Tienda |
| `ADMIN_EMAIL`  | Email admin            | SMTP_USER |
| `JWT_SECRET`   | Secreto JWT            | —         |
| `MONGO_URI`    | MongoDB URI            | —         |

---

## 🔐 Autenticación

### Registro

```bash
curl -X POST https://counteroffer-api-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "name": "Admin", "email": "admin@test.com", "password": "123456" }'
```

### Login

```bash
curl -X POST https://counteroffer-api-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@test.com", "password": "123456" }'
```

---

## 📦 Productos

```
POST   /api/products
GET    /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id
```

---

## 💰 Contraofertas

```
POST /api/offers
GET  /api/offers/coupon/:code
```

---

## 🛠️ Admin

```
GET /api/offers
GET /api/offers/:id
PUT /api/offers/:id/accept
PUT /api/offers/:id/reject
GET /api/offers/stats
```

---

## 📊 Estados de oferta

| Estado     | Descripción        |
| ---------- | ------------------ |
| `pending`  | Esperando revisión |
| `accepted` | Aceptada + cupón   |
| `rejected` | Rechazada          |
| `expired`  | Cupón usado        |

---

## 🧪 Testing

```bash
npm test
npm run test:coverage
npm run test:watch
```

---

## 🗂️ Estructura

```
src/
 ├── controllers/
 ├── models/
 ├── routes/
 ├── services/
 ├── middlewares/
 ├── app.js
 └── server.js
```

---

## 🔄 Comparación con PrestaShop

| PrestaShop      | CounterOffer API  |
| --------------- | ----------------- |
| Módulo acoplado | API independiente |
| MySQL           | MongoDB           |
| Cupones en PS   | Mongo             |
| Smarty          | Emails HTML       |

---

## 👨‍💻 Autor

**Íñigo Muñoz**
Backend Developer & Technical Owner

* GitHub: [https://github.com/luthiwd](https://github.com/luthiwd)
* LinkedIn: [https://www.linkedin.com/in/imjdev/](https://www.linkedin.com/in/imjdev/)

---

## 📄 Licencia

MIT