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

// Cache configuration - 72 hours (3 days)
const CACHE_DURATION_MS = 1000 * 60 * 60 * 72; // 72 hours
const CACHE_DURATION_SECONDS = 60 * 60 * 72; // 72 hours in seconds

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

// Cache management functions
const clearCache = (key = null) => {
  if (key) {
    cacheStore.delete(key);
    console.log(`Cache cleared for key: ${key}`);
  } else {
    cacheStore.clear();
    console.log('All cache cleared');
  }
};

const getCacheStats = () => {
  const now = Date.now();
  const stats = {
    totalEntries: cacheStore.size,
    activeEntries: 0,
    expiredEntries: 0,
    keys: []
  };
  
  for (const [key, entry] of cacheStore.entries()) {
    stats.keys.push(key);
    if (entry.expiry > now) {
      stats.activeEntries++;
    } else {
      stats.expiredEntries++;
    }
  }
  
  return stats;
};

const productRequest = async (req, res) => {
  try {
    const startTime = Date.now();
    
    const data = await getOrSetCache('home_products_v1', CACHE_DURATION_MS, async () => {
      // Execute queries in parallel for better performance
      const [subCategories, categories] = await Promise.all([
        SubCategoryModel.find()
          .select('name slug image')
          .populate({
            path: 'products',
            select: 'name slug price images discount discountedPrice',
            options: { limit: 8, sort: { createdAt: -1 } },
            model: 'Product',
          })
          .lean(),
        CategoryModel.find().select('slug name image').lean()
      ]);
      
      return { categories, subCategories };
    });

    const endTime = Date.now();
    console.log(`Product query completed in ${endTime - startTime}ms`);
    
    res.set('Cache-Control', `public, max-age=${CACHE_DURATION_SECONDS}`); // 72 hours cache
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

module.exports = { 
  productRequest, 
  uniqueProductRequest, 
  categoryRequest, 
  clearCache, 
  getCacheStats 
};
