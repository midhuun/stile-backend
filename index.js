const express = require("express");
const app = express();
const cors = require('cors')
const env = require("dotenv");
const {connectTODB}  = require('./config/database');
const {ProductModel,SubCategoryModel,CategoryModel} = require('./model/ProductModel');
const jwt = require('jsonwebtoken')
const cookieParser = require("cookie-parser");
const {updateUser,loginUser} = require('./requests/userRequests');
const {productRequest,uniqueProductRequest,categoryRequest} = require('./requests/ProductRequest');
const {adminRequest} = require('./requests/adminrequests');
const { deleteRequest } = require("./requests/deleteRequest");
const { UserModel } = require("./model/UserModel");
const { userAuth } = require("./middleware/userlogin");

env.config();
const allowedOrigins = [
    'http://localhost:5173',
    'https://admin-stile-12333.vercel.app/',
    'http://another-allowed-origin.com'
  ];
  
  app.use(cors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        // Allow requests with no origin (e.g., mobile apps, Postman)
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true
  }));
  
app.use(cookieParser());
app.use(express.json());


const port = process.env.PORT || 3000;
const SECRET = process.env.SECRET || '12@dmrwejfwf3rnwnrm';


app.post("/user/login",loginUser);


app.get("/",(req,res)=>{
    res.send("Nodejs Running    ")
})


app.post("/delete/:field");

app.patch("/user/update",updateUser);

app.post("/admin/create/:field",adminRequest);

app.patch("/admin/update/:field",async(req,res)=>{
    const {field} = req.params;
    if (field === 'category'){
        try{
        const {name,imageURl,_id,startingPrice} = req.body;
        const data = await CategoryModel.findByIdAndUpdate({_id:_id},{name:name,image:imageURl,startingPrice:startingPrice},{ new: true, runValidators: true })
        console.log(data)
        res.send(data);
        }
        catch(err){
            console.log(err);
        }
    }
    if (field === 'subcategory'){
        try{
        const {name,imageURl,_id,} = req.body;
        const data = await CategoryModel.findByIdAndUpdate({_id:_id},req.body,{ new: true, runValidators: true })
        console.log(data)
        res.send(data);
        }
        catch(err){
            console.log(err);
        }
    }
    if (field === 'product'){
        try{
        const {_id} = req.body;
        const data = await CategoryModel.findByIdAndUpdate({_id:_id},req.body,{ new: true, runValidators: true })
        console.log(data)
        res.send(data);
        }
        catch(err){
            console.log(err);
        }
    }
})
app.delete("/admin/delete/:field", async(req,res)=>{
    const {field} = req.params;
    if (field === 'category'){
        try{
            const {_id} = req.body;
            console.log(req.body)
            const data = await CategoryModel.findByIdAndDelete(_id);
            res.send(data);
        }
        catch(err){
            console.log(err);
        }
    }
    if (field === 'subcategory'){
        try{
            const {_id} = req.body;
            console.log(req.body)
            const data = await SubCategoryModel.findByIdAndDelete(_id);
            res.send(data);
        }
        catch(err){
            console.log(err);
        }
    }
    if (field === 'product'){
        try{
            const {_id} = req.body;
            console.log(req.body)
            const data = await ProductModel.findByIdAndDelete(_id);
            res.send(data);
        }
        catch(err){
            console.log(err);
        }
    }
})
app.get("/category/:name",async(req,res)=>{
    const name = req.params.name;
    try{
       const category =await CategoryModel.findOne({slug:name}).populate({path:'subcategories',populate:{path:'products',model:'Product'}});
       const products = await ProductModel.find({category:category._id})
       res.send({category:category,products:products})
    }
    catch(err){
        res.status(400).send({message:"Error Finding Category"})
    }
})
app.get("/products/:category",categoryRequest)
app.get("/products",productRequest);
app.get("/items/:itemName",deleteRequest);
app.get("/product/:name",uniqueProductRequest);
app.get("/api/cart",userAuth, async(req,res)=>{
    const {token} = req.cookies;
    const decoded = jwt.verify(token,SECRET);
    try{
      const user = await UserModel.findOne({_id:decoded.id}).populate({path:"cart"});
      res.send({message:user})
    }
    catch{
        res.status(500).send({message:"Error Occured"})
    }
})
app.post("/addToCart",userAuth,async(req,res)=>{
    const {token} = req.cookies;
    const {product} = req.body;
    const decoded = jwt.verify(token,SECRET);

    try{
        const user = await UserModel.findOne({_id:decoded.id});
        console.log("user",user);
        // const existingItem = user.cart.find((item)=>item._id === product._id);
        // if(existingItem){
        //     res.send({message:"Item Already Exists In Cart"})
        // }
        // else{
        //     user.cart.push({...product,quantity:1});
        //     await user.save();
        //     res.send({message:"Item Added"})
        // }
      }
      catch(err){
        console.log(err)
          res.status(500).send({message:"Error Occured"})

      }
})
app.post("/login",async (req,res)=>{
    const {phone,password} = req.body;
    const user = await UserModel.findOne({phone:phone});
    console.log(phone)
    if(!user){
        const newUser = await UserModel.create({phone:phone});
        console.log(newUser);
        const token = jwt.sign({id:newUser._id},SECRET);
        res.cookie('token',token);
        console.log(newUser);
        res.send({message:"User Created",token:token})
    }
    else{
        const user = await UserModel.find({phone:phone});
        console.log(user);
        const token = jwt.sign({id:user._id},SECRET);
        res.cookie('token',token);
        res.send({message:"User Found",token:token})
    }
})
// app.get("/api/cart",userAuth, async(req,res)=>{
//     const {token} = req.cookies;
//     const decoded = jwt.verify(token,SECRET);
//     try{
//       const user = await UserModel.find({_id:decoded.id})
//       res.send({message:user.cart})
//     }
//     catch{
//         res.status(500).send({message:"Error Occured"})
//     }
// })
// app.post("/api/addToCart",userAuth,async(req,res)=>{
//     const {token} = req.cookies;
//     const item = req.item;
//     const decoded = jwt.verify(token,SECRET);
//     try{
//         const user = await UserModel.find({_id:decoded.id});
        
//         res.json({message:user})
//     }
//     catch(err){
//         console.log(err)
//     }
// })
app.get("/logout",(req,res)=>{
    try{
    console.log("cookie",req.cookies)
    res.clearCookie('token', { path: '/', domain: 'localhost' });
    res.cookie("token","",{httpOnly:true,secure:false});
    res.status(200).send({message:"Logged out Successfully"})
    }
    catch(err){
        res.status(404).send("Error logging out")
    }
})
app.post("/api/addToCart",async(req,res)=>{
    const cart = req.body;
    console.log(cart);
    const {token} = req.cookies;
    const decoded = jwt.verify(token,SECRET);
    try{ 
        await UserModel.updateOne({_id:decoded.id},{cart:cart});
        
        res.send({message:"Item Added to Cart"})
    }
    catch(err){
        res.send("Error adding to cart");
    }
})
connectTODB().then(()=>{
    console.log("DB connected successfully")
    app.listen(port,()=>{
        console.log("Server listening");
    })
}).catch((err)=>console.log("MongoErro" ,err))
