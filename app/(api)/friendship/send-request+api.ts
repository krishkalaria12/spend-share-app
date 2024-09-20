import { connect } from "@/lib/db";
import { Friendship } from "@/models/friendship.models";
import mongoose from "mongoose";
import { createError } from "@/utils/createError";
import { createResponse } from "@/utils/ApiResponse";
import User from "@/models/user.models";

export async function POST(request: Request) {
    await connect();

    try {
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];

        if (!sessionToken) {
            throw createError("Unauthorized", 401, false);
        }

        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        if (!userId) {
            throw createError("User ID is required", 400, false);
        }

        const userInfo = await User.findOne({ clerkId: userId });

        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const mongoId = userInfo?._id;

        if (!mongoId || !mongoose.isValidObjectId(mongoId)) {
            throw createError("Invalid mongodb ID", 400, false);
        }

        const { recipientId } = await request.json();

        if (!recipientId || !mongoose.isValidObjectId(recipientId)) {
            throw createError("Invalid request ID", 400, false);
        }

        const existingRequest = await Friendship.findOne({
            user: mongoId,
            friend: recipientId,
            status: 'pending',
        });
        
        if (existingRequest) {
            throw createError("Friend request already sent", 400, false);
        }

        const friendRequest = await Friendship.create({
            user: mongoId,
            friend: recipientId,
        });

        if (!friendRequest) {
            throw createError("Error sending friend request", 500, false);
        }

        return new Response(
            JSON.stringify(createResponse("Friend request sent successfully", 200, true, friendRequest)),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error while sending friend request:", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}
