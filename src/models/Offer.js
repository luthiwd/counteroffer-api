const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    // Producto (vehículo)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
    },
    productReference: {
      type: String,
    },
    
    // Cliente (puede ser registrado o invitado)
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null si es invitado
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    
    // Oferta
    offeredPrice: {
      type: Number,
      required: [true, 'El precio ofrecido es obligatorio'],
      min: [0, 'El precio debe ser mayor a 0'],
    },
    discountPercentage: {
      type: Number, // Calculado: (productPrice - offeredPrice) / productPrice * 100
    },
    comments: {
      type: String,
      maxlength: 500,
    },
    
    // Estado
    status: {
      type: String,
      enum: [
        'pending',   // Fuera del margen, esperando revisión manual
        'accepted',  // Dentro del margen o aceptada manualmente
        'rejected',  // Rechazada manualmente por admin
        'expired',   // Cupón usado
      ],
      default: 'pending',
    },
    
    // Cupón generado (solo si aceptada)
    couponCode: {
      type: String,
      unique: true,
      sparse: true, // Permite múltiples null
    },
    couponUsed: {
      type: Boolean,
      default: false,
    },
    couponUsedAt: {
      type: Date,
    },
    
    // Control
    withinMargin: {
      type: Boolean, // true si descuento <= MAX_DISCOUNT
    },
    maxDiscountAllowed: {
      type: Number, // Guardar el margen que se aplicó
    },
    
    // Acciones manuales (si aplica)
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save: calcular porcentaje de descuento
offerSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('offeredPrice') || this.isModified('productPrice')) {
    this.discountPercentage = ((this.productPrice - this.offeredPrice) / this.productPrice) * 100;
  }
  next();
});

// Método: Generar código de cupón
offerSchema.methods.generateCouponCode = function () {
  const ref = this.productReference || this.product.toString().slice(-6);
  
  if (this.customer) {
    // Usuario registrado
    return `OFFER-${ref}-${this.customer.toString().slice(-6)}`;
  } else {
    // Invitado
    return `OFFER-${ref}-G${Date.now().toString().slice(-6)}`;
  }
};

// Método: Procesar oferta (lógica principal)
offerSchema.methods.processOffer = function (maxDiscount) {
  this.maxDiscountAllowed = maxDiscount;
  this.withinMargin = this.discountPercentage <= maxDiscount;
  
  if (this.withinMargin) {
    // Dentro del margen → Aceptar automáticamente
    this.status = 'accepted';
    this.couponCode = this.generateCouponCode();
  } else {
    // Fuera del margen → Pendiente de revisión
    this.status = 'pending';
  }
  
  return this;
};

// Método: Aceptar manualmente (admin)
offerSchema.methods.acceptManually = function (adminId, notes) {
  if (this.status !== 'pending') {
    throw new Error('Solo se pueden aceptar ofertas pendientes');
  }
  
  this.status = 'accepted';
  this.couponCode = this.generateCouponCode();
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;
  
  return this;
};

// Método: Rechazar (admin)
offerSchema.methods.reject = function (adminId, notes) {
  if (this.status !== 'pending') {
    throw new Error('Solo se pueden rechazar ofertas pendientes');
  }
  
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;
  
  return this;
};

// Método: Marcar cupón como usado
offerSchema.methods.useCoupon = function () {
  if (this.status !== 'accepted' || !this.couponCode) {
    throw new Error('No hay cupón válido');
  }
  
  if (this.couponUsed) {
    throw new Error('El cupón ya ha sido utilizado');
  }
  
  this.couponUsed = true;
  this.couponUsedAt = new Date();
  this.status = 'expired';
  
  return this;
};

// Estático: Buscar por código de cupón
offerSchema.statics.findByCouponCode = function (code) {
  return this.findOne({ couponCode: code });
};

// Índices
offerSchema.index({ customerEmail: 1 });
offerSchema.index({ product: 1 });
offerSchema.index({ status: 1 });
offerSchema.index({ couponCode: 1 });
offerSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Offer', offerSchema);
