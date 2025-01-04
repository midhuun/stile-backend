const mongoose = require('mongoose');
const validator = require('validator');
const {Order} = require('./OrderModel');
const UserSchema = new mongoose.Schema({
    phone:{
         type:String,
         required:true,
         unique:true,
         index:true,
         validate:(val)=>{
            if(!validator.isMobilePhone(val,'en-IN')){
                throw new Error('Invalid Phone Number')
            }
         }
    },
    email: {
        type: String,
    },
    orders:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Order"
    }
    ],
    cart:[{
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }, 
        quantity: { type: Number, required: true, min: 1 },
        selectedAttributes: { type: Map, of: String }, 
        totalPrice: { type: Number }
    }]
})

 const UserModel = mongoose.model("User",UserSchema);
 module.exports = {UserModel};