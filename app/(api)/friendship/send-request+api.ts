import { connect } from "@/lib/db";
import { Friendship } from "@/models/friendship.models";
import User from "@/models/user.models";
import { useAuth, useUser } from "@clerk/clerk-expo";
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

        const { user } = useUser();
        const mongoId = user?.publicMetadata.mongoId;

        const { recipientId } = await request.json();

        if (!recipientId || !mongoose.isValidObjectId(recipientId)) {
            throw createError("Invalid request ID", 400, false);
        }
        
        if (!mongoId || !mongoose.isValidObjectId(mongoId)) {
            throw createError("Invalid mongodb ID", 400, false);
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
