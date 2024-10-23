const mongoose=require("mongoose")
const schema=mongoose.Schema({
    "imaget":{type:String,required:true},
    "item":{type:String,required:true},
    "tip":{type:String,required:true}
})

let tipmodel=mongoose.model("storagetip",schema);
module.exports={tipmodel}