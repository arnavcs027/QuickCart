import connectDB from "@/config/db";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


export async function GET(request) {
    
    try {
        
        const { userId } = await getAuth(request);
        console.log("Clerk userId: ", JSON.stringify(userId));

        if (!userId) {
            return NextResponse.json({ success: false, message: "No userId from Clerk" });
        }

        await connectDB()
        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return NextResponse.json({ success: false, message: "User Not Found" })
        }

        return NextResponse.json({success:true, user})

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message })  
    }
}