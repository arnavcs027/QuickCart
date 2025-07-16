import mongoose from "mongoose";

let cached = global.mongoose

if (!cached){
    cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {

    if(cached.conn) {
        return cached.conn
    }

    if(!cached.promise) {
        const opts = {
            bufferCommands:false
        }

        console.log("🚨 Loaded MongoDB URI:", process.env.MONGODB_URI);

        cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
            console.log(" ✅ Connected to MongoDB");
            return mongoose
        })
    }
    
    cached.conn = await cached.promise
    return cached.conn

}

export default connectDB