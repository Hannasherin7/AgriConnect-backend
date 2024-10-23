const mongoose=require("mongoose")
const schema = mongoose.Schema({
    "name":{type:String,required:true},
    "email":{type:String,required:true},
    "phone":{type:String,required:true},
    "gender":{type:String,required:true},
    "password":{type:String,required:true},
    "cpassword":{type:String,required:true}
})
let agrimodel = mongoose.model("agric",schema)
module.exports={agrimodel}