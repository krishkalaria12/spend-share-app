import { connect } from "@/lib/db";
import { Friendship } from "@/models/friendship.models";
import User from "@/models/user.models";
import mongoose from "mongoose";
import { createError } from "@/utils/createError";
import { createResponse } from "@/utils/ApiResponse";

export async function POST(request: Request): Promise<Response> {
    await connect();

    try {
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];

        if (!sessionToken) {
            throw createError("Unauthorized", 401, false);
        }

        const url = new URL(request.url);
        const clerkId= url.searchParams.get('userId');
        const requestId = url.searchParams.get('requestId');

        if (!clerkId) {
            throw createError("User ID is required", 400, false);
        }

        const user = await User.findOne({ clerkId: clerkId });

        if (!user) {
            throw createError("User not found", 404, false);
        }

        const userId = user?._id;

        if (!requestId || !mongoose.isValidObjectId(requestId)) {
            throw createError("Invalid request ID", 400, false);
        }

        const friendRequest = await Friendship.findOne({
            user: requestId,
            friend: userId
        });

        if (!friendRequest || friendRequest.status !== 'pending') {
            throw createError("Friend request not found or already processed", 404, false);
        }

        if (!friendRequest.friend.equals(userId)) {
            throw createError("Unauthorized to accept this request", 401, false);
        }

        friendRequest.status = 'fulfilled';
        await friendRequest.save();

        await User.findByIdAndUpdate(friendRequest.user, { $addToSet: { friends: friendRequest.friend } });
        await User.findByIdAndUpdate(friendRequest.friend, { $addToSet: { friends: friendRequest.user } });

        return Response.json(createResponse("Friend request accepted successfully", 200, true, friendRequest));
    } catch (error) {
        console.error("Error while accepting friend request:", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}
