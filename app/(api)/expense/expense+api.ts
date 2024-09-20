import { connect } from "@/lib/db";
import { Expense } from "@/models/expense.models";
import User from "@/models/user.models";
import { createResponse } from "@/utils/ApiResponse";
import { createError } from "@/utils/createError";
import mongoose from "mongoose";

export async function POST(request: Request){
    await connect();

    try {
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];

        if (!sessionToken) {
            throw createError("Unauthorized", 401, false);
        }

        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        if (!userId) {
            throw createError("User ID is required", 400, false);
        }

        const userInfo = await User.findOne({ clerkId: userId });

        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const mongoId = userInfo?._id;

        if (!mongoId || !mongoose.isValidObjectId(mongoId)) {
            throw createError("Invalid mongodb ID", 400, false);
        }

        const { category, amount,title, description } = await request.json();

        if (!(category || amount || title)) {
            throw createError("All fields are required", 401, false);
        }

        if (parseInt(amount) <= 0) {
            throw createError("Amount must be greater than 0", 401, false);
        }

        if (description && description.length > 200) {
            throw createError("Description must be less than 200 characters", 401, false);
        }

        const expense = await Expense.create({
            owner: mongoId,
            category,
            amount,
            description,
            title
        })

        if (!expense) {
            throw createError(
                "Error Submitting Expense", 500, false
            );
        }

        return Response.json(
            createResponse(
                "Expense submitted successfully", 200, true, expense
            )
        );

    } catch (error: any) {
        console.error("Error while adding Expense", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}

export async function DELETE(request: Request) {
    await connect();
    
    try {
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];

        if (!sessionToken) {
            throw createError("Unauthorized", 401, false);
        }

        const url = new URL(request.url);
        const clerkId = url.searchParams.get('userId');

        if (!clerkId) {
            throw createError("User ID is required", 400, false);
        }

        const userInfo = await User.findOne({ clerkId: clerkId });

        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const mongoId = userInfo?._id;

        if (!mongoId || !mongoose.isValidObjectId(mongoId)) {
            throw createError("Invalid mongodb ID", 400, false);
        }

        const { expenseId } = await request.json();

        if (!expenseId || !mongoose.isValidObjectId(expenseId)) {
            throw createError("Invalid request ID", 400, false);
        }

        const expenseDetails = await Expense.findById(expenseId);

        if (!expenseDetails) {
            throw createError("Expense not found", 404, false);
        }

        const userId = new mongoose.Types.ObjectId(mongoId);

        if (!userId.equals(expenseDetails?.owner)) {
            throw createError(
                "You are not authorized to delete this expense", 200, true
            );
        }

        const expense = await Expense.findByIdAndDelete(expenseDetails?._id);

        if (!expense) {
            throw createError(
                "Failed to delete expense! Try again later", 400, false
            );
        }

        return Response.json( 
            createResponse(
                "Expense Deleted Successfully", 200, true, expense
            )
        );
    } catch (error) {
        console.error("Error while deleting Expense", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}