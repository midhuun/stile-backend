const express = require("express");
const app = express();
const cors = require('cors')
const env = require("dotenv");
const {UserModel} = require('../model/UserModel');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
env.config();
app.use(cors({origin:['http://localhost:5173','https://stile-frontend-9jne.vercel.app','https://stile-12333.vercel.app','https://stile-backend-gnqp.vercel.app'],credentials:true}));
app.use(cookieParser());
app.use(express.json());
const SECRET = process.env.SECRET || '12@dmrwejfwf3rnwnrm';
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
const loginUser = async(req,res)=>{
    try{
    const {phone} = req.body;
    const isuser = await UserModel.findOne({phone});
    if(!isuser){
        const user = await new UserModel({phone});
        await user.save();
        const token = jwt.sign({id:user._id},SECRET);
        res.cookie("token",token);
        console.log(user)
        res.status(200).send({message:"User Created",userexists:false})
    }
    else{
         const token =await jwt.sign({id:isuser._id},SECRET);
         res.cookie("token", token, {
            maxAge: 3 * 24 * 60 * 60 * 1000,
          });
        res.status(200).send({message:"User Exists",userexists:true});
    }
    }
    catch(err){
        console.log(err);
        res.status(400).send(err?.message);
    }
    
}
module.exports ={updateUser,loginUser}