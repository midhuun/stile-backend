const { SitemapStream, streamToPromise } = require('sitemap');
const { createGzip } = require('zlib');
const express = require('express');
const { SubCategoryModel } = require('../model/ProductModel');
const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.header('Content-Encoding', 'gzip');

  try {
    const sitemap = new SitemapStream({ hostname: 'https://stilesagio.com' });

    // Add static pages
    sitemap.write({ url: '/', changefreq: 'daily', priority: 1.0 });
    sitemap.write({ url: '/contact', changefreq: 'monthly', priority: 0.7 });
    sitemap.write({ url: '/returns', changefreq: 'monthly', priority: 0.6 });
    const subcategories = await SubCategoryModel.find({}, 'slug');
    subcategories.forEach((subcategory) => {
      sitemap.write({
        url: `/subcategory/${subcategory.slug}`,
        changefreq: 'weekly',
        priority: 0.8,
      });
    });

    sitemap.end();

    const xml = await streamToPromise(sitemap.pipe(createGzip())).then((data) => data.toString());
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
