const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { auth, optionalAuth } = require('../middlewares/auth');
const productController = require('../controllers/product.controller');

// Validation rules
const productValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
];

// Public routes
router.get('/', optionalAuth, productController.getProducts);
router.get('/:id', optionalAuth, productController.getProduct);

// Private routes
router.post('/', auth, productValidation, validate, productController.createProduct);
router.put('/:id', auth, productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);
router.get('/user/mine', auth, productController.getMyProducts);

module.exports = router;
