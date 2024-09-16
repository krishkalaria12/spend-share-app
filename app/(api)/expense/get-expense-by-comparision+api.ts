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
        const { has } = useAuth();

        if (!has) {
            throw createError("Unauthorized", 401, false);
        }

        const { user } = useUser();
        
        const userInfo = await User.findOne({ clerkId: user?.id });
        
        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const userId = userInfo?._id;

        if (!userId || !mongoose.isValidObjectId(userId)) {
            throw createError("Invalid mongodb ID", 400, false);
        }

        const today = new Date();

        // Calculate the start and end dates for the present week
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0); // Set to the start of the day

        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        endOfWeek.setHours(23, 59, 59, 999); // Set to the end of the day

        // Calculate the start and end dates for the past week
        const startOfPastWeek = new Date(startOfWeek);
        startOfPastWeek.setDate(startOfWeek.getDate() - 7);

        const endOfPastWeek = new Date(endOfWeek);
        endOfPastWeek.setDate(endOfWeek.getDate() - 7);

        // Calculate the start and end dates for the present month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        // Calculate the start and end dates for the previous month
        const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        startOfPreviousMonth.setHours(0, 0, 0, 0);

        const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        endOfPreviousMonth.setHours(23, 59, 59, 999);

        // Calculate expenses for the present week
        const weekExpense = await calculateExpense(userId, startOfWeek, endOfWeek);

        // Calculate expenses for the past week
        const pastWeekExpense = await calculateExpense(userId, startOfPastWeek, endOfPastWeek);

        // Calculate expenses for the present month
        const monthExpense = await calculateExpense(userId, startOfMonth, endOfMonth);

        // Calculate expenses for the previous month
        const previousMonthExpense = await calculateExpense(userId, startOfPreviousMonth, endOfPreviousMonth);

        // Calculate percentage comparison between present week and past week
        const weekComparison = calculatePercentageComparison(weekExpense, pastWeekExpense);

        // Calculate percentage comparison between present month and previous month
        const monthComparison = calculatePercentageComparison(monthExpense, previousMonthExpense);

        // Calculate overall expenses
        const overallExpense = await calculateOverallExpense(userId);

        const data = {
            monthExpense,
            weekExpense,
            percentageComparison: {
                week: weekComparison,
                month: monthComparison
            },
            overallExpenseAmount: overallExpense,
            totalExpenseAmount: monthExpense // Assuming total expense amount is calculated for the present month
        };

        return Response.json(
            createResponse(
                "Expense Comparision Fetched Successfully", 200, true, data
            )
        );

    } catch (error) {
        console.error("Error while fetching Expense comparision:", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}

const calculateOverallExpense = async (userId: string) => {
    const expenseAggregate = await Expense.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalExpense: { $sum: "$amount" }
            }
        },
        {
            $project: {
                _id: 0,
                totalExpense: 1
            }
        }
    ]);

    return expenseAggregate.length > 0 ? expenseAggregate[0].totalExpense : 0;
};

const calculateExpense = async (userId: string, startDate: Date, endDate: Date) => {
    const expenseAggregate = await Expense.aggregate([
        {
            $match: {
            owner: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
            _id: null,
            totalExpense: { $sum: "$amount" }
            }
        },
        {
            $project: {
            _id: 0,
            totalExpense: 1
            }
        }
    ]);

    return expenseAggregate.length > 0 ? expenseAggregate[0].totalExpense : 0;
};

  // Function to calculate percentage comparison between two expense amounts
const calculatePercentageComparison = (currentExpense: number, previousExpense: number) => {
    if (previousExpense === 0) {
      return "+100%"; // If there's no expense in the previous period, return +100% increase
    }
    const percentage = ((currentExpense - previousExpense) / previousExpense) * 100;
    return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`;
};