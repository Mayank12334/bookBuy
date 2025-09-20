const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const multer = require("multer")
const fs = require("fs")

const app = express()
app.use(express.json())
app.use(cors())

app.listen(9000,(req,res)=>{
    console.log('server start')
})

//mongoose connection
mongoose.connect("mongodb+srv://mayank28062005_db_user:n2xoKhgvrxBIq6zQ@cluster0.y98eeey.mongodb.net/boimela")
.then(()=>{
    console.log("mongo connect")
})

//multer
let picname
const mystorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/uploads");
    },
    filename: (req, file, cb)=>{
        picname = Date.now() + file.originalname;
        cb(null, picname);
    },
});
const upload = multer({storage: mystorage});

//register or signup Page
const registerSchema = mongoose.Schema({
    first:String,
    last:String,
    email:String,
    password:String,
    utype:String
})

const registerModel= mongoose.model("registerpage",registerSchema,"registerpage")

app.post("/sign",async(req,res)=>{
    const result = new registerModel({
        first:req.body.first,
        last:req.body.last,
        email:req.body.email,
        password:req.body.password,
        utype:"user"
    })

    const data=result.save();

    if(!data){
        res.send({statuscode:0})
    }
    else{
        res.send({statuscode:1})
    }
})

// login
app.post('/login',async(req,res)=>{
    const result = await registerModel.findOne({email:req.body.email})
    

    if(result.password===req.body.password){
       if(result.utype === "user"){
        res.send({statuscode:1, utype:"user", memberdata:result})
       }
       else{
        res.send({statuscode:1, utype:"admin", memberdata:result})
       }
    }
    else{
        res.send({statuscode:0})
    }
})

//Add category
const categorySchema = mongoose.Schema({
    image:String,
    name:String,
})

const categoryModel= mongoose.model("categorypage",categorySchema,"categorypage")

app.post("/category",upload.single("image"),async(req,res)=>{
    const result = new categoryModel({
        name: req.body.name,
        image: picname,
    })
    const data = result.save()
    if(!data){
        res.send({statuscode:0})
    }
    else{
        res.send({statuscode:1})
    }
})

// showcategory
app.get("/showcategory",async(req,res)=>{
    const result = await categoryModel.find()

    if(!result){
        res.send({statuscode:0})
    }
    else{
        res.send({statuscode:1, data:result})
    }
})

//Add Product
const ProductSchema = mongoose.Schema({
    image:String,
    name:String,
    price:String,
    catid:String,
})

const ProductModel= mongoose.model("Productpage",ProductSchema,"Productpage")

app.post("/addproduct",upload.single("image"),async(req,res)=>{
    const result = new ProductModel({
        name: req.body.name,
        image: picname,
        price: req.body.price,
        catid: req.body.catid,
    })
    const data = result.save()
    if(!data){
        res.send({statuscode:0})
    }
    else{
        res.send({statuscode:1})
    }
})

//Show product
app.get("/product/:id",async(req,res)=>{
    const result = await ProductModel.find({catid:req.params.id})

    if(!result){
        res.send({statuscode:0})
    }
    else{
        res.send({statuscode:1, data:result})
    }
})

//Show All Products
app.get("/allproduct",async(req,res)=>{
    const result = await ProductModel.find()

    if(!result){
        res.send({statuscode:0})
    }
    else{
        res.send({statuscode:1, data:result})
    }
})

//product to details page
app.get("/details/:id",async(req,res)=>{
    const result = await ProductModel.findOne({_id:req.params.id})
    if(result){
        res.send({statuscode:1, pd:result})
    }else{
        res.send({statuscode:0})
    }
})

//details page data to backend
const detailsSchema = mongoose.Schema({
    p:String,
    n:String,
    pic:String,
    id: String,
  uname: String
})

const detailsModel= mongoose.model("Detail",detailsSchema,"Deatil")

app.post("/addDetails",upload.single("pic"),async(req,res)=>{
    try{
        const requiredFields = ['n', 'p', 'pic', 'id', 'uname'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
            statuscode: 0,
            message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const cartItem = new detailsModel({
        p: req.body.p,
        n: req.body.n,
        pic: req.body.pic,
        id: req.body.id,
        uname: req.body.uname
    })

    const savedItem =await cartItem.save();

    if(!savedItem){
         return res.status(500).json({
        statuscode: 0,
        message: "Failed to save cart item"
      });
    }

    res.json({
      statuscode: 1,
      message: "Item added to cart successfully",
      data: savedItem
    });

}catch (error) {
    console.error("Error in /addtocart:", error);
    res.status(500).json({
      statuscode: 0,
      message: "Internal server error",
      error: error.message
    });
}
});

//fetch data in cart (filtered by user email)
// app.get('/cart',async(req,res)=>{
//     const result = await detailsModel.find()
//     if(result){
//         res.send({statuscode:1,ca:result})
//     }else{
//         res.send({statuscode:0})
//     }
// })

app.get("/cart", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send({ statuscode: 0, message: "Email parameter is required" });
    }

    const result = await detailsModel.find({ uname: String(email) });

    if (!result || result.length === 0) {
      return res.send({ statuscode: 1, data: [], message: "Cart is empty" });
    }

    res.send({ statuscode: 1, data: result });
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).send({ statuscode: 0, message: "Internal server error" });
  }
});

//delete category
app.delete("/delcat/:id",async(req,res)=>{
    const result=await categoryModel.findOneAndDelete({_id:req.params.id})
    if (!result){
        res.send({statuscode:0})

    }
    else{
        res.send({statuscode:1 , data:result})
    }
});

//update category
app.put("/updatecat",upload.single("image"),async(req,res)=>{

    if(!req.file){
        picname=req.body.oldpic
    }
    fs.unlink("./public/uploads"+req.body.oldpic,(err)=>{
        if(!err){
            console.log("data delete")
        }else{
            console.log("not delete")
        }
    })

    const result = await categoryModel.updateOne({_id:req.body.id},{$set:{name:req.body.name,image:picname}});

    if(result){
        res.send({statuscode:1})
    }else{
        res.send({statuscode:0})
    }

})

//delete Product
app.delete("/delprod/:id",async(req,res)=>{
    const result=await ProductModel.findOneAndDelete({_id:req.params.id})
    if (!result){
        res.send({statuscode:0})

    }
    else{
        res.send({statuscode:1 , data:result})
    }
});

//update Product
app.put("/updateprod",upload.single("image"),async(req,res)=>{

    if(!req.file){
        picname=req.body.oldpic
    }
    fs.unlink("./public/uploads"+req.body.oldpic,(err)=>{
        if(!err){
            console.log("data delete")
        }else{
            console.log("not delete")
        }
    })

    const result = await ProductModel.updateOne({_id:req.body.id},{$set:{name:req.body.name,image:picname,catid:req.body.catid,price:req.body.price}});

    if(result){
        res.send({statuscode:1})
    }else{
        res.send({statuscode:0})
    }

})

//Payment Componenet
const paymentschema = mongoose.Schema({
  paymentMethod: String,
  cardDetails: {
    cardNumber: String,
    expiryDate: String,
    cvv: String,
    nameOnCard: String
  },
  paypalEmail: String,
  bankDetails: {
    accountNumber: String,
    routingNumber: String,
    accountName: String
  },
  totalAmount: Number
}, { versionKey: false });

const paymentmodel = mongoose.model('payment', paymentschema, 'payment');

// POST: Save payment
app.post('/submitpayment', async (req, res) => {
  const result = new paymentmodel({
    paymentMethod: req.body.paymentMethod,
    cardDetails: req.body.cardDetails,
    paypalEmail: req.body.paypalEmail,
    bankDetails: req.body.bankDetails,
    totalAmount: req.body.totalAmount
  });

  const data = await result.save();
  if (!data) {
    res.send({ statuscode: 0 });
  } else {
    res.send({ statuscode: 1 });
  }
});

// GET: Show all payments
app.get('/showpayments', async (req, res) => {
  const result = await paymentmodel.find();
  if (result) {
    res.send({ statuscode: 1, data: result });
  } else {
    res.send({ statuscode: 0 });
  }
});

//delete Cart Item
app.delete("/delcart/:id",async(req,res)=>{
    const result=await detailsModel.findOneAndDelete({_id:req.params.id})
    if (!result){
        res.send({statuscode:0})

    }
    else{
        res.send({statuscode:1 , data:result})
    }
});