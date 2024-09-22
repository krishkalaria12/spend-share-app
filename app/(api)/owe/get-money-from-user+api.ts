import { connect } from "@/lib/db";
import { Owe } from "@/models/owe.models";
import User from "@/models/user.models";
import { createError } from "@/utils/ApiError";
import { createResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";

// The API route getMoneyFromUser retrieves the pending money amounts that others owe to the authenticated user.
// It fetches the transactions where the user is the creditor and filters them based on whether they are paid or unpaid.

export async function GET(request: Request) {
    await connect();

    try {
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];

        if (!sessionToken) {
            throw createError("Unauthorized", 401, false);
        }

        const url = new URL(request.url);
        const clerkId = url.searchParams.get('userId');
        
        if (!clerkId) {
            return Response.json(createError("Invalid user ID", 400, false));
        }

        const userInfo = await User.findOne({ clerkId: clerkId });

        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const userId = userInfo?._id;

        const pipeline = [
            {
                $match: {
                    creditor: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "debtor",
                    foreignField: "_id",
                    as: "debtorInfo",
                },
            },
            {
                $unwind: "$debtorInfo",
            },
            {
                $project: {
                    _id: 1,
                    amount: 1,
                    title: 1,
                    description: 1,
                    category: 1,
                    paid: 1,
                    debtorInfo: {
                        email: "$debtorInfo.email",
                        fullName: "$debtorInfo.fullName",
                        username: "$debtorInfo.username",
                        avatar: "$debtorInfo.avatar",
                    },
                },
            },
        ];

        const moneyOwedToUser = await Owe.aggregate(pipeline);

        if (!moneyOwedToUser) {
            return Response.json(createError("No money owed to user", 404, false));
        }

        return Response.json(createResponse(
            "Money owed to user found successfully", 200, true, moneyOwedToUser
        ));
    } catch (error) {
        console.error("Error getting money from users", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}
