import { connect } from "@/lib/db";
import { Expense } from "@/models/expense.models";
import User from "@/models/user.models";
import { createResponse } from "@/utils/ApiResponse";
import { createError } from "@/utils/ApiError";
import mongoose from "mongoose";

export async function GET(request: Request) {
    await connect();
    
    try {
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];
        if (!sessionToken) {
            throw createError("Unauthorized", 401, false);
        }

        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const clerkId = url.searchParams.get('clerkId');

        if (!clerkId) {
            throw createError("Clerk ID is required", 400, false);
        }
        
        const userInfo = await User.findOne({ clerkId: clerkId });
        
        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const mongoId = userInfo._id;

        const allCategories = ['Food', 'Miscellaneous', 'Studies', 'Outing'];

        const categoriesData = await Promise.all(allCategories.map(async (category) => {
            const totalCount = await Expense.countDocuments({ owner: mongoId, category });
            const totalPages = Math.ceil(totalCount / limit);
            const totalExpense = await Expense.aggregate([
                { $match: { owner: new mongoose.Types.ObjectId(mongoId), category } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);

            const expenses = await Expense.find({ owner: mongoId, category })
                .sort({ createdAt: -1 })
                .limit(limit);

            return {
                category,
                totalExpense: totalExpense[0]?.total || 0,
                totalPages,
                currentPage: 1,
                expenses
            };
        }));

        return Response.json(
            createResponse(
                "Expenses fetched successfully", 
                200, 
                true, 
                { expenses: categoriesData }
            )
        );
    } catch (error) {
        console.error("Error while fetching expenses: ", error);
        if (error instanceof Error) {
            return new Response(
                JSON.stringify(createError(error.message, 500, false)),
                { status: 500 }
            );
        }
        return new Response(
            JSON.stringify(createError("Internal Server Error", 500, false)),
            { status: 500 }
        );
    }
}