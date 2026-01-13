# Counteroffer API

REST API para sistema de contraofertas de productos. Basado en el módulo PrestaShop `iagt_counteroffer`, reescrito en Node.js.

## Flujo de Contraofertas

```
Usuario hace oferta (precio_ofrecido)
              ↓
    Calcular descuento:
    (precio_original - precio_ofrecido) / precio_original × 100
              ↓
    ¿Descuento <= MAX_DISCOUNT (20%)?
              ↓
         SÍ                          NO
          ↓                           ↓
    ACEPTADA auto                 PENDIENTE
    - Genera cupón                - Email admin
    - Email cliente               - Email cliente
    - Email admin                 - Espera revisión
              ↓                           ↓
    Cupón USADO              Admin ACEPTA / RECHAZA
          ↓                           ↓
      EXPIRADA               ACEPTADA / RECHAZADA
```

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcrypt
- **Email:** Nodemailer
- **Validation:** express-validator
- **Testing:** Jest + Supertest

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/DevInigo/counteroffer-api.git
cd counteroffer-api

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar en desarrollo
npm run dev

# Iniciar en producción
npm start
```

## Endpoints

### Contraofertas (Público)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/offers` | Crear contraoferta |
| GET | `/api/offers/coupon/:code` | Validar cupón |

### Contraofertas (Admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/offers` | Listar ofertas |
| GET | `/api/offers/stats` | Estadísticas |
| GET | `/api/offers/:id` | Ver oferta |
| PUT | `/api/offers/:id/accept` | Aceptar manualmente |
| PUT | `/api/offers/:id/reject` | Rechazar |

### Auth

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Usuario actual |

### Productos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products` | Listar productos |
| GET | `/api/products/:id` | Ver producto |
| POST | `/api/products` | Crear producto |
| PUT | `/api/products/:id` | Actualizar |
| DELETE | `/api/products/:id` | Eliminar |

## Crear Contraoferta

```bash
# Usuario invitado
curl -X POST http://localhost:3000/api/offers \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "64abc123...",
    "productPrice": 15000,
    "offeredPrice": 13500,
    "customerEmail": "cliente@email.com",
    "customerName": "Juan García",
    "customerPhone": "+34 612 345 678",
    "isGuest": true,
    "comments": "Me interesa mucho este vehículo"
  }'

# Usuario autenticado
curl -X POST http://localhost:3000/api/offers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "productId": "64abc123...",
    "productPrice": 15000,
    "offeredPrice": 13500,
    "customerPhone": "+34 612 345 678"
  }'
```

## Respuestas

### Oferta dentro del margen (aceptada automáticamente)
```json
{
  "success": true,
  "message": "¡Tu oferta ha sido aceptada! Revisa tu email para obtener tu código de descuento.",
  "data": {
    "status": "accepted",
    "couponCode": "OFFER-ABC123-G456789",
    "discountPercentage": "10.00"
  }
}
```

### Oferta fuera del margen (pendiente)
```json
{
  "success": true,
  "message": "Tu oferta ha sido enviada. Nos pondremos en contacto contigo pronto.",
  "data": {
    "status": "pending",
    "discountPercentage": "25.00"
  }
}
```

## Estados de Oferta

| Estado | Descripción |
|--------|-------------|
| `pending` | Fuera del margen, esperando revisión manual |
| `accepted` | Aceptada (auto o manual), cupón generado |
| `rejected` | Rechazada por admin |
| `expired` | Cupón utilizado |

## Configuración

| Variable | Descripción | Default |
|----------|-------------|---------|
| `MAX_DISCOUNT` | % máximo para aceptación automática | 20 |
| `SHOP_NAME` | Nombre de la tienda | Mi Tienda |
| `ADMIN_EMAIL` | Email para notificaciones admin | SMTP_USER |

## Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## Estructura

```
src/
├── controllers/
│   ├── auth.controller.js
│   ├── offer.controller.js      # ⭐ Lógica principal
│   └── product.controller.js
├── models/
│   ├── Offer.js                 # ⭐ Estados y métodos
│   ├── Product.js
│   └── User.js
├── routes/
│   ├── auth.routes.js
│   ├── offer.routes.js
│   └── product.routes.js
├── middlewares/
│   ├── auth.js
│   ├── errorHandler.js
│   └── validate.js
├── services/
│   └── email.service.js         # ⭐ Notificaciones
├── app.js
└── server.js
```

## Diferencias con PHP Original

| PHP (PrestaShop) | Node.js |
|------------------|---------|
| Módulo acoplado a PS | API REST independiente |
| MySQL + PrestaShop ORM | MongoDB + Mongoose |
| Cupones en tabla PS | Cupones en documento Offer |
| Templates Smarty | HTML en servicio email |

## Autor

**Íñigo Muñoz** - Backend Developer & Technical Owner  
[LinkedIn](https://www.linkedin.com/in/imjdev/) | [GitHub](https://github.com/DevInigo)

## Licencia

MIT
