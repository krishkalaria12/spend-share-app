import { connect } from "@/lib/db";
import { Expense } from "@/models/expense.models";
import User from "@/models/user.models";
import { createResponse } from "@/utils/ApiResponse";
import { createError } from "@/utils/ApiError";
import { useAuth, useUser } from "@clerk/clerk-expo";
import mongoose from "mongoose";

export async function GET(request: Request) {
    await connect();
    
    try {
        const { has } = useAuth();

        if (!has) {
            throw createError("Unauthorized", 401, false);
        }

        const { user } = useUser();
        
        const userInfo = await User.findOne({ clerkId: user?.id });
        
        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const mongoId = userInfo?._id;

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const pipeline: any[] = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(mongoId),
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$category",
                    totalExpense: { $sum: "$amount" },
                    expenses: { $push: "$$ROOT" },
                },
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    totalExpense: 1,
                    expenses: { $slice: ["$expenses", skip, limit] },
                },
            },
        ];

        const expense = await Expense.aggregate(pipeline);
        const totalExpenses = await Expense.countDocuments({
            owner: new mongoose.Types.ObjectId(mongoId),
        });

        if (!expense) {
            return new Response(
                JSON.stringify(createError("Error fetching expenses", 500, false)),
                { status: 500 }
            );
        }
        const response = {
            expenses: expense,
            totalPages: Math.ceil(totalExpenses / limit),
            currentPage: page,
        };

        return Response.json( 
            createResponse(
                "Expense of the user by category fetched Successfully", 200, true, response
            )
        );
    } catch (error) {
        console.error("Error while fetching Expense of user by category: ", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}