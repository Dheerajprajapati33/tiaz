const mongoose = require('mongoose');
const Product = require('../models/Product');
const logger = require('../config/logger');

// Initial baseline seed products with direct pricing
const INITIAL_PRODUCTS = [
  // --- Gold Products ---
  {
    name: '1g 24K Gold Coin (999.9 Purity)',
    metalType: 'GOLD',
    weightGrams: 1,
    price: 7950,
    inStock: true,
    images: ['https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80'],
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80',
    description: '1 Gram 24 Karat 999.9 Pure Gold Coin with tamper-evident certicard packaging from MMTC-PAMP.',
    isActive: true
  },
  {
    name: '2g 24K Gold Coin (999.9 Purity)',
    metalType: 'GOLD',
    weightGrams: 2,
    price: 15600,
    inStock: true,
    images: ['https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80'],
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80',
    description: '2 Grams 24 Karat 999.9 Pure Gold Coin with Lotus motif and international laboratory certificate.',
    isActive: true
  },
  {
    name: '5g 24K Gold Coin (999.9 Purity)',
    metalType: 'GOLD',
    weightGrams: 5,
    price: 38800,
    inStock: true,
    images: ['https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80'],
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80',
    description: '5 Grams 24 Karat 999.9 Pure Gold Coin. Highly liquid, investment-grade minted bullion.',
    isActive: true
  },
  {
    name: '10g 24K Gold Coin (999.9 Purity)',
    metalType: 'GOLD',
    weightGrams: 10,
    price: 77200,
    inStock: true,
    images: ['https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80'],
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80',
    description: '10 Grams 24 Karat pure investment gold coin. High security hologram certification.',
    isActive: true
  },
  {
    name: '50g 24K Gold Minted Bar',
    metalType: 'GOLD',
    weightGrams: 50,
    price: 385000,
    inStock: true,
    images: ['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80'],
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    description: '50 Grams 24 Karat 999.9 cast gold bullion bar with individual serial number.',
    isActive: true
  },

  // --- Silver Products ---
  {
    name: '10g 999 Fine Silver Coin',
    metalType: 'SILVER',
    weightGrams: 10,
    price: 1150,
    inStock: true,
    images: ['https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&w=600&q=80'],
    imageUrl: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&w=600&q=80',
    description: '10 Grams 99.9% pure silver coin with mirrored finish and airtight acrylic capsule.',
    isActive: true
  },
  {
    name: '20g 999 Fine Silver Coin',
    metalType: 'SILVER',
    weightGrams: 20,
    price: 2250,
    inStock: true,
    images: ['https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&w=600&q=80'],
    imageUrl: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&w=600&q=80',
    description: '20 Grams 99.9% pure silver coin, ideal for auspicious gifting and physical saving.',
    isActive: true
  },
  {
    name: '50g 999 Fine Silver Coin',
    metalType: 'SILVER',
    weightGrams: 50,
    price: 5400,
    inStock: true,
    images: ['https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&w=600&q=80'],
    imageUrl: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&w=600&q=80',
    description: '50 Grams 99.9% Fine Silver Coin. Hallmark certified with laser-etched security seal.',
    isActive: true
  },
  {
    name: '100g 999 Fine Silver Bar',
    metalType: 'SILVER',
    weightGrams: 100,
    price: 10600,
    inStock: true,
    images: ['https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80'],
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80',
    description: '100 Grams 999 purity minted silver bar with serialized assay certificate card.',
    isActive: true
  },
  {
    name: '250g 999 Fine Silver Bar',
    metalType: 'SILVER',
    weightGrams: 250,
    price: 26200,
    inStock: true,
    images: ['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80'],
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    description: '250 Grams pure silver cast ingot. MMTC-PAMP refinery quality assurance.',
    isActive: true
  },
  {
    name: '1000g (1 Kg) 999 Fine Silver Bar',
    metalType: 'SILVER',
    weightGrams: 1000,
    price: 104000,
    inStock: true,
    images: ['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80'],
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    description: '1 Kilogram Master Bullion Silver Bar. Highest purity standard with refinery certificate.',
    isActive: true
  }
];

class ProductService {
  /**
   * Seed default catalog or repair any legacy records missing direct price
   */
  async ensureSeedProducts() {
    try {
      const count = await Product.countDocuments();
      if (count === 0) {
        await Product.insertMany(INITIAL_PRODUCTS);
        logger.info(`Seeded ${INITIAL_PRODUCTS.length} initial Gold and Silver physical products.`);
      } else {
        // Find any existing products that lack a direct price (from old schema) and update them
        const productsWithoutPrice = await Product.find({
          $or: [{ price: { $exists: false } }, { price: null }, { price: 0 }]
        });

        if (productsWithoutPrice && productsWithoutPrice.length > 0) {
          for (const item of productsWithoutPrice) {
            const seedMatch = INITIAL_PRODUCTS.find(
              (s) => s.name === item.name || (s.metalType === item.metalType && Math.abs(s.weightGrams - (item.weightGrams || 0)) < 0.01)
            );
            const resolvedPrice = seedMatch ? seedMatch.price : (item.metalType === 'GOLD' ? (item.weightGrams || 1) * 7800 : (item.weightGrams || 10) * 110);
            const resolvedImages = item.images && item.images.length > 0 ? item.images : (seedMatch ? seedMatch.images : []);
            const resolvedImageUrl = item.imageUrl || (seedMatch ? seedMatch.imageUrl : (resolvedImages[0] || null));

            await Product.updateOne(
              { _id: item._id },
              {
                $set: {
                  price: resolvedPrice,
                  images: resolvedImages,
                  imageUrl: resolvedImageUrl,
                  inStock: item.inStock !== false,
                  isActive: item.isActive !== false
                }
              }
            );
          }
          logger.info(`Auto-repaired ${productsWithoutPrice.length} existing products with direct prices.`);
        }
      }
    } catch (e) {
      logger.error('Error seeding/repairing products:', e.message);
    }
  }

  /**
   * Format product object safely for client output
   */
  formatProduct(p) {
    if (!p) return null;
    const rawPrice = Number(p.price || 0);
    const weight = Number(p.weightGrams || 0);
    const imageList = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.imageUrl ? [p.imageUrl] : []);
    const primaryImg = p.imageUrl || imageList[0] || null;
    const metalType = (p.metalType || 'GOLD').toUpperCase();
    const purity = metalType === 'GOLD' ? '24K (999.9)' : '999 Fine';
    const idStr = p._id ? p._id.toString() : null;

    return {
      _id: idStr,
      id: idStr, // Mobile / Flutter id alias
      name: p.name || 'Bullion Product',
      title: p.name || 'Bullion Product', // Mobile title alias
      metalType: metalType,
      category: metalType, // Mobile category alias
      type: metalType, // Mobile type alias
      purity: purity,
      weightGrams: weight,
      weight: weight, // Mobile weight alias
      formattedWeight: `${weight} gm`,
      price: rawPrice,
      amount: rawPrice, // Mobile amount alias
      formattedPrice: `₹${rawPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      inStock: p.inStock !== false,
      isAvailable: p.inStock !== false,
      images: imageList,
      imageUrl: primaryImg,
      image: primaryImg, // Mobile image alias
      primaryImage: primaryImg,
      description: p.description || '',
      isActive: p.isActive !== false,
      createdAt: p.createdAt || new Date(),
      updatedAt: p.updatedAt || new Date()
    };
  }

  /**
   * List products with search, metalType filter and scroll pagination
   */
  async getProducts({
    metalType = 'ALL',
    category = '',
    type = '',
    search = '',
    inStock = null,
    page = 1,
    limit = 10,
    includeInactive = false
  } = {}) {
    await this.ensureSeedProducts();

    const query = {};

    if (!includeInactive) {
      query.isActive = true;
    }

    const effectiveMetal = (metalType && metalType !== 'ALL' ? metalType : (category || type || 'ALL')).trim().toUpperCase();
    if (effectiveMetal && effectiveMetal !== 'ALL') {
      query.metalType = effectiveMetal;
    }

    if (inStock !== null && inStock !== undefined && inStock !== '') {
      query.inStock = inStock === 'true' || inStock === true || inStock === 1 || inStock === '1';
    }

    if (search && typeof search === 'string' && search.trim()) {
      // Escape special regex characters to avoid invalid regular expression crashes
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .sort({ createdAt: -1, weightGrams: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;
    const hasMore = pageNum < totalPages;
    const formattedList = products.map((p) => this.formatProduct(p));

    return {
      products: formattedList,
      items: formattedList, // Mobile / Flutter items array alias
      total,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasMore
      }
    };
  }

  /**
   * Get single product by ID
   */
  async getProductById(productId) {
    await this.ensureSeedProducts();

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    const product = await Product.findById(productId).lean();
    if (!product || (!product.isActive)) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    return this.formatProduct(product);
  }

  /**
   * ADMIN: Create a new product
   */
  async createProduct(data = {}) {
    const { name, metalType, weightGrams, price, inStock, images, imageUrl, description } = data;

    if (!name || typeof name !== 'string' || !name.trim()) {
      const error = new Error('Product name is required');
      error.statusCode = 400;
      throw error;
    }

    const normalizedMetal = (metalType || '').toString().trim().toUpperCase();
    if (!['GOLD', 'SILVER'].includes(normalizedMetal)) {
      const error = new Error('metalType must be either GOLD or SILVER');
      error.statusCode = 400;
      throw error;
    }

    const parsedWeight = parseFloat(weightGrams);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      const error = new Error('Valid weight in grams is required');
      error.statusCode = 400;
      throw error;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      const error = new Error('Valid product price is required');
      error.statusCode = 400;
      throw error;
    }

    let imageList = [];
    if (Array.isArray(images) && images.length > 0) {
      imageList = images.filter((img) => typeof img === 'string' && img.trim());
    } else if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
      imageList = [imageUrl.trim()];
    }

    const resolvedInStock = inStock !== undefined ? (inStock === true || inStock === 'true' || inStock === 1 || inStock === '1') : true;

    const product = await Product.create({
      name: name.trim(),
      metalType: normalizedMetal,
      weightGrams: parsedWeight,
      price: parsedPrice,
      inStock: resolvedInStock,
      images: imageList,
      imageUrl: imageList[0] || (typeof imageUrl === 'string' ? imageUrl.trim() : null),
      description: description && typeof description === 'string' ? description.trim() : '',
      isActive: true
    });

    return this.formatProduct(product);
  }

  /**
   * ADMIN: Update an existing product
   */
  async updateProduct(productId, data = {}) {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    const product = await Product.findById(productId);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.name !== undefined) {
      if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
        const error = new Error('Product name cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      product.name = data.name.trim();
    }

    if (data.metalType !== undefined) {
      const normalizedMetal = data.metalType.toString().trim().toUpperCase();
      if (!['GOLD', 'SILVER'].includes(normalizedMetal)) {
        const error = new Error('metalType must be either GOLD or SILVER');
        error.statusCode = 400;
        throw error;
      }
      product.metalType = normalizedMetal;
    }

    if (data.weightGrams !== undefined) {
      const parsedWeight = parseFloat(data.weightGrams);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        const error = new Error('Valid weight in grams is required');
        error.statusCode = 400;
        throw error;
      }
      product.weightGrams = parsedWeight;
    }

    if (data.price !== undefined) {
      const parsedPrice = parseFloat(data.price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        const error = new Error('Valid product price is required');
        error.statusCode = 400;
        throw error;
      }
      product.price = parsedPrice;
    }

    if (data.inStock !== undefined) {
      product.inStock = data.inStock === true || data.inStock === 'true' || data.inStock === 1 || data.inStock === '1';
    }

    if (data.description !== undefined) {
      product.description = typeof data.description === 'string' ? data.description.trim() : '';
    }

    if (data.images !== undefined) {
      product.images = Array.isArray(data.images) ? data.images.filter((img) => typeof img === 'string' && img.trim()) : [];
      if (product.images.length > 0) {
        product.imageUrl = product.images[0];
      }
    }

    if (data.imageUrl !== undefined) {
      product.imageUrl = typeof data.imageUrl === 'string' ? data.imageUrl.trim() : null;
      if (product.imageUrl && (!product.images || product.images.length === 0)) {
        product.images = [product.imageUrl];
      }
    }

    if (data.isActive !== undefined) {
      product.isActive = Boolean(data.isActive);
    }

    await product.save();
    return this.formatProduct(product);
  }

  /**
   * ADMIN: Delete a product
   */
  async deleteProduct(productId) {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    return { success: true, message: 'Product deleted successfully', id: productId };
  }
}

module.exports = new ProductService();
