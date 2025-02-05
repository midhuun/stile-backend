const express = require("express");
const app = express();
const cors = require('cors')
const env = require("dotenv");
const {UserModel} = require('../model/UserModel');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
env.config();
app.use(cors({
    origin: [
      "http://localhost:5173",
      "https://www.stilesagio.com",
      "https://stile-frontend-9jne.vercel.app",
      "https://stile-12333.vercel.app",
      "https://admin-stile-12333.vercel.app"
    ],
    credentials: true, // Allow cookies and authentication headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow specific HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Ensure necessary headers are allowed
  }));
  app.use(cookieParser());
app.use(express.json());
const SECRET = process.env.SECRET || '12@dmrwejfwf3rnwnrm';
const getUser = async(req,res)=>{
     try{
           const {token} = req.cookies;
           const decoded =jwt.verify(token,SECRET);
        
           const user = await UserModel.findOne({_id:decoded.id});
           if(!user){
            return res.status(401).send({message:"User not found"});
           }
           else{
                res.status(200).send({message:"User found",user:user});
           }
          
        }
        catch(err){
            res.status(401).send({message:"User not authenticated"});
        }
}
const updateUser = async(req,res)=>{
    try{
    const body = req.body;
    console.log(body)
    const {token} = req.cookies;
  
    const decoded =await jwt.verify(token,SECRET);
    const user = await UserModel.updateOne({_id:decoded.id},req.body,{runValidators:true,new:true})
    res.send({user:user});
    }
    catch(err){
        res.status(401).send({err:err});
    }
}
const logoutUser = async(req,res)=>{
    console.log(req.cookies);
    try{
        res.clearCookie('token');
        res.status(200).send({message:"Logout Successfull"})
    }
        catch(err){
            res.status(401).send({err:err});
        }
}
const loginUser = async(req,res)=>{
    try{
    const {phone} = req.body;
    const isuser = await UserModel.findOne({phone});
    if(!isuser){
        const user = await new UserModel({phone});
        await user.save();
        const token = jwt.sign({id:user._id},SECRET);
        res.cookie("token",token,{secure:true,sameSite:'none'});
        console.log(user)
        res.status(200).send({message:"User Created",userexists:false})
    }
    else{
         const token =await jwt.sign({id:isuser._id},SECRET);
         res.cookie("token", token, {
            maxAge: 3 * 24 * 60 * 60 * 1000,
            secure:true,
            sameSite:'none'
          });
        res.status(200).send({message:"User Exists",userexists:true});
    }
    }
    catch(err){
        console.log(err);
        res.status(400).send(err?.message);
    }
    
}
module.exports ={updateUser,loginUser,logoutUser,getUser}