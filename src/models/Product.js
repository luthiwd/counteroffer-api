const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'EUR',
      enum: ['EUR', 'USD', 'GBP'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    images: [{
      type: String,
    }],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'inactive'],
      default: 'active',
    },
    allowOffers: {
      type: Boolean,
      default: true,
    },
    minOfferPercentage: {
      type: Number,
      default: 50, // Minimum offer as percentage of price
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
productSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
