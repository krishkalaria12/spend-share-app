import { connect } from "@/lib/db";
import { createResponse } from "@/utils/ApiResponse";
import { createError } from "@/utils/ApiError";
import User from "@/models/user.models";
import mongoose from "mongoose";
import { Transaction } from "@/models/transaction.models";

export async function GET(request: Request) {
    await connect();

    try {
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];

        if (!sessionToken) {
            throw createError("Unauthorized", 401, false);
        }

        const url = new URL(request.url);
        const clerkId = url.searchParams.get('clerkId');
        const userId = url.searchParams.get('userId');

        if (!clerkId) {
            throw createError("User ID is required", 400, false);
        }

        if (!userId) {
            throw createError("User ID is required", 400, false);
        }

        const userInfo = await User.findOne({ clerkId: clerkId });
        
        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const currentUser = new mongoose.Types.ObjectId(userId);

        // Use aggregation pipeline to differentiate between group and individual transactions
        const transactions = await Transaction.aggregate([
            {
                $match: {
                    $or: [
                        { creditor: currentUser },
                        { debtor: currentUser }
                    ]
                }
            },
            {
                $addFields: {
                    isGroupTransaction: {
                        $cond: {
                            if: { $ne: ["$groupId", null] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$isGroupTransaction",
                    transactions: { $push: "$$ROOT" }
                }
            }
        ]);

        // Extract group and individual transactions from the aggregation result
        const groupTransactions = transactions.find(t => t._id === true)?.transactions || [];
        const individualTransactions = transactions.find(t => t._id === false)?.transactions || [];
    
        return new Response(
            JSON.stringify(createResponse("Transactions found successfully", 200, true)),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error while fetching transactions:", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}