const express = require('express');
const app = express();
const env = require('dotenv');
const { ProductModel, SubCategoryModel, CategoryModel } = require('../model/ProductModel');
const cookieParser = require('cookie-parser');
const compression = require('compression');
env.config();

// Remove the conflicting CORS configuration - it's handled in main index.js
// app.use(
//   cors({
//     origin: [
//       'https://www.stilesagio.com',
//       'http://localhost:5173',
//       'https://stile-frontend-9jne.vercel.app',
//       'https://stile-12333.vercel.app',
//       'https://admin-stile-12333.vercel.app',
//     ],
//     credentials: true, // Allow cookies and authentication headers
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow specific HTTP methods
//     allowedHeaders: ['Content-Type', 'Authorization'], // Ensure necessary headers are allowed
//   })
// );
app.use(compression());
app.use(cookieParser());
app.use(express.json());
const SECRET = process.env.SECRET || '12@dmrwejfwf3rnwnrm';
// simple in-memory cache to reduce DB load for home payload
const cacheStore = new Map();
const getOrSetCache = async (key, ttlMs, fetcher) => {
  const entry = cacheStore.get(key);
  const now = Date.now();
  if (entry && entry.expiry > now) return entry.value;
  const value = await fetcher();
  cacheStore.set(key, { value, expiry: now + ttlMs });
  return value;
};

const productRequest = async (req, res) => {
  try {
    const data = await getOrSetCache('home_products_v1', 1000 * 60 * 60 * 72, async () => {
      const subCategories = await SubCategoryModel.find()
        .select('name slug image')
        .populate({
          path: 'products',
          select: 'name slug price images discount discountedPrice',
          options: { limit: 8, sort: { createdAt: -1 } },
          model: 'Product',
        })
        .lean();

      const categories = await CategoryModel.find().select('slug name image').lean();
      return { categories, subCategories };
    });

    res.status(200).send(data);
  } catch (err) {
    console.error('Error in productRequest:', err);
    res.status(400).send('Error fetching products');
  }
};

const uniqueProductRequest = async (req, res) => {
  const { name } = req.params;
  try {
    const product = await ProductModel.find({ slug: name }).populate('subcategory');
    res.send(product);
  } catch (err) {
    console.log(err);
    res.send('Error');
  }
};

const categoryRequest = async (req, res) => {
  const { category } = req.params;
  try {
    const Products = await ProductModel.find({ category: category });
    res.send(Products);
  } catch (err) {
    res.send(err);
  }
};
module.exports = { productRequest, uniqueProductRequest, categoryRequest };
