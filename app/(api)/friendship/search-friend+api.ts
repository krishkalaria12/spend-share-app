import { connect } from "@/lib/db";
import User from "@/models/user.models";
import { Friendship } from "@/models/friendship.models";
import { createError } from "@/utils/ApiError";
import { createResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";

export async function GET(request: Request) {
    await connect();

    try {
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];
        
        if (!sessionToken) {
            throw createError("Unauthorized", 401, false);
        }
        
        const url = new URL(request.url);
        const clerkId = url.searchParams.get('userId');
        const query = url.searchParams.get("query");

        if (!clerkId) {
            throw createError("User ID is required", 400, false);
        }

        const userInfo = await User.findOne({ clerkId: clerkId });
        console.log(userInfo);
        
        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const userId = userInfo?._id;

        if (!userId || !mongoose.isValidObjectId(userId)) {
            throw createError("Invalid mongodb ID", 400, false);
        }

        // Get the user's friends and pending requests
        const friendIds = await Friendship.aggregate([
        {
            $match: {
            $or: [
                { user: new mongoose.Types.ObjectId(userId) },
                { friend: new mongoose.Types.ObjectId(userId) }
            ]
            }
        },
        {
            $project: {
            friend: {
                $cond: {
                if: { $eq: ["$user", new mongoose.Types.ObjectId(userId)] },
                then: "$friend",
                else: "$user"
                }
            }
            }
        }
        ]);

        const excludedUserIds = friendIds.map(friendship => friendship.friend);

        const pipeline: any[] = [];

        pipeline.push({
        $search: {
            index: "search-friends",
            text: {
            query: query,
            path: ["username", "fullName", "email"]
            }
        }
        });

        pipeline.push({
        $match: {
            _id: { $nin: [...excludedUserIds, new mongoose.Types.ObjectId(userId)] }
        }
        });

        pipeline.push({
        $project: {
            _id: 1,
            username: 1,
            email: 1,
            fullName: 1,
            avatar: 1
        }
        });

        const friends = await User.aggregate(pipeline);

        return new Response(
            JSON.stringify(
                createResponse("Friends fetched successfully", 200, true, friends)
            ),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error while searching for friend:", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}