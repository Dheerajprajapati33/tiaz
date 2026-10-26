const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine the userId folder: authenticated user or pre-assigned ObjectId for registration
    if (!req.uploadUserId) {
      req.uploadUserId = req.user ? req.user._id.toString() : new mongoose.Types.ObjectId().toString();
    }
    const userFolder = path.join(__dirname, '../../uploads/users', req.uploadUserId);
    fs.mkdirSync(userFolder, { recursive: true });
    cb(null, userFolder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = allowedExtensions.test(file.mimetype);

  if (mimeType || allowedExtensions.test(ext)) {
    return cb(null, true);
  }
  cb(new Error('Only .png, .jpg, .jpeg, .webp, and .pdf formats are allowed!'));
};

const uploadRegistration = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB total
  fileFilter
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'aadhaarFront', maxCount: 1 },
  { name: 'aadhaarBack', maxCount: 1 },
  { name: 'panCard', maxCount: 1 }
]);

const uploadProfile = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

const uploadKyc = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

// Dedicated Storage for Bullion Products: uploads/products folder
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const productFolder = path.join(__dirname, '../../uploads/products');
    fs.mkdirSync(productFolder, { recursive: true });
    cb(null, productFolder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

const uploadProductImages = multer({
  storage: productStorage,
  limits: {
    fileSize: 600 * 1024, // 600 KB maximum limit per image
    files: 4 // Maximum 4 images
  },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = allowed.test(file.mimetype);
    if (mime || allowed.test(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only PNG, JPG, JPEG, and WebP image formats are allowed!'));
  }
}).array('images', 4);

module.exports = {
  uploadRegistration,
  uploadProfile,
  uploadKyc,
  uploadProductImages
};
