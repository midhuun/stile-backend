const express = require('express');
const jwt = require('jsonwebtoken');
const env = require('dotenv');
const { UserModel } = require('../model/UserModel');
const app = express();
env.config();
const SECRET = process.env.SECRET || '12@dmrwejfwf3rnwnrm';

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

const userAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, SECRET);
    const user = await UserModel.find({ _id: decoded.id });
    if (!user) {
      return res.status(401).json({ message: 'Please login to access this resource' });
    }
    next();
  } catch (err) {
    res.status(401).send({ message: 'User not authenticated' });
  }
};
module.exports = { userAuth };
