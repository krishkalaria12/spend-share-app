import { connect } from "@/lib/db";
import { Friendship } from "@/models/friendship.models";
import User from "@/models/user.models";
import { useAuth } from "@clerk/clerk-expo";
import mongoose from "mongoose";
import { createError } from "@/utils/createError";
import { createResponse } from "@/utils/ApiResponse";

export async function POST(request: Request): Promise<Response> {
    await connect();

    try {
        const { userId, has } = useAuth();

        if (!userId || !has) {
            throw createError("Unauthorized", 401, false);
        }

        const { requestId } = await request.json();

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
