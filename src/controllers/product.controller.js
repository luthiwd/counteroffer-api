const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, search, page = 1, limit = 10 } = req.query;

    const query = { status: 'active' };

    // Filters
    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('seller', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'seller',
      'name email'
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (seller)
exports.createProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      category,
      images,
      allowOffers,
      minOfferPercentage,
    } = req.body;

    const product = await Product.create({
      title,
      description,
      price,
      category,
      images,
      allowOffers,
      minOfferPercentage,
      seller: req.userId,
    });

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (owner)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check ownership
    if (product.seller.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }

    const allowedUpdates = [
      'title',
      'description',
      'price',
      'category',
      'images',
      'status',
      'allowOffers',
      'minOfferPercentage',
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (owner)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check ownership
    if (product.seller.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }

    await product.deleteOne();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my products
// @route   GET /api/products/mine
// @access  Private
exports.getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.userId }).sort({
      createdAt: -1,
    });

    res.json({ products });
  } catch (error) {
    next(error);
  }
};
