import { connect } from "@/lib/db";
import { Owe } from "@/models/owe.models";
import { Transaction } from "@/models/transaction.models";
import User from "@/models/user.models";
import { createError } from "@/utils/ApiError";
import { createResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";

export async function POST(request: Request) {
    await connect();

    try {
        const { category, amount, title, description } = await request.json();

        const url = new URL(request.url);
        const friendId = url.searchParams.get('friendId');
        const userId = url.searchParams.get('userId');
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];

        if (!sessionToken || !userId) {
            throw createError("Unauthorized", 401, false);
        }

        if (!friendId) {
            throw createError("Friend ID is required", 400, false);
        }

        const userInfo = await User.findOne({ clerkId: userId });

        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const mongoId = new mongoose.Types.ObjectId(userInfo._id);
        const username = userInfo?.username;

        if (!userId || !mongoose.isValidObjectId(userId) || !friendId || !mongoose.isValidObjectId(friendId)) {
            throw createError("Invalid user ID or friendId", 400, false);
        }

        if (!(category || amount || title)) {
            throw createError("Invalid category, amount or title", 400, false);
        }

        if (parseInt(amount) <= 0) {
            throw createError("Invalid amount", 400, false);
        }

        if (description && description.length > 200) {
            throw createError("Description too long", 400, false);
        }

        const friend = new mongoose.Types.ObjectId(friendId);

        if (mongoId.equals(friend)) {
            throw createError("You cannot request money to yourself", 400, false);
        }

        // Create an Owe record
        const owe = await Owe.create({
            debtor: friendId,
            creditor: userId,
            category,
            amount,
            title,
            description,
        });

        if (!owe) {
            throw createError("Failed to send request! Please try again", 500,false);
        }

        const transaction = await Transaction.create({
            userId, // Ensure userId is included here
            category,
            amount,
            title,
            description: `Requested ${amount} ${category.toLowerCase()} from ${username ? username : friendId} for ${title}`
        });

        if (!transaction) {
            throw createError("Failed to send request! Please try again", 500, false);
        }

        return Response.json(createResponse("Request sent successfully", 201, true, owe));

    } catch (error) {
        console.error("Error while asking friend for money", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}