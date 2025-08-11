const express = require('express');
const app = express();
const cors = require('cors');
const env = require('dotenv');
const compression = require('compression');
const nodemailer = require('nodemailer');
const { connectTODB } = require('./config/database');
const { ProductModel, SubCategoryModel, CategoryModel } = require('./model/ProductModel');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { updateUser, loginUser, logoutUser, getUser } = require('./requests/userRequests');
const {
  productRequest,
  uniqueProductRequest,
  categoryRequest,
  clearCache,
  getCacheStats,
} = require('./requests/ProductRequest');
const { adminRequest } = require('./requests/adminrequests');
const { deleteRequest } = require('./requests/deleteRequest');
const { UserModel } = require('./model/UserModel');
const { userAuth } = require('./middleware/userlogin');
const { BannerModel } = require('./model/BannerModel');
const { OrderModel } = require('./model/OrderModel');
const { Cashfree } = require('cashfree-pg');
const path = require('path');
const { OtpModel } = require('./model/OTPModel');
const PaymentStatus = require('./model/PaymentStatus');
const ReviewModel = require('./model/ReviewModel');
const { default: mongoose } = require('mongoose');
const sitemap = require('./utils/sitemap');
const ShipModel = require('./model/ShipModel');
const { performanceMiddleware, getPerformanceStats } = require('./utils/performance');
// const Redis = require('ioredis');
env.config();
app.use(express.static(path.join(__dirname, 'public')));

// Enable compression for all responses
app.use(compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Create two CORS options - one specific, one wildcard for fallback
const corsOptions = {
  origin: [
    'https://www.stilesagio.com',
    'https://stilesagio.com',
    'http://localhost:5173',
    'https://stile-frontend-9jne.vercel.app',
    'https://stile-12333.vercel.app',
    'https://admin-stile-12333.vercel.app',
    '*'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Origin', 
    'Accept',
    'Cache-Control',
    'Referer',
    'User-Agent',
    'x-no-compression',
    'content-type',
    'cache-control'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204,
  preflightContinue: false
};

// If specific CORS doesn't work, uncomment the wildcard option below
const wildcardCorsOptions = {
  origin: '*', // WARNING: This allows any website to access your API
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Origin', 
    'Accept',
    'Cache-Control',
    'Referer',
    'User-Agent',
    'x-no-compression'
  ]
};

// Apply CORS middleware - use more permissive settings for development
if (process.env.NODE_ENV === 'production') {
  app.use(cors(corsOptions));
} else {
  // Development: Allow all origins and headers
  app.use(cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With', 
      'Origin', 
      'Accept',
      'Cache-Control',
      'Referer',
      'User-Agent',
      'x-no-compression',
      'content-type',
      'cache-control'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 204,
    preflightContinue: false
  }));
}

app.use(cookieParser());
app.use(express.json());
const clientID = process.env.X_CLIENT_ID || 'smfkskjjsjvsjmvs';
const clientSecret = process.env.X_CLIENT_SECRET || 'smfkskjjsjvsjmvs';
const port = process.env.PORT || 3000;
const SECRET = process.env.SECRET || '12@dmrwejfwf3rnwnrm';
Cashfree.XClientId = process.env.X_CLIENT_ID || '';
Cashfree.XClientSecret = process.env.X_CLIENT_SECRET || '';
Cashfree.XEnvironment = Cashfree.Environment[(process.env.CASHFREE_ENVIRONMENT || 'PRODUCTION').toUpperCase()];

// Performance monitoring middleware
app.use(performanceMiddleware);

// Handle preflight requests - this is already handled by the main CORS middleware above
// app.options('*', cors());

app.get('/user', getUser);
app.post('/user/login', loginUser);
app.post('/user/logout', logoutUser);
app.get('/', (req, res) => {
  res.send('Nodejs Running');
});
app.use('/', sitemap);

// Enhanced cache middleware with Redis-like functionality
const cache = (duration) => {
  return (req, res, next) => {
    // Cache is disabled (Redis removed)
    next();
  };
};

// In-memory cache for banner data
const bannerCache = new Map();
const getBannerCache = async (key, ttlMs, fetcher) => {
  const entry = bannerCache.get(key);
  const now = Date.now();
  if (entry && entry.expiry > now) return entry.value;
  const value = await fetcher();
  bannerCache.set(key, { value, expiry: now + ttlMs });
  return value;
};

// Optimize the allproducts endpoint for better performance
app.get('/allproducts', cache(300), async (req, res) => {
  try {
    const startTime = Date.now(); // For tracking performance
    console.log('Request received:', req.originalUrl);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Only select fields we need instead of returning whole documents
    const select = 'name slug price images discount discountedPrice';
    
    // Execute queries in parallel with Promise.all
    const [products, total] = await Promise.all([
      ProductModel.find()
        .select(select)
        .populate('category', 'name slug') // Only populate what we need
        .populate('subcategory', 'name slug') // Only populate what we need
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      ProductModel.countDocuments()
    ]);

    const response = {
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total
    };

    const endTime = Date.now();
    console.log(`Query completed in ${endTime - startTime}ms`);
    
    return res.json(response);
  } catch (error) {
    console.error('Error in /allproducts:', error);
    return res.status(500).json({ 
      error: 'Error fetching products',
      message: error.message
    });
  }
});

// Optimize the category endpoint for better performance
app.get('/category/:name', cache(300), async (req, res) => {
  try {
    const startTime = Date.now();
    const name = req.params.name;
    console.log(`Category request for: ${name}`);

    // First check if subcategory exists
    const subcategory = await SubCategoryModel.findOne({ slug: name })
      .select('name slug category image')
      .lean();
      
    if (!subcategory) {
      return res.status(404).send({ message: 'Category not found' });
    }
    
    // Only fetch essential fields
    const products = await ProductModel.find({ subcategory: subcategory._id })
      .select('name slug price images discount discountedPrice')
      .lean();
      
    const response = { subcategory, products };
    
    const endTime = Date.now();
    console.log(`Category query completed in ${endTime - startTime}ms`);
    
    return res.send(response);
  } catch (err) {
    console.error('Error in category endpoint:', err);
    return res.status(400).send({ message: 'Error Finding Category' });
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.log('Transporter Error:', error);
  } else {
    console.log('Transporter is ready to send emails!');
  }
});
app.get('/sitemap.xml', (req, res) => {
  const sitemapPath = path.join(__dirname, 'sitemap.xml');

  // Check if the file exists
  if (fs.existsSync(sitemapPath)) {
    res.header('Content-Type', 'application/xml');
    res.sendFile(sitemapPath);
  } else {
    res.status(404).send('Sitemap not found');
  }
});

// Lightweight product search endpoint for header search (reduces initial load)
app.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.json([]);
    const regex = new RegExp(q.replace(/[-/\\^$*+?.()|[\]{}]/g, '.'), 'i');
    const results = await ProductModel.find({ name: regex })
      .select('name slug images')
      .limit(10)
      .lean()
      .exec();
    res.json(results);
  } catch (err) {
    console.error('Error in /search:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});
// Reviews
app.get('/reviews/:productid', async (req, res) => {
  try {
    const productid = req.params.productid;
    const reviews = await ReviewModel.find({ product: productid }).populate('user');
    const reviewCount = await ReviewModel.countDocuments({ product: productid });
    const averageRating = await ReviewModel.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productid) } },
      { $group: { _id: '$product', averageRating: { $avg: '$rating' } } },
    ]);
    if (averageRating.length > 0) {
      res.json({ reviews, reviewCount, averageRating: averageRating[0].averageRating });
    } else {
      res.json({ reviews, reviewCount, averageRating });
    }
  } catch (err) {
    console.log(err);
  }
});
app.post('/reviews', async (req, res) => {
  try {
    const { rating, product, user, name, title, content } = req.body;
    const existingReview = await ReviewModel.findOne({ product: product, user: user });
    if (existingReview) {
      res.status(400).json({ message: "You've already reviewed this Product" });
    }
    const newreview = await new ReviewModel({ rating, content, product, user, name, title });
    await newreview.save();
    res.json(newreview);
  } catch (err) {
    console.log(err);
  }
});
// Contact API
app.post('/contact', async (req, res) => {
  const { name, email, message, product, quantity } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    // Send email to yourself (admin)
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'support@stilesagio.com', // Change to your email
      cc: 'midhun2031@gmail.com',
      subject: `New Contact Request from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message} ProductType: ${product}\nQuantity: ${quantity}`,
    });

    // Auto-reply to user
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'email',
      subject: 'Thanks for Contacting Stile Sagio',
      text: `Dear ${name},\n\nThanks for contacting Stile Sagio. We will reach you shortly.\n\nBest Regards,\nStile Sagio Team`,
    });

    res.status(200).json({ success: 'Message sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});
app.post('/track-order', async (req, res) => {
  try {
    const { order_id } = req.body;
    const auth_res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'midhuun.2003@gmail.com', password: 'Midhun@123' }),
    });
    const data = await auth_res.json();
    const { token } = data;
    const order_res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/track?order_id=${order_id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const order_data = await order_res.json();
    res.json(order_data[0]);
  } catch (err) {
    console.log(err);
  }
});
// Cart API
app.post('/user/addToCart', userAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const product = req.body.productdata;
    const decoded = jwt.verify(token, SECRET);
    const user = await UserModel.findOne({ _id: decoded.id });
    const cartItem = user.cart.find(
      (item) =>
        item.product.toString().includes(product._id) && item.selectedSize === req.body.selectedSize
    );

    if (cartItem) {
      cartItem.quantity += 1;
    } else {
      user.cart.push({ product: product._id, quantity: 1, selectedSize: req.body.selectedSize });
    }
    await user.save();
    res.status(201).send({ message: 'Item Added to Cart' });
  } catch (err) {
    console.log(err);
  }
});
app.get('/user/favourites', userAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, SECRET);
    const user = await UserModel.findOne({ _id: decoded.id }).populate({ path: 'favourites' });

    res.send({ favourites: user.favourites });
  } catch (err) {
    console.log(err);
  }
});
app.post('/user/addToFavourites', userAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    const { id } = req.body;
    const decoded = jwt.verify(token, SECRET);
    const user = await UserModel.findOne({ _id: decoded.id });
    const favItem = user.favourites.find((item) => item.toString().includes(id));
    if (favItem) {
      res.send({ message: 'Item Already Exists in Favourites' });
    } else {
      user.favourites.push(id);
    }
    await user.save();
    res.status(201).send({ message: 'Item Added to Favourites' });
  } catch (err) {
    console.log(err);
  }
});

app.post('/user/removeFromFavourites', userAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { productId } = req.body;
    const decoded = jwt.verify(token, SECRET);
    const user = await UserModel.findOne({ _id: decoded.id });
    user.favourites.pull(productId);
    await user.save();
    res.status(201).send({ message: 'Item Removed from Favourites' });
  } catch (err) {
    console.log(err);
  }
});
app.post('/user/removeFromCart', userAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const product = req.body.productdata;
    const decoded = jwt.verify(token, SECRET);
    const user = await UserModel.findOne({ _id: decoded.id });
    const cartItem = user.cart.find(
      (item) =>
        item.product.toString().includes(product._id) && item.selectedSize === req.body.selectedSize
    );

    if (cartItem) {
      if (cartItem.quantity === 1) {
        user.cart.pull({ product: product._id, selectedSize: req.body.selectedSize });
      } else {
        cartItem.quantity -= 1;
      }
    } else {
      res.status(400).send({ message: 'Item not found in cart' });
    }
    await user.save();
    res.status(201).send({ message: 'Item Deleted from the Cart' });
  } catch (err) {
    console.log(err);
  }
});
app.delete('/user/clearCart', userAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, SECRET);
    const user = await UserModel.findOne({ _id: decoded.id });
    user.cart = [];
    await user.save();
    res.status(204).send({ message: 'Cleared' });
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: err });
  }
});
app.post('/user/deleteFromCart', userAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const productdata = req.body.productdata;
    const decoded = jwt.verify(token, SECRET);
    const user = await UserModel.findOne({ _id: decoded.id });
    user.cart.pull({ product: productdata, selectedSize: req.body.selectedSize });

    await user.save();
    res.status(204).send({ message: 'Deleted' });
  } catch (err) {
    console.log(err);
  }
});
app.get('/user/cart', userAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, SECRET);
    const user = await UserModel.findOne({ _id: decoded.id }).populate({ path: 'cart.product' });
    res.send({ cart: user.cart });
  } catch (err) {
    console.log(err);
  }
});
app.patch('/user/update', updateUser);
app.get('/order/:orderid', userAuth, async (req, res) => {
  const orderid = req.params.orderid;
  try {
    const order = await OrderModel.findOne({ orderId: orderid })
      .populate({ path: 'products.product', model: 'Product' })
      .lean();
    res.send({ order });
  } catch (err) {
    console.log(err);
    res.status(401).send('Error Fetching Orders');
  }
});
app.get('/user/orders', userAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, SECRET);
    console.log(decoded);
    const userWithOrders = await UserModel.findOne({ _id: decoded.id })
      .populate({
        path: 'orders',
        populate: {
          path: 'products.product',
          model: 'Product',
        },
      })
      .exec();
    res.json(userWithOrders);
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: 'Error Fetching Orders' });
  }
});
app.post('/auth/truecaller/callback', (req, res) => {
  res.send({ message: 'Logged in' });
});
app.post('/user/order', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, SECRET);
    const user = await UserModel.findOne({ _id: decoded.id });
    const order = await new OrderModel({
      user: user._id,
      products: req.body.products,
      totalAmount: req.body.totalAmount,
      orderStatus: 'pending',
      paymentMethod: req.body.paymentMethod,
      pincode: req.body.pincode,
      address: req.body.address,
      email: req.body?.email,
      alternateMobile: req?.body?.alternateMobile,
      orderId: req.body.orderId || new Date().getTime().toString(),
      paymentStatus: 'Pending',
    });
    await user.orders.push(order);
    await user.save();
    await order.save();
    if (req.body.paymentMethod === 'cod') {
      const isDelivered = await PaymentStatus.findOne({ orderid: req.body.orderId });
      if (!isDelivered) {
        await PaymentStatus.create({ orderid: req.body.orderId, paymentStatus: 'SUCCESS' });
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: 'support@stilesagio.com',
          cc: 'midhun2031@gmail.com',
          subject: `New Order Placed - ${order.orderId}`,
          html: `
                    <h2>New Order Details</h2>
                    <p><strong>Customer Name:</strong> ${req.body.address.name}</p>
                    <p><strong>Email:</strong> ${user.phone}</p>
                    <p><strong>Order ID:</strong> ${order.orderId}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    <p><strong>Total Amount:</strong> Rs. ${order.totalAmount}</p>
                    <p><strong>Pincode:</strong> ${order.pincode}</p>
                    <p><strong>Address:</strong> ${order.address.location}</p>
                    <p><strong>City:</strong> ${order.address.city}</p>
                    ${
                      order.address.alternateMobile &&
                      `<p><strong>Alternate Mobile:</strong> ${order.address.alternateMobile}</p>`
                    }
                    <h3>Products Ordered:</h3>
                    <ul>
                        ${req.body.products
                          .map(
                            (item) => `
                            <li>
                                <strong>Product:</strong> ${item.product.name} <br />
                                <strong>Size:</strong> ${item.selectedSize} <br />
                                <strong>Quantity:</strong> ${item.quantity}
                            </li>
                        `
                          )
                          .join('')}
                    </ul>
                    <p style="color: red;"><strong>Please review and process the order.</strong></p>
                `,
        });
        return res.send({ message: 'Order Placed' });
      } else {
        return res.send({ message: 'Order Already Placed' });
      }
    }
    res.send({ message: 'Payment Processing' });
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: err });
  }
});
app.post('/order/delete/:orderid', async (req, res) => {
  const { phone } = req.body; // Extract phone from request body
  const orderId = req.params.orderid; // Extract order ID from params

  try {
    // Find and update the user, removing the order from their orders array
    await UserModel.findOneAndUpdate(
      { phone }, // Find user by phone
      { $pull: { orders: orderId } }, // Remove order from orders array
      { new: true } // Return updated user
    );
    await OrderModel.findByIdAndDelete(orderId);
    res.status(204).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/user/payment', async (req, res) => {
  const { name, phone, amount } = req.body;
  console.log('headers', req.headers);
  const orderID = new Date().getTime().toString();
  const customerID = `CUST_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const customerDetails = {
    customer_name: name,
    customer_phone: phone,
    customer_id: customerID,
  };
  const payload = {
    order_id: orderID,
    order_amount: amount,
    order_currency: 'INR',
    customer_details: customerDetails,
    order_note: 'Payment for order',
    // return_url:"https://stilesagio.com/payment/status",
    notify_url: 'https://stile-backend.vercel.app/webhook',
    order_meta: {
      return_url: `https://www.stilesagio.com/checkout/${orderID}`,
      notify_url: 'https://stile-backend.vercel.app/webhook',
    },
    // order_note:`Payment for order ${orderID}`,
    link_meta: {
      return_url: `https://www.stilesagio.com/checkout/${orderID}`,
      notify_url: 'https://stile-backend.vercel.app/webhook',
    },
  };
  try {
    const response = await Cashfree.PGCreateOrder('2023-08-01', payload);
    console.log('Cashfree response:', response.data);
    const { payment_session_id: token, order_id } = response.data;
    console.log('Extracted data:', { token, order_id });
    res.status(200).json({ token, order_id });
  } catch (err) {
    console.log(err.response.data);
    res.status(401).send(err.response.data);
  }
});
app.get('/verify/payment/:orderid', async (req, res) => {
  const orderid = req.params.orderid;
  console.log('Verifying payment for order:', orderid);
  const version = '2023-08-01';
  try {
    const response = await Cashfree.PGOrderFetchPayments(version, orderid);
    const paymentStatus = response?.data?.[0]?.payment_status;
    if (response.status === 200) {
    }
    console.log('Verify Status:', paymentStatus);

    if (!paymentStatus) {
      return res
        .status(400)
        .json({ message: 'Invalid response from payment gateway', success: false });
    }
    const statusMap = {
      SUCCESS: { status: 200, message: 'Payment done successfully', success: true },
      NOT_ATTEMPTED: { status: 200, message: 'Try to pay using the payment link', success: false },
      CANCELLED: { status: 400, message: 'You canceled the payment. Try again!', success: false },
      FAILED: { status: 400, message: 'Payment failed. Try again!', success: false },
      USER_DROPPED: {
        status: 400,
        message: 'Complete the payment to see the status!',
        success: false,
      },
      PENDING: { status: 202, message: 'Payment is Pending!', success: false },
      VOID: { status: 400, message: 'Error!', success: false },
    };
    const result = statusMap[paymentStatus] || {
      status: 400,
      message: 'Unknown error',
      success: false,
    };

    return res.status(result.status).json({ message: result.message, success: result.success });
  } catch (error) {
    console.error('Error verifying payment:', error?.response?.data || error);
    return res.status(500).json({ message: 'Internal server error', success: false });
  }
});

app.post('/admin/create/:field', adminRequest);
app.post('/webhook', async (req, res) => {
  console.log('Status', req.body.data);
  const orderid = req.body?.data?.order?.order_id || '';
  const paymentstatus = req.body?.data?.payment?.payment_status || '';
  await PaymentStatus.create({ orderid, paymentStatus: paymentstatus });
  res.send({ status: 200 });
});
app.get('/alluser/orders', async (req, res) => {
  try {
    const orders = await OrderModel.find({})
      .populate({ path: 'user' })
      .populate({ path: 'products.product' });
    res.send(orders);
  } catch (err) {
    console.log(err);
    res.send({ message: 'Error' });
  }
});
app.post('/payment/status/:orderid', async (req, res) => {
  try {
    const orderid = req.params.orderid;

    // Fetch the latest payment status
    let payment;
    try {
      payment = await PaymentStatus.findOne({ orderid }).sort({ updatedAt: -1 }).limit(1).exec();
    } catch (error) {
      console.error('Error fetching payment status:', error);
      return res.status(500).json({ message: 'Error fetching payment status', success: false });
    }

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found', success: false });
    }

    const status = payment.paymentStatus;

    if (status === 'SUCCESS') {
      let order;
      try {
        order = await OrderModel.findOne({ orderId: orderid })
          .populate('user')
          .populate('products.product')
          .exec();
      } catch (error) {
        console.error('Error fetching order:', error);
        return res.status(500).json({ message: 'Error fetching order details', success: false });
      }

      if (!order) {
        return res.status(404).json({ message: 'Order not found', success: false });
      }

      const orderedProducts = order?.products.map((product) => ({
        name: product.product.name,
        sku: `${product.product.slug}_${product.selectedSize}`,
        units: product.quantity,
        selling_price: product.product.price,
      }));

      let createData;
      const weight = orderedProducts.reduce((acc, product) => acc + product.units * 230, 0) / 1000;

      if (order.paymentStatus === 'Pending') {
        let token;
        try {
          const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'midhuun.2003@gmail.com', password: 'Midhun@123' }),
          });

          if (!authRes.ok) throw new Error('Failed to authenticate with Shiprocket');

          const authData = await authRes.json();
          token = authData.token;
        } catch (error) {
          console.error('Error authenticating with Shiprocket:', error);
          return res
            .status(500)
            .json({ message: 'Failed to authenticate with Shiprocket', success: false });
        }

        try {
          await OrderModel.updateOne({ orderId: orderid }, { paymentStatus: 'Paid' });
        } catch (error) {
          console.error('Error updating order payment status:', error);
          return res
            .status(500)
            .json({ message: 'Failed to update payment status', success: false });
        }

        let pincodeData;
        try {
          const pincodeRes = await fetch(
            `http://www.postalpincode.in/api/pincode/${order.pincode}`
          );
          pincodeData = await pincodeRes.json();
        } catch (error) {
          console.error('Error fetching pincode data:', error);
          return res.status(500).json({ message: 'Failed to fetch pincode data', success: false });
        }

        const now = new Date();
        const formattedDate = now.toISOString().slice(0, 16).replace('T', ' ');
        console.log(order.orderId);
        try {
          const createRes = await fetch(
            'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                order_id: orderid,
                order_date: formattedDate,
                pickup_location: 'Primary',
                billing_customer_name: order.address?.name || 'User',
                billing_address: order.address?.location,
                billing_last_name: '',
                billing_phone: order.user.phone,
                billing_email: order?.email || 'midhun2031@gmail.com',
                billing_state: pincodeData?.PostOffice?.[0]?.State || 'Unknown',
                billing_city: pincodeData?.PostOffice?.[0]?.District || 'Unknown',
                billing_country: 'India',
                billing_pincode: order?.pincode,
                shipping_is_billing: true,
                order_items: orderedProducts,
                payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
                sub_total: order.totalAmount,
                length: '40',
                width: '16',
                height: '2',
                breadth: '20',
                weight: weight,
              }),
            }
          );

          // if (!createRes.ok) throw new Error('Failed to create order with Shiprocket');

          createData = await createRes.json();
          console.log(createData);
        } catch (error) {
          console.error('Error creating order in Shiprocket:', error);
          return res.status(500).json({ message: error, success: false });
        }

        try {
          await ShipModel.create({ ...createData, my_order_id: orderid });
        } catch (error) {
          console.error('Error saving shipment data:', error);
        }

        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'support@stilesagio.com',
            cc: 'midhun2031@gmail.com',
            subject: `New Order Placed - ${order.orderId}`,
            html: `
              <h2>New Order Details</h2>
              <p><strong>Customer Phone:</strong> ${order.user.phone}</p>
              <p><strong>Customer Name:</strong> ${order.address.name}</p>
              <p><strong>Order ID:</strong> ${order.orderId}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
              <p><strong>Total Amount:</strong> Rs. ${order.totalAmount}</p>
              <p><strong>Pincode:</strong> ${order.pincode}</p>
              <p><strong>Address:</strong> ${order.address.location}</p>
              <p><strong>City:</strong> ${order.address.city}</p>
              ${
                order.address.alternateMobile
                  ? `<p><strong>Alternate Mobile:</strong> ${order.address.alternateMobile}</p>`
                  : ''
              }
              <h3>Products Ordered:</h3>
              <ul>
                ${order.products
                  .map(
                    (item) => `
                  <li>
                    <strong>Product:</strong> ${item.product.name} <br />
                    <strong>Size:</strong> ${item.selectedSize} <br />
                    <strong>Quantity:</strong> ${item.quantity}
                  </li>
                `
                  )
                  .join('')}
              </ul>
              <p style="color: red;"><strong>Please review and process the order.</strong></p>
            `,
          });
        } catch (error) {
          console.error('Error sending email:', error);
        }
      }

      return res
        .status(200)
        .json({ message: 'Payment Successful', success: true, payment: order.paymentMethod });
    } else if (status === 'FAILED') {
      return res.status(400).json({ message: 'Payment Failed', success: false });
    } else {
      return res.status(202).json({ message: 'Payment Pending', success: false });
    }
  } catch (error) {
    console.error('Unexpected Server Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', success: false });
  }
});

app.get('/subcategoryProducts/:subid', async (req, res) => {
  try {
    const subid = req.params.subid;
    const products = await ProductModel.find({ subcategory: subid });
    res.send(products);
  } catch (error) {
    res.send({ message: 'Error finding products' });
  }
});
app.patch('/admin/update/:field', async (req, res) => {
  const { field } = req.params;
  if (field === 'category') {
    try {
      const { name, imageURl, _id, startingPrice } = req.body;
      const data = await CategoryModel.findByIdAndUpdate({ _id: _id }, req.body, {
        new: true,
        runValidators: true,
      });

      res.send(data);
    } catch (err) {
      console.log(err);
      res.status(400).send({ message: 'Error' });
    }
  }
  if (field === 'subcategory') {
    try {
      const { name, category, _id, image, sizeurl } = req.body;

      const data = await SubCategoryModel.findByIdAndUpdate({ _id: _id }, req.body, {
        new: true,
        runValidators: true,
      });

      res.send(data);
    } catch (err) {
      console.log(err);
      res.status(400).send({ message: 'Error' });
    }
  }
  if (field === 'product') {
    try {
      const { _id } = req.body;

      const data = await ProductModel.findByIdAndUpdate({ _id: _id }, req.body, {
        new: true,
        runValidators: true,
      });

      res.send(data);
    } catch (err) {
      console.log(err);
      res.status(400).send({ message: 'Error' });
    }
  }
});
app.delete('/admin/delete/:field', async (req, res) => {
  const { field } = req.params;
  if (field === 'category') {
    try {
      const { _id } = req.body;

      const data = await CategoryModel.findByIdAndDelete(_id);
      res.send(data);
    } catch (err) {
      console.log(err);
      res.status(400).send({ message: 'Error' });
    }
  }
  if (field === 'subcategory') {
    try {
      const { _id } = req.body;

      const subcategory = await SubCategoryModel.findByIdAndDelete(_id);
      const category = await CategoryModel.findById(product.sub);
      if (category) {
        await category.updateOne({ $pull: { subcategories: subcategory._id } });
      }
      res.send(data);
    } catch (err) {
      console.log(err);
      res.status(400).send({ message: 'Error' });
    }
  }
  if (field === 'product') {
    try {
      const { _id } = req.body;

      const product = await ProductModel.findByIdAndDelete(_id);
      res.status(400).send({ message: 'Error' });
      const subcategory = await SubCategoryModel.findById(product.subcategory);
      if (subcategory) {
        await subcategory.updateOne({ $pull: { products: product._id } });
      }
      res.send({ message: 'Product deleted successfully' });
    } catch (err) {
      console.log(err);
    }
  }
});
app.get('/banner', async (req, res) => {
  try {
    const startTime = Date.now();
    
    const data = await getBannerCache('banner_data', 1000 * 60 * 60 * 72, async () => {
      return await BannerModel.find().select('title image').lean();
    });
    
    const endTime = Date.now();
    console.log(`Banner query completed in ${endTime - startTime}ms`);
    
    res.set('Cache-Control', 'public, max-age=259200'); // 72 hours cache (72 * 60 * 60 = 259200 seconds)
    res.send(data);
  } catch (err) {
    console.error('Error in banner endpoint:', err);
    res.status(400).send({ message: 'Error Fetching Banners' });
  }
});
app.post('/banner/create', async (req, res) => {
  try {
    const { name, image } = req.body;
    const data = await BannerModel.create({ title: name, image: image });
    // Clear banner cache when new banner is created
    bannerCache.delete('banner_data');
    res.send({ message: 'Banner Created' });
  } catch (err) {
    res.status(400).send({ message: 'Error Creating Banner' });
  }
});
app.delete('/banner/delete', async (req, res) => {
  try {
    const { id } = req.body;
    const data = await BannerModel.deleteOne({ _id: id });
    // Clear banner cache when banner is deleted
    bannerCache.delete('banner_data');
    res.status(201).send(data);
  } catch (err) {
    res.status(400).send({ message: 'Error Creating Banner' });
  }
});
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    const otp = Math.floor(1000 + Math.random() * 9000); // Generate 4-digit OTP
    await OtpModel.create({ email, otp });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      html: `<h1>Welcome to Stile Sagio</h1><h2>Your OTP Code</h2><p><strong>${otp}</strong></p><p>This OTP is valid for 5 minutes.</p>
        <p style="color: blue;"><strong>Best Regards Stile Sagio Team.</strong></p>
        `,
    });
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: 'Error Sending OTP' });
  }
});

// **Step 4: Verify OTP**
app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
  const storedOtp = await OtpModel.findOne({ email: email })
    .sort({ createdAt: -1 }) // Sort by newest first
    .exec();
  if (!storedOtp) {
    return res.status(400).json({ message: 'OTP expired or not found' });
  }
  if (storedOtp.otp != parseInt(otp)) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  OtpModel.deleteOne({ email: email }); // Remove OTP after successful verification
  res.status(200).json({ message: 'OTP verified successfully' });
  // Generate JWT Token for authentication (optional)
  // const token = jwt.sign({ email }, SECRET);
  //  const user = await UserModel.findOne({email:email});
  //  if(user){
  //     res.json({message:"User Found",token:token,user:user});
  //  }
  //  else{
  //      await UserModel.create({email:email});
  // res.status(200).json({ message: "OTP verified successfully", token });
  //  }
});

app.get('/products/:category', categoryRequest);
app.get('/products', productRequest);
app.get('/items/:itemName', deleteRequest);
app.get('/product/:name', uniqueProductRequest);
app.get('/api/cart', userAuth, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, SECRET);
  try {
    const user = await UserModel.findOne({ _id: decoded.id }).populate({ path: 'cart' });
    res.send({ message: user });
  } catch {
    res.status(500).send({ message: 'Error Occured' });
  }
});

// Performance stats endpoint
app.get('/performance', (req, res) => {
  const stats = getPerformanceStats();
  res.json(stats);
});

// Cache management endpoints
app.get('/cache/stats', (req, res) => {
  try {
    const stats = getCacheStats();
    res.json({
      success: true,
      message: 'Cache statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving cache statistics'
    });
  }
});

app.post('/cache/clear', (req, res) => {
  try {
    const { key } = req.body;
    clearCache(key);
    res.json({
      success: true,
      message: key ? `Cache cleared for key: ${key}` : 'All cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cache'
    });
  }
});

app.delete('/cache/clear', (req, res) => {
  try {
    const { key } = req.query;
    clearCache(key);
    res.json({
      success: true,
      message: key ? `Cache cleared for key: ${key}` : 'All cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cache'
    });
  }
});

// Specific endpoint to clear banner cache
app.post('/cache/clear-banner', (req, res) => {
  try {
    bannerCache.delete('banner_data');
    res.json({
      success: true,
      message: 'Banner cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing banner cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing banner cache'
    });
  }
});

// Update the health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development'
    }
  };
  
  res.json(health);
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectTODB();
    
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Compression: Enabled`);
      console.log(`CORS: Enabled`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
