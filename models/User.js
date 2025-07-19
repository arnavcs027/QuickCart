import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    clerkId:{ type : String, required:true, unique: true },
    name: { type : String, required:true },
    email: { type : String, required:true, unique:true },
    imageUrl : { type : String, required:true },
    cartItems: { type: Map, of: Number, default: {} }
}, { minimize: false})

const User = mongoose.models.user || mongoose.model('User', userSchema)

export default User