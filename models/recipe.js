const mongoose=require("mongoose")
const schema=mongoose.Schema({
    "imager":{type:String,required:true},
    "incredientsr":{type:String,required:true},
    "titler":{type:String,required:true},
    "descriptionr":{type:String,required:true},
    "typer":{type:String,required:true}
})

let recipemodel=mongoose.model("recipeagri",schema);
module.exports={recipemodel}