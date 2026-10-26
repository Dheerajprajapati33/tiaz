const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    // Bullion Metal: GOLD or SILVER
    metalType: {
      type: String,
      enum: ['GOLD', 'SILVER'],
      required: true,
      index: true
    },

    // Weight in grams (e.g., 1, 2, 5, 10, 20, 50, 100)
    weightGrams: {
      type: Number,
      required: true,
      min: 0.01,
      index: true
    },

    // Direct product price in ₹
    price: {
      type: Number,
      required: true,
      min: 0
    },

    // Stock availability
    inStock: {
      type: Boolean,
      default: true,
      index: true
    },

    // Images
    images: {
      type: [String],
      default: []
    },

    imageUrl: {
      type: String,
      default: null
    },

    // Description
    description: {
      type: String,
      default: ''
    },

    // Active status
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual or pre-save to ensure imageUrl is populated from images if not provided
productSchema.pre('save', function (next) {
  if (!this.imageUrl && this.images && this.images.length > 0) {
    this.imageUrl = this.images[0];
  } else if (this.imageUrl && (!this.images || this.images.length === 0)) {
    this.images = [this.imageUrl];
  }
  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('Product', productSchema);
