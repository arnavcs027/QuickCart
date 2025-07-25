import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import Order from "@/models/Order";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "quickcart-next" });

// Inngest function to save user data to a database
export const syncUserCreation = inngest.createFunction(
    {
        id:'sync-user-from-clerk'
    },
    { event: 'clerk/user.created'},
    async ({event}) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id:id,
            clerkId: id,
            email: email_addresses[0].email_address,
            name: `${first_name} ${last_name}`,
            imageUrl:image_url
        }
        await connectDB()
        // First, check if a user with that email already exists
        const existingUser = await User.findOne({ email: userData.email });

        if (existingUser) {
            // If user exists with that email, update that entry
            await User.findByIdAndUpdate(existingUser._id, userData);
        } else {
            // Else, safely create new entry with upsert
            await User.findOneAndUpdate(
                { _id: userData._id },
                userData,
                { upsert: true, new: true }
            );
        }
    }
)

// Inngest Function to update user data in database
export const syncUserUpdation = inngest.createFunction(
    {
        id: 'update-user-from-clerk'
    },
    { event: 'clerk/user.updated' },
    async ({event}) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id:id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            imageUrl:image_url
        }
        await connectDB()
        await User.findOneAndUpdate({_id: id },userData)
    }
)

// Inngest Function to delete user from database
export const syncUserDeletion = inngest.createFunction(
    {
        id: 'delete-user-with-clerk'
    },
    { event: 'clerk/user.deleted' },
    async ({event}) => {
        
        const {id } = event.data

        await connectDB()
        await User.findOneAndDelete({_id: id})
    }
)

// Inngest Function to create user's order in database
export const createUserOrder = inngest.createFunction(
    {
        id:'create-user-order',
        batchEvents: {
            maxSize: 5,
            timeout: '5s'
        }
    },
    {event: 'order/created'},
    async ({events}) => {

        const orders = events.map((event)=> {
            return {
                userId: event.data.userId,
                items: event.data.items,
                amount: event.data.amount,
                address: event.data.address,
                date: event.data.date,
                paymentType: event.data.paymentType || "Unknown",
                isPaid: true
            }
        })

        await connectDB()
        await Order.insertMany(orders)

        return { success: true, processed: orders.length };

    }
)