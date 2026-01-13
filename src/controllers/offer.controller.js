const Offer = require('../models/Offer');
const Product = require('../models/Product');
const emailService = require('../services/email.service');

// Configuración (en producción vendría de .env o DB)
const MAX_DISCOUNT = process.env.MAX_DISCOUNT || 20; // 20% por defecto

// @desc    Crear contraoferta (público - usuarios y invitados)
// @route   POST /api/offers
// @access  Public (con o sin auth)
exports.createOffer = async (req, res, next) => {
  try {
    const {
      productId,
      productPrice,
      offeredPrice,
      comments,
      // Datos de cliente (invitado o registrado)
      customerEmail,
      customerName,
      customerPhone,
      isGuest,
    } = req.body;

    // Validaciones básicas
    if (!productId || !productPrice || !offeredPrice) {
      return res.status(400).json({ 
        success: false, 
        error: 'Datos incompletos' 
      });
    }

    if (!customerPhone) {
      return res.status(400).json({ 
        success: false, 
        error: 'El teléfono es obligatorio' 
      });
    }

    if (offeredPrice <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'El precio ofrecido debe ser mayor a 0' 
      });
    }

    if (offeredPrice > productPrice) {
      return res.status(400).json({ 
        success: false, 
        error: 'El precio ofrecido no puede ser mayor al precio del producto' 
      });
    }

    // Verificar producto
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Producto no encontrado' 
      });
    }

    // Determinar datos del cliente
    let customerData = {
      customerPhone,
      isGuest: isGuest || !req.user,
    };

    if (req.user) {
      // Usuario autenticado
      customerData.customer = req.userId;
      customerData.customerEmail = req.user.email;
      customerData.customerName = req.user.name;
    } else {
      // Invitado
      if (!customerEmail) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email no válido' 
        });
      }
      customerData.customerEmail = customerEmail;
      customerData.customerName = customerName || 'Cliente';
    }

    // Crear la oferta
    const offer = new Offer({
      product: productId,
      productPrice,
      productReference: product.reference || product._id.toString().slice(-6),
      offeredPrice,
      comments,
      ...customerData,
    });

    offer.discountPercentage = ((productPrice - offeredPrice) / productPrice) * 100;

    // Procesar oferta (calcular si está dentro del margen)
    offer.processOffer(MAX_DISCOUNT);

    await offer.save();

    // Enviar emails según resultado
    if (offer.withinMargin) {
      // DENTRO DEL MARGEN → Aceptada automáticamente
      
      // Email al cliente con cupón
      await emailService.sendAcceptedEmail(offer, product);
      
      // Email al admin notificando
      await emailService.sendAdminNotification(offer, product, 'within');

      return res.status(201).json({
        success: true,
        message: '¡Tu oferta ha sido aceptada! Revisa tu email para obtener tu código de descuento.',
        data: {
          status: offer.status,
          couponCode: offer.couponCode,
          discountPercentage: offer.discountPercentage.toFixed(2),
        },
      });
    } else {
      // FUERA DEL MARGEN → Pendiente de revisión
      
      // Email al admin para revisión
      await emailService.sendAdminNotification(offer, product, 'outside');
      
      // Email al cliente confirmando recepción
      await emailService.sendPendingEmail(offer, product);

      return res.status(201).json({
        success: true,
        message: 'Tu oferta ha sido enviada. Nos pondremos en contacto contigo pronto.',
        data: {
          status: offer.status,
          discountPercentage: offer.discountPercentage.toFixed(2),
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener ofertas (admin)
// @route   GET /api/offers
// @access  Private (admin)
exports.getOffers = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [offers, total] = await Promise.all([
      Offer.find(query)
        .populate('product', 'title price reference')
        .populate('customer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Offer.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        offers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una oferta
// @route   GET /api/offers/:id
// @access  Private (admin)
exports.getOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('product', 'title price reference images')
      .populate('customer', 'name email')
      .populate('reviewedBy', 'name');

    if (!offer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Oferta no encontrada' 
      });
    }

    res.json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// @desc    Aceptar oferta manualmente (admin)
// @route   PUT /api/offers/:id/accept
// @access  Private (admin)
exports.acceptOffer = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Oferta no encontrada' 
      });
    }

    // Aceptar manualmente
    offer.acceptManually(req.userId, notes);
    await offer.save();

    // Obtener producto para email
    const product = await Product.findById(offer.product);

    // Enviar email al cliente con cupón
    await emailService.sendAcceptedEmail(offer, product);

    res.json({
      success: true,
      message: 'Oferta aceptada. Se ha enviado el cupón al cliente.',
      data: {
        status: offer.status,
        couponCode: offer.couponCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rechazar oferta (admin)
// @route   PUT /api/offers/:id/reject
// @access  Private (admin)
exports.rejectOffer = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Oferta no encontrada' 
      });
    }

    // Rechazar
    offer.reject(req.userId, notes);
    await offer.save();

    // Enviar email al cliente notificando rechazo
    const product = await Product.findById(offer.product);
    await emailService.sendRejectedEmail(offer, product);

    res.json({
      success: true,
      message: 'Oferta rechazada.',
      data: { status: offer.status },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validar cupón
// @route   GET /api/offers/coupon/:code
// @access  Public
exports.validateCoupon = async (req, res, next) => {
  try {
    const offer = await Offer.findByCouponCode(req.params.code)
      .populate('product', 'title price');

    if (!offer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cupón no encontrado' 
      });
    }

    if (offer.status !== 'accepted') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cupón no válido' 
      });
    }

    if (offer.couponUsed) {
      return res.status(400).json({ 
        success: false, 
        error: 'Este cupón ya ha sido utilizado' 
      });
    }

    res.json({
      success: true,
      data: {
        valid: true,
        couponCode: offer.couponCode,
        discountPercentage: offer.discountPercentage,
        productId: offer.product._id,
        productTitle: offer.product.title,
        offeredPrice: offer.offeredPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Usar cupón (marcar como usado)
// @route   POST /api/offers/coupon/:code/use
// @access  Private
exports.useCoupon = async (req, res, next) => {
  try {
    const offer = await Offer.findByCouponCode(req.params.code);

    if (!offer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cupón no encontrado' 
      });
    }

    offer.useCoupon();
    await offer.save();

    res.json({
      success: true,
      message: 'Cupón aplicado correctamente',
      data: { status: offer.status },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener estadísticas (admin)
// @route   GET /api/offers/stats
// @access  Private (admin)
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Offer.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDiscount: { $avg: '$discountPercentage' },
        },
      },
    ]);

    const total = await Offer.countDocuments();
    const withinMargin = await Offer.countDocuments({ withinMargin: true });
    const outsideMargin = await Offer.countDocuments({ withinMargin: false });

    res.json({
      success: true,
      data: {
        total,
        withinMargin,
        outsideMargin,
        byStatus: stats,
      },
    });
  } catch (error) {
    next(error);
  }
};
