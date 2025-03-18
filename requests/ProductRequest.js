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
const productRequest = async (req, res) => {
  try {
    const subCategories = await SubCategoryModel.find().populate('category').populate('products');
    const categories = await CategoryModel.find()
      .select('slug name image')
      .populate({ path: 'subcategories', populate: { path: 'products', model: 'Product' } });
    res.status(201).send({ categories, subCategories });
  } catch (err) {
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
