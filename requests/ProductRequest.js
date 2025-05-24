const express = require('express');
const app = express();
const cors = require('cors');
const env = require('dotenv');
const { ProductModel, SubCategoryModel, CategoryModel } = require('../model/ProductModel');
const cookieParser = require('cookie-parser');
const compression = require('compression');
env.config();
app.use(
  cors({
    origin: [
      'https://www.stilesagio.com',
      'http://localhost:5173',
      'https://stile-frontend-9jne.vercel.app',
      'https://stile-12333.vercel.app',
      'https://admin-stile-12333.vercel.app',
    ],
    credentials: true, // Allow cookies and authentication headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Ensure necessary headers are allowed
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json());
const SECRET = process.env.SECRET || '12@dmrwejfwf3rnwnrm';

/**
 * Get all products with optimized performance and pagination
 */
const productRequest = async (req, res) => {
  try {
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Use Promise.all for parallel queries to improve performance
    const [subCategories, categories] = await Promise.all([
      SubCategoryModel.find()
        .select('name slug category products')
        .populate('category', 'name slug')
        .lean(),
      
      CategoryModel.find()
        .select('slug name image startingPrice')
        .populate({
          path: 'subcategories',
          select: 'name slug image',
          populate: {
            path: 'products',
            model: 'Product',
            select: 'name slug price images',
            options: { limit: 10 } // Limit number of products per subcategory
          }
        })
        .lean()
    ]);

    res.status(200).json({ categories, subCategories });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Error fetching products', message: err.message });
  }
};

/**
 * Get product details by name with optimized performance
 */
const uniqueProductRequest = async (req, res) => {
  try {
    const productName = req.params.name;
    
    // Find the product with lean query for better performance
    const product = await ProductModel.findOne({ slug: productName })
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .lean();

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get related products in the same subcategory (limited to 4)
    const relatedProducts = await ProductModel.find({
      subcategory: product.subcategory._id,
      _id: { $ne: product._id } // Exclude current product
    })
      .select('name slug price images')
      .limit(4)
      .lean();

    res.status(200).json({ product, relatedProducts });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Error fetching product details', message: err.message });
  }
};

/**
 * Get products by category with optimized performance
 */
const categoryRequest = async (req, res) => {
  try {
    const category = req.params.category;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Find category first
    const categoryDoc = await CategoryModel.findOne({ slug: category }).lean();
    
    if (!categoryDoc) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      ProductModel.find({ category: categoryDoc._id })
        .select('name slug price images category subcategory')
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments({ category: categoryDoc._id })
    ]);

    res.status(200).json({
      category: categoryDoc,
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total
    });
  } catch (err) {
    console.error('Error fetching category products:', err);
    res.status(500).json({ error: 'Error fetching category products', message: err.message });
  }
};

module.exports = { productRequest, uniqueProductRequest, categoryRequest };
