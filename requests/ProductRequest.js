const express = require("express");
const app = express();
const cors = require('cors')
const env = require("dotenv");
const {ProductModel,SubCategoryModel,CategoryModel} = require('../model/ProductModel');
const cookieParser = require("cookie-parser");
env.config();
app.use(cors({origin:['http://localhost:5173','https://www.stilesagio.com','https://stile-backend-gnqp.vercel.app','https://stile-frontend-9jne.vercel.app','https://stile-12333.vercel.app'],credentials:true}));
app.use(cookieParser());
app.use(express.json());
const SECRET = process.env.SECRET || '12@dmrwejfwf3rnwnrm';
const productRequest = async(req,res)=>{
    try{
    const products = await ProductModel.find().populate('category');
    const subCategories = await SubCategoryModel.find().populate('category').populate('products');
    const categories = await CategoryModel.find().populate({path:'subcategories',populate:{path:'products',model:'Product'}});;
            res.status(201).send({products,categories,subCategories});
    }
    catch(err){    
        res.status(400).send("Error fetching products");
    }
}
const uniqueProductRequest = async(req,res)=>{
    const {name} = req.params;
    try{
        const product = await ProductModel.find({slug:name}).populate('subcategory');
        res.send(product);
    }
    catch(err){
        console.log(err);
        res.send("Error")
    }
}
const categoryRequest = async(req,res)=>{
    const {category} = req.params;
    try{
        const Products = await ProductModel.find({category:category})
        res.send(Products);
    }
    catch(err){
        res.send(err)
    }
}
module.exports = {productRequest,uniqueProductRequest,categoryRequest};