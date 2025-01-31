import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
    batchName: { type: String, required: true, unique: true },
    students: [
        {
            email:{type:String,required:true},
            name:{type:String,required:true},
            id:{type:String,required:true},
            department:{type:String,required:true}
        }
    ]
});

export default mongoose.model("Batch", batchSchema);