function deleteRequest(req,res){
    const {itemName} = req.params;
    console.log(req.params)
    const id = req.body;
    console.log(id)
    console.log(itemName);
    if(itemName ==='category'){
  console.log('ca')
    }
    res.status(200).send({message:"deleted"});

}
module.exports= {deleteRequest};