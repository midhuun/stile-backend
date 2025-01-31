const express = require("express");
const app = express();
const cors = require('cors')
const env = require("dotenv");
const {connectTODB}  = require('./config/database');
const {ProductModel,SubCategoryModel,CategoryModel} = require('./model/ProductModel');
const jwt = require('jsonwebtoken')
const cookieParser = require("cookie-parser");
const {updateUser,loginUser, logoutUser, getUser} = require('./requests/userRequests');
const {productRequest,uniqueProductRequest,categoryRequest} = require('./requests/ProductRequest');
const {adminRequest} = require('./requests/adminrequests');
const { deleteRequest } = require("./requests/deleteRequest");
const { UserModel } = require("./model/UserModel");
const { userAuth } = require("./middleware/userlogin");
const { BannerModel } = require("./model/BannerModel");
const {OrderModel} = require("./model/OrderModel");
const {Cashfree} = require("cashfree-pg");
env.config();
app.use(cors({origin:['http://localhost:5173','https://www.stilesagio.com','https://admin-stile-12333.vercel.app','https://stile-backend.vercel.app','https://stile-12333.vercel.app','https://stile-frontend-9jne.vercel.app'],credentials:true}));
app.use(cookieParser()); 
app.use(express.json());
const clientID = process.env.X_CLIENT_ID;
const clientSecret = process.env.X_CLIENT_SECRET;
const port = process.env.PORT || 3000;
const SECRET = process.env.SECRET || '12@dmrwejfwf3rnwnrm';
Cashfree.XClientId = clientID;
Cashfree.XClientSecret =clientSecret;
Cashfree.XEnvironment = Cashfree.Environment.TEST;
app.get("/user", getUser)
app.post("/user/login",loginUser);
app.post("/user/logout",logoutUser);
app.get("/",(req,res)=>{
    res.send("Nodejs Running")
})

// Cart API
app.post('/user/addToCart',userAuth,async(req,res)=>{
    try{
        const {token} = req.cookies;
        const product = req.body.productdata;
        const decoded = jwt.verify(token,SECRET);
        const user = await UserModel.findOne({_id:decoded.id});
        const cartItem = user.cart.find((item)=>item.product.toString().includes(product._id) && item.selectedSize === req.body.selectedSize);
     
        if(cartItem){
            cartItem.quantity += 1;
        }
        else{
            user.cart.push({product:product._id,quantity:1,selectedSize:req.body.selectedSize});
        }        
        await user.save();
        res.status(201).send({message:"Item Added to Cart"});

        
    }
    catch(err){
        console.log(err);
    }
})
app.get('/user/favourites',userAuth,async(req,res)=>{
    try{
        const {token} = req.cookies;
        const decoded = jwt.verify(token,SECRET);
        const user = await UserModel.findOne({_id:decoded.id}).populate({path:"favourites"});
      
        res.send({favourites:user.favourites});
    }
    catch(err){
        console.log(err);
    }
})
app.post('/user/addToFavourites',userAuth,async(req,res)=>{
    try{
        const {token} = req.cookies;
       
        const {id} = req.body;
        const decoded = jwt.verify(token,SECRET);
        const user = await UserModel.findOne({_id:decoded.id});
        const favItem = user.favourites.find((item)=>item.toString().includes(id));
        if(favItem){
            res.send({message:"Item Already Exists in Favourites"});
            }
            else{
                user.favourites.push(id);
            }   
        await user.save();
        res.status(201).send({message:"Item Added to Favourites"});
    }
    catch(err){
        console.log(err);
    }
})

app.post('/user/removeFromFavourites',userAuth,async(req,res)=>{
    try{
        const {token} = req.cookies;
        const {productId} = req.body;
        const decoded = jwt.verify(token,SECRET);
        const user = await UserModel.findOne({_id:decoded.id});
        user.favourites.pull(productId);
        await user.save();
        res.status(201).send({message:"Item Removed from Favourites"});
    }
    catch(err){
        console.log(err);
    }
});
app.post('/user/removeFromCart',userAuth,async(req,res)=>{
    try{
        const {token} = req.cookies;
        const product = req.body.productdata;
        const decoded = jwt.verify(token,SECRET);
        const user = await UserModel.findOne({_id:decoded.id});
        const cartItem = user.cart.find((item)=>item.product.toString().includes(product._id) && item.selectedSize === req.body.selectedSize);
    
        if(cartItem){
            if(cartItem.quantity === 1 ){
                user.cart.pull({product:product._id,selectedSize:req.body.selectedSize});
            }
            else{
            cartItem.quantity -= 1;
            }
        }
        else{
            res.status(400).send({message:"Item not found in cart"});
        }        
        await user.save();
        res.status(201).send({message:"Item Deleted from the Cart"});

        
    }
    catch(err){
        console.log(err);
    }
});
app.delete('/user/clearCart',userAuth,async(req,res)=>{
    try{
        const {token} = req.cookies;
        const decoded = jwt.verify(token,SECRET);
        const user = await UserModel.findOne({_id:decoded.id});
        user.cart = [];
       await user.save();
       res.status(204).send({message:"Cleared"})
    }
    catch(err){
        console.log(err);
        res.status(400).send({message:err})
    }
});
app.post('/user/deleteFromCart',userAuth,async(req,res)=>{
    try{
        const {token} = req.cookies;
        const productdata = req.body.productdata;
        const decoded = jwt.verify(token,SECRET);
        const user = await UserModel.findOne({_id:decoded.id})
        user.cart.pull({product:productdata,selectedSize:req.body.selectedSize}) 
    
       await user.save();
       res.status(204).send({message:"Deleted"})
    }
    catch(err){
        console.log(err);
    }
});
app.get("/user/cart",userAuth,async(req,res)=>{
    try{
        const {token} = req.cookies;
        const decoded = jwt.verify(token,SECRET);
        const user = await UserModel.findOne({_id:decoded.id}).populate({path:"cart.product"});
        res.send({cart:user.cart});
    }
    catch(err){
        console.log(err);
    }
})
app.patch("/user/update",updateUser);
app.get("/user/orders",userAuth,async(req,res)=>{
    try{
         const {token} = req.cookies;
         const decoded = jwt.verify(token,SECRET);
         console.log(decoded);
        const userWithOrders = await UserModel.findOne({ _id: decoded.id})
        .populate({
          path: "orders",
          populate: {
            path: "products", 
          },
        });
        console.log("orders",userWithOrders)
        res.json(userWithOrders);
    }
    catch(err){
        console.log(err);
        res.status(400).send({message:"Error Fetching Orders"})
    }
})
app.post("/auth/truecaller/callback",(req,res)=>{
    res.send({message:"Logged in"})
})
app.post("/user/order",userAuth,async(req,res)=>{
    try{
        const {token} = req.cookies;
        const decoded = jwt.verify(token,SECRET);
        const user = await UserModel.findOne({_id:decoded.id});
        const order = new OrderModel({
            user:user._id,
            products:req.body.products,
            totalAmount:req.body.totalAmount,
            orderStatus:"pending",
            paymentMethod:req.body.paymentMethod,
            pincode:req.body.pincode,
            address:req.body.address,
            orderId:req.body.orderId
            });
            await user.orders.push(order)
            await user.save();
            await order.save();
            res.send({message:"Order Placed"});
            }
            catch(err){
                console.log(err);
                res.status(400).send({message:err})
            }
});
app.post("/user/payment",async(req,res)=>{
    const {name,phone,amount} = req.body
    const orderID = `ORDER_${new Date().getTime()}`;
    const customerDetails = {
        customer_name: name,
        customer_phone: phone,
        customer_id:'wfwrofwiwedvlks'
      };
      const payload = {
        order_id: orderID,
        order_amount: amount,
        order_currency: "INR",
        customer_details: customerDetails,
        order_note: "Payment for order",
        return_url:"https://stilesagio.com/payment/status",
        notify_url:"https://stile-backend.vercel.app/payment/status",
        order_meta:{
            return_url:"https://stilesagio.com/checkout",
            notify_url:"https://stile-backend.vercel.app/payment/status",
        },
        order_note:`Payment for order ${orderID}`,
        link_meta: {
            return_url: "https://stilesagio.com/payment/status",
            notify_url: "https://stile-backend.vercel.app/payment/status",
        },
      }
    try{
         const response = await Cashfree.PGCreateOrder("2025-01-01",payload)
          const { payment_session_id: token,order_id } = response.data;
          res.status(200).json({ token, order_id });
    }
   catch(err){
    console.log(err);
    res.status(400).send(err);
   }
    
})
 app.get("/verify/payment/:orderid",(req,res)=>{
    const orderid = req.params.orderid;
    let version = "2023-08-01";
    Cashfree.PGFetchOrder(version, orderid).then((response) => {
       console.log("Verify Status",response.data);
        res.status(200).send({mesage:"Payment done successfully",success:true})
    }).catch((error) => {
        console.error('Error:', error.response.data.message);
        res.status(400).send({message:"Payment failed"})
    });
 })
app.get("/payment/status",(req,res)=>{
    const { order_id, txStatus, txMsg, paymentMode } = req.body;
    console.log("logged");
    console.log(req.body);
})
app.post("/admin/create/:field",adminRequest);

app.patch("/admin/update/:field",async(req,res)=>{
    const {field} = req.params;
    if (field === 'category'){
        try{
        const {name,imageURl,_id,startingPrice} = req.body;
        const data = await CategoryModel.findByIdAndUpdate  ({_id:_id},req.body,{ new: true, runValidators: true })
        console.log(data)
        res.send(data);
        }
        catch(err){
            console.log(err);
            res.status(400).send({message:"Error"})
        }
    }
    if (field === 'subcategory'){
        try{
        const {name,category,_id,image,sizeurl} = req.body;
        console.log(req.body);
        const data = await SubCategoryModel.findByIdAndUpdate({_id:_id},req.body,{ new: true, runValidators: true })
        console.log(data)
        res.send(data);
        }
        catch(err){
            console.log(err);
            res.status(400).send({message:"Error"})
        }
    }
    if (field === 'product'){
        console.log("request");
        try{
        const {_id} = req.body;
        console.log(req.body);
        const data = await ProductModel.findByIdAndUpdate({_id:_id},req.body,{ new: true, runValidators: true })
        console.log(data)
        res.send(data);
        }
        catch(err){
            console.log(err);
            res.status(400).send({message:"Error"})
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
            res.status(400).send({message:"Error"})
        }
    }
    if (field === 'subcategory'){
        try{
            const {_id} = req.body;
            console.log(req.body)
            const subcategory = await SubCategoryModel.findByIdAndDelete(_id);
            // const category = await CategoryModel.findById(product.sub);
            // if (category) {
            //   await category.updateOne({ $pull: { subcategories: subcategory._id } });
            // }
            res.send(data);
        }
        catch(err){
            console.log(err);
            res.status(400).send({message:"Error"})
        }
    }
    if (field === 'product'){
        try{
            const {_id} = req.body;
            console.log(req.body)
            const product = await ProductModel.findByIdAndDelete(_id);
            res.status(400).send({message:"Error"})
            // const subcategory = await SubCategoryModel.findById(product.subcategory);
            // if (subcategory) {
            //   await subcategory.updateOne({ $pull: { products: product._id } });
            // }
            res.send({ message: "Product deleted successfully" });
        }
        catch(err){
            console.log(err);
        }
    }
})
app.get("/category/:name",async(req,res)=>{
    const name = req.params.name;
    console.log(name)
    try{
       const subcategory =await SubCategoryModel.findOne({slug:name}).populate({path:'products',model:'Product'});
       const products = await ProductModel.find({subcategory:subcategory._id})
       res.send({subcategory:subcategory,products:products});
    }
    catch(err){
        res.status(400).send({message:"Error Finding Category"})
    }
})
app.get("/banner",async(req,res)=>{

    try{
        // const createModel = await BannerModel.create({image:"https://thesagio.com/cdn/shop/files/HOME-02.png?v=1726319330&width=1920",title:"Shop Your Amazing Products"});
        // res.send(createModel);
        const data = await BannerModel.find();
        res.send(data);
    }
    catch(err){
        res.status(400).send({message:"Error Fetching Banners"})
    }
})
app.post("/banner/create",async(req,res)=>{
    try{
        const {name,image} = req.body;
        const data = await BannerModel.create({title:name,image:image});
        res.send({message:"Banner Created"});
    }
    catch(err){
        res.status(400).send({message:"Error Creating Banner"})
    }
})
app.delete("/banner/delete",async(req,res)=>{
    try{
        const {id} = req.body;
        const data = await BannerModel.deleteOne({_id:id});
        res.status(201).send(data);
    }
    catch(err){
        res.status(400).send({message:"Error Creating Banner"})
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
connectTODB().then(()=>{
    console.log("DB connected successfully")
    app.listen(port,()=>{
        console.log("Server listening");
    })
}).catch((err)=>console.log("MongoErro" ,err))
