import { connect } from "@/lib/db";
import { Expense } from "@/models/expense.models";
import User from "@/models/user.models";
import { createError } from "@/utils/ApiError";
import { createResponse } from "@/utils/ApiResponse";
import { useAuth, useUser } from "@clerk/clerk-expo";
import mongoose from "mongoose";

export async function GET(request: Request) {
    await connect();

    try {
        const { userId, has } = useAuth();

        if (!userId || !has) {
            throw createError("Unauthorized", 401, false);
        }

        const { user } = useUser();
        
        const userInfo = await User.findOne({ clerkId: user?.id });
        
        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const mongoId = userInfo?._id;

        if (!mongoId || !mongoose.isValidObjectId(mongoId)) {
            throw createError("Invalid mongodb ID", 400, false);
        }

        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        // 1. Category Breakdown Pie Chart
        const categoryBreakdown = await Expense.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(mongoId) } },
        { $group: { _id: "$category", totalAmount: { $sum: "$amount" } } }
        ]);

        // 2. Monthly Spending Bar Chart
        const monthlySpending = await Expense.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(mongoId), createdAt: { $gte: fourWeeksAgo } } },
        { 
            $group: { 
            _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" }, category: "$category" }, 
            totalAmount: { $sum: "$amount" } 
            }
        },
        { 
            $project: {
            month: "$_id.month",
            year: "$_id.year",
            category: "$_id.category",
            totalAmount: 1,
            _id: 0
            }
        },
        { $sort: { year: 1, month: 1, category: 1 } }
        ]);

        // 3. Daily Expense Line Chart
        const dailyExpense = await Expense.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(mongoId) } },
        { 
            $group: { 
            _id: { day: { $dayOfMonth: "$createdAt" }, month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, 
            totalAmount: { $sum: "$amount" } 
            }
        },
        { 
            $project: {
            day: "$_id.day",
            month: "$_id.month",
            year: "$_id.year",
            totalAmount: 1,
            _id: 0
            }
        }
        ]);

        const responseData = {
            categoryBreakdown,
            monthlySpending,
            dailyExpense,
        };

        return Response.json(
            createResponse(
                "Visualise Expenses Fetched Successfully", 200, true, responseData
            )
        );

    } catch (error) {
        console.error("Error while fetching Expense visualisation:", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}