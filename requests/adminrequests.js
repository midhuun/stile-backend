const {ProductModel,SubCategoryModel,CategoryModel} = require('../model/ProductModel');
const generateSlug = require('../utils/generateSlug');
const adminRequest = async(req,res)=>{
    console.log(req.body);
    const params = req.params;
    const {name} = req.body
    const slug = generateSlug(name);
    try{
    if(params.field ==='category'){
      console.log(req.body);
      const category = await new CategoryModel({...req.body,slug});
      await category.save();
      res.send({message:"Category Created"});
    }
    else if(params.field ==='product'){
        const product = await new ProductModel({...req.body,slug});
        await product.save();
        res.send({message:"Product Added Succesfully"});
    }
    else if(params.field ==='subCategory'){
        const subCategory = await new SubCategoryModel({...req.body,slug});
        await subCategory.save();
        res.send({message:"SubCategory added Accessfully"});
    }
}
catch(err){
    console.log(err)
    res.status(400).send({message:"Error creating Categories  "+  err.message});
}
}
module.exports= {adminRequest};