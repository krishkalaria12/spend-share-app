import { connect } from "@/lib/db";
import { Owe } from "@/models/owe.models";
import User from "@/models/user.models";
import { createError } from "@/utils/ApiError";
import { createResponse } from "@/utils/ApiResponse";

import mongoose from "mongoose";

// This API route is responsible for fetching the owes that the authenticated user needs to pay to others

export async function GET(request: Request) {
    await connect();

    try {
        const sessionToken = request.headers.get("Authorization")?.split(" ")[1];

        if (!sessionToken) {
        throw createError("Unauthorized", 401, false);
        }

        const url = new URL(request.url);
        const clerkId = url.searchParams.get("userId");

        if (!clerkId) {
            throw createError("User ID is required", 400, false);
        }

        const userInfo = await User.findOne({ clerkId: clerkId });

        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const userId = userInfo?._id;

        const pipeline = [
            {
                $match: {
                    debtor: new mongoose.Types.ObjectId(userId),
                    // paid: isPaid,
                    },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "creditor",
                    foreignField: "_id",
                    as: "creditorInfo",
                },
            },
            {
                $unwind: "$creditorInfo",
            },
            {
                $project: {
                    _id: 1,
                    amount: 1,
                    description: 1,
                    paid: 1,
                    title: 1,
                    category: 1,
                    creditorInfo: {
                        email: 1,
                        fullName: 1,
                        username: 1,
                        avatar: 1,
                    },
                },
            },
        ];

        // Execute the aggregation pipeline
        const owesToUser = await Owe.aggregate(pipeline);

        if (!owesToUser) {
            return Response.json(createError("No owes found", 404, false));
        }

        return Response.json(
            createResponse("Owes found successfully", 200, true, owesToUser)
        );
    } catch (error) {
        console.error("Error getting owe of user", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}
