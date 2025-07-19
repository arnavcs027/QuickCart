import connectDB from "@/config/db";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = await getAuth(request);
    console.log("Clerk userId:", userId);

    if (!userId) {
      return NextResponse.json({ success: false, message: "No userId from Clerk" });
    }

    await connectDB();

    // Get Clerk user info
    const clerkRes = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    const clerkUser = await clerkRes.json();

    // Try to find by clerkId or email
    let user = await User.findOne({
      $or: [
        { clerkId: userId },
        { email: clerkUser.email_addresses?.[0]?.email_address }
      ]
    });

    if (!user) {
      const newUser = new User({
        clerkId: clerkUser.id,
        name: `${clerkUser.first_name} ${clerkUser.last_name}`,
        email: clerkUser.email_addresses?.[0]?.email_address || "",
        imageUrl: clerkUser.image_url,
      });

      try {
        user = await newUser.save();
        console.log("New user created:", user);
      } catch (err) {
        // Handle duplicate key error
        if (err.code === 11000) {
          console.warn("Duplicate email found. Fetching existing user...");
          user = await User.findOne({ email: newUser.email });
        } else {
          console.error("Failed to save user:", err);
          return NextResponse.json({ success: false, message: "Error saving user in DB" });
        }
      }
    }

    return NextResponse.json({ success: true, user });

  } catch (error) {
    console.error("Error in user GET:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}