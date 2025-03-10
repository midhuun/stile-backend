const express = require('express');
const mongoose = require('mongoose');
const { ProductModel, SubCategoryModel } = require('../model/ProductModel');
const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
  try {
    res.header('Content-Type', 'application/xml');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add Home Page
    xml += `<url><loc>https://stilesagio.com/</loc></url>`;
    const products = await ProductModel.find().sort({ createdAt: -1 }).limit(1000);
    const subcategories = await SubCategoryModel.find().sort({ createdAt: -1 }).limit(1000);
    // Add Product Pages
    products.forEach((product) => {
      xml += `<url><loc>https://stilesagio.com/product/${product.slug}</loc></url>`;
    });

    // Add Category Pages
    subcategories.forEach((category) => {
      xml += `<url><loc>https://stilesagio.com/subcategory/${category.slug}</loc></url>`;
    });

    xml += `</urlset>`;

    console.log('Sitemap generated successfully.');
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
