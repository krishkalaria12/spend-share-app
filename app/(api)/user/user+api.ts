import User from "@/models/user.models";
import { connect } from "@/lib/db";
import { createError } from "@/utils/ApiError";
import { createResponse } from "@/utils/ApiResponse";

export async function POST(request: Request){
    await connect();
    
    try {
        const { clerkId, username, email, firstName, lastName, avatar } = await request.json();
        const fullName = `${firstName} ${lastName}`;

        console.log("Received data:", { clerkId, username, email, fullName, avatar });
        // Validate required fields
        if (!clerkId || !username || !email || !fullName || !avatar) {
            throw createError("Missing required fields", 400, false);
        }
        

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ clerkId }, { email }, { username }] });
        if (existingUser) {
            throw createError("User already exists", 409, true);
        }

        // Create new user
        const newUser = await User.create({
            clerkId,
            username,
            email,
            fullName,
            avatar,
            balance: 0,
            friends: [],
            groups: [],
        });

        console.log("New user created:", newUser);

        return new Response(
            JSON.stringify(createResponse("User created successfully", 200, true, newUser)),
            { status: 201 }
        );
    } catch (error) {
        console.error("Error while creating user:", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}