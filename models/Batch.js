import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
    batchName: { type: String, required: true, unique: true },
    students: [
        {
            id:{type:String,required:true,unique: true },
            name:{type:String,required:true},
            email:{type:String,required:true,unique: true },
            department:{type:String,required:true}
        }
    ]
});

export default mongoose.model("Batch", batchSchema);