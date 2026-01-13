const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { auth, optionalAuth, authorize } = require('../middlewares/auth');
const offerController = require('../controllers/offer.controller');

// Validación para crear oferta
const createOfferValidation = [
  body('productId').isMongoId().withMessage('ID de producto no válido'),
  body('productPrice')
    .isFloat({ min: 0 })
    .withMessage('Precio del producto debe ser positivo'),
  body('offeredPrice')
    .isFloat({ min: 0 })
    .withMessage('Precio ofrecido debe ser positivo'),
  body('customerPhone')
    .notEmpty()
    .withMessage('El teléfono es obligatorio'),
];

// === RUTAS PÚBLICAS ===

// Crear contraoferta (usuarios y invitados)
router.post(
  '/',
  optionalAuth, // Opcional: si está logueado, usa sus datos
  createOfferValidation,
  validate,
  offerController.createOffer
);

// Validar cupón
router.get('/coupon/:code', offerController.validateCoupon);

// === RUTAS PRIVADAS (requieren auth) ===

// Usar cupón
router.post('/coupon/:code/use', auth, offerController.useCoupon);

// === RUTAS ADMIN ===

// Obtener todas las ofertas
router.get(
  '/',
  auth,
  authorize('admin'),
  offerController.getOffers
);

// Obtener estadísticas
router.get(
  '/stats',
  auth,
  authorize('admin'),
  offerController.getStats
);

// Obtener una oferta
router.get(
  '/:id',
  auth,
  authorize('admin'),
  offerController.getOffer
);

// Aceptar oferta manualmente
router.put(
  '/:id/accept',
  auth,
  authorize('admin'),
  offerController.acceptOffer
);

// Rechazar oferta
router.put(
  '/:id/reject',
  auth,
  authorize('admin'),
  offerController.rejectOffer
);

module.exports = router;
