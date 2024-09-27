import { connect } from "@/lib/db";
import { Group } from "@/models/group.models";
import { Owe } from "@/models/owe.models";
import { Transaction } from "@/models/transaction.models";
import User from "@/models/user.models";
import { createError } from "@/utils/ApiError";
import { createResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";

interface MemberShare {
    [memberId: string]: number;
}

enum SplitType {
    PERCENTAGE = 'PERCENTAGE',
    EQUAL = 'EQUAL',
    SHARE = 'SHARE'
}

export async function POST(request: Request) {
    await connect();

    try {
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];
        
        if (!sessionToken) {
            return new Response(JSON.stringify(createError("Unauthorized", 401, false)), { status: 401 });
        }

        const { amount, description, title, category, splitType, memberShares } = await request.json();
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const groupId = url.searchParams.get('groupId');

        if (!groupId || !mongoose.isValidObjectId(groupId)) {
            return new Response(JSON.stringify(createError("Invalid group ID", 400, false)), { status: 400 });
        }

        if (!userId) {
            return new Response(JSON.stringify(createError("Invalid user ID", 400, false)), { status: 400 });
        }

        const userInfo = await User.findOne({ clerkId: userId });
        if (!userInfo) {
            return new Response(JSON.stringify(createError("User not found", 404, false)), { status: 404 });
        }

        if (!title || !category || !amount || isNaN(amount) || amount <= 0 || !description) {
            return new Response(JSON.stringify(createError("Invalid input data", 400, false)), { status: 400 });
        }

        if (!Object.values(SplitType).includes(splitType)) {
            return new Response(JSON.stringify(createError("Invalid split type", 400, false)), { status: 400 });
        }
        
        if (!memberShares || typeof memberShares !== 'object' || Object.keys(memberShares).length < 1) {
            return new Response(JSON.stringify(createError("Invalid member shares", 400, false)), { status: 400 });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return new Response(JSON.stringify(createError("Group does not exist", 404, false)), { status: 404 });
        }

        const mongoUserId = userInfo._id;
        if (!group.members.includes(mongoUserId)) {
            return new Response(JSON.stringify(createError("Unauthorized to add member", 401, false)), { status: 401 });
        }

        // Calculate the individual shares
        let individualShares: MemberShare = {};
        const totalAmount = Number(amount);

        switch (splitType) {
            case SplitType.EQUAL:
                const equalShare = totalAmount / Object.keys(memberShares).length;
                Object.keys(memberShares).forEach(memberId => {
                    individualShares[memberId] = equalShare;
                });
                break;

            case SplitType.PERCENTAGE:
                let totalPercentage = 0;
                
                Object.entries(memberShares).forEach(([memberId, percentage]) => {
                    if (memberId !== 'mine') {
                        totalPercentage += Number(percentage);
                        individualShares[memberId] = (Number(percentage) / 100) * totalAmount;
                    }
                });
                console.log(totalPercentage);
                
                if (totalPercentage >= 100) {
                    return new Response(JSON.stringify(createError("Total percentage cannot exceed 100%", 400, false)), { status: 400 });
                }

                individualShares[mongoUserId.toString()] = (1 - totalPercentage / 100) * totalAmount; // Assign remaining to the user
                break;

            case SplitType.SHARE:
                let totalShares = 0;
                Object.entries(memberShares).forEach(([memberId, share]) => {
                    if (memberId !== 'mine') {
                        const shareAmount = Number(share);
                        totalShares += shareAmount;
                        individualShares[memberId] = shareAmount;
                    }
                });

                // Check if total shares exactly match the total amount
                if (totalShares > totalAmount) {
                    return new Response(JSON.stringify(createError("Total shares cannot exceed the total amount", 400, false)), { status: 400 });
                }

                individualShares[mongoUserId.toString()] = totalAmount - totalShares; // Assign remaining to the user
                break;
        }

        const memberIds = Object.keys(memberShares).filter((memberId) => memberId !== 'mine').map((id) => new mongoose.Types.ObjectId(id));
        memberIds.push(mongoUserId); // Add the requesting user to the list of members

        const transaction = await Transaction.create({
            groupId,
            userId: mongoUserId,
            amount: totalAmount,
            description,
            title,
            category,
            members: memberIds, // Ensure all member IDs are ObjectIds
            splitType
        });

        if (!transaction) {
            return new Response(JSON.stringify(createError("Failed to create transaction", 500, false)), { status: 500 });
        }

        const oweRecords = await Promise.all(
            Object.entries(individualShares).map(async ([memberId, shareAmount]) => {
                const isPaid = memberId === mongoUserId.toString();
                const actualMemberId = isPaid ? mongoUserId : new mongoose.Types.ObjectId(memberId);
                const oweRecord = await Owe.create({
                    groupId,
                    creditor: mongoUserId,
                    debtor: actualMemberId,
                    amount: shareAmount,
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

        return new Response(
            JSON.stringify(createResponse("Requested money successfully", 200, true, oweRecords)),
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error while requesting money from group", error);
        return new Response(JSON.stringify(createError("Internal server error", 500, false)), { status: 500 });
    }
}