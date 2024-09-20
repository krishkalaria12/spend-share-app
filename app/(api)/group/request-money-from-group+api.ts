import { connect } from "@/lib/db";
import { Group } from "@/models/group.models";
import { Owe } from "@/models/owe.models";
import { Transaction } from "@/models/transaction.models";
import User from "@/models/user.models";
import { createError } from "@/utils/ApiError";
import { createResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";

export async function POST(request: Request) {
    await connect();

    try {
        // Extract session token from the request headers
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];
        
        // Validate the session token
        if (!sessionToken) {
            return new Response(JSON.stringify(createError("Unauthorized", 401, false)), { status: 401 });
        }

        // Validate the request payload
        const { amount, description, title, category, selectedMembers } = await request.json();
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const groupId = url.searchParams.get('groupId');

        if (!groupId || !mongoose.isValidObjectId(groupId)) {
            return new Response(JSON.stringify(createError("Invalid group ID", 400, false)), { status: 400 });
        }

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return new Response(JSON.stringify(createError("Invalid user ID", 400, false)), { status: 400 });
        }

        const userInfo = await User.findOne({ clerkId: userId });
        if (!userInfo) {
            return new Response(JSON.stringify(createError("User not found", 404, false)), { status: 404 });
        }

        if (!title) {
            return new Response(JSON.stringify(createError("Invalid title", 400, false)), { status: 400 });
        }

        if (!category) {
            return new Response(JSON.stringify(createError("Invalid category", 400, false)), { status: 400 });
        }


        if (!amount || isNaN(amount) || amount <= 0) {
            return new Response(JSON.stringify(createError("Invalid amount", 400, false)), { status: 400 });
        }

        if (!description) {
            return new Response(JSON.stringify(createError("Invalid description", 400, false)), { status: 400 });
        }

        if (!Array.isArray(selectedMembers) || selectedMembers.length < 1) {
            return new Response(JSON.stringify(createError("At least one member must be selected", 400, false)), { status: 400 });
        }

        // Find the group by ID
        const group = await Group.findById(groupId);
        if (!group) {
            return new Response(JSON.stringify(createError("Group does not exist", 404, false)), { status: 404 });
        }

        // Check if the user is a member of the group
        const mongoUserId = new mongoose.Types.ObjectId(userId);
        if (!group.members.includes(mongoUserId)) {
            return new Response(JSON.stringify(createError("Unauthorized to add member", 401, false)), { status: 401 });
        }

        // Calculate the amount per member
        const allSelectedMembers = [...selectedMembers, userId];
        const totalMembers = allSelectedMembers.length;
        const amountPerMember = amount / totalMembers;

        // Create a new transaction
        const transaction = await Transaction.create({
            groupId,
            userId,
            amount,
            description,
            title,
            category,
            members: allSelectedMembers
        });

        if (!transaction) {
            return new Response(JSON.stringify(createError("Failed to create transaction", 500, false)), { status: 500 });
        }

        // Create owe records for each member in the group
        const oweRecords = await Promise.all(
            allSelectedMembers.map(async memberId => {
                const isPaid = memberId === userId;
                const oweRecord = await Owe.create({
                    groupId,
                    creditor: userId,
                    debtor: memberId,
                    amount: amountPerMember,
                    description,
                    title,
                    category,
                    paid: isPaid,
                    transactionId: transaction._id
                });
                return oweRecord;
            })
        );

        if (!oweRecords) {
            return new Response(JSON.stringify(createError("Failed to create owe records", 500, false)), { status: 500 });
        }

        // Filter out any null records (if applicable)
        const filteredOweRecords = oweRecords.filter(record => record !== null);

        // Return success response with the created owe records
        return new Response(
            JSON.stringify(createResponse("Requested money successfully", 200, true, filteredOweRecords)),
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error while requesting money from group", error);
        return new Response(JSON.stringify(createError("Internal server error", 500, false)), { status: 500 });
    }
}
