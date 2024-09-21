import { connect } from "@/lib/db";
import { Owe } from "@/models/owe.models";
import { Transaction } from "@/models/transaction.models";
import User from "@/models/user.models";
import { createError } from "@/utils/ApiError";
import { createResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";

export async function DELETE(request: Request) {
    await connect();

    try {
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];

        if (!sessionToken) {
            throw createError("Unauthorized", 401, false);
        }

        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const oweId = url.searchParams.get('oweId');

        if (!oweId) {
            throw createError("Owe ID is required", 400, false);
        }

        if (!userId) {
            throw createError("User ID is required", 400, false);
        }

        const userInfo = await User.findOne({ clerkId: userId });

        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const mongoId = new mongoose.Types.ObjectId(userInfo?._id);

        const owe = await Owe.findById(oweId);

        if (!owe) {
            throw createError("Owe does not exist", 404, false);
        }

        if (!mongoId.equals(owe?.creditor)) {
            throw createError("Unauthorized to delete owe", 401, false);
        }

        // Delete the transaction associated with the owe
        const transaction = await Transaction.findOne({ oweId });
        if (transaction) {
            await Transaction.findByIdAndDelete(transaction._id);
        }

        // Delete the owe
        const deletedOwe = await Owe.findByIdAndDelete(oweId);

        if (!deletedOwe) {
            throw createError("Owe does not exist", 404, false);
        }

        return Response.json(createResponse("Owe and associated transaction deleted successfully", 200, true));
    } catch (error) {
        console.error("Error while deleting owe", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}