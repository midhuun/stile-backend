const express = require("express");
const jwt = require('jsonwebtoken')
const cors = require('cors');
const env = require("dotenv");
const { UserModel } = require('../model/UserModel');
const app = express();
env.config();
const SECRET = process.env.SECRET || '12@dmrwejfwf3rnwnrm';
app.use(cors({origin:"http://localhost:5173",credentials:true}));
const userAuth = async(req,res,next)=>{
    try{
       const {token} = req.cookies;
       const decoded =jwt.verify(token,SECRET);
       console.log(decoded);
       const user = await UserModel.find({_id:decoded.id});
       if(!user){
        return res.status(401).json({message:"Please login to access this resource"})
       }
       next();
    }
    catch(err){
        res.status(401).send({message:"User not authenticated"});
    }
}
module.exports = {userAuth};