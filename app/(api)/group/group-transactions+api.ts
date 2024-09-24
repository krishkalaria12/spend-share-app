import { connect } from "@/lib/db";
import { Transaction } from "@/models/transaction.models";
import mongoose from "mongoose";
import { createError } from "@/utils/createError";
import { createResponse } from "@/utils/ApiResponse";
import User from "@/models/user.models";

export async function GET(request: Request) {
  await connect();

  try {
    // Extract token from the request headers
    const sessionToken = request.headers.get('Authorization')?.split(' ')[1];

    if (!sessionToken) {
      throw createError("Unauthorized", 401, false);
    }

    const url = new URL(request.url);
    const groupId = url.searchParams.get("groupId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const clerkId = url.searchParams.get('userId');

    // Validate userId and groupId
    if (!clerkId || !groupId || !mongoose.isValidObjectId(groupId)) {
      throw createError("Invalid user ID or group ID", 400, false);
    }

    const userInfo = await User.findOne({ clerkId: clerkId });
    if (!userInfo) {
      throw createError("User not found", 404, false);
    }

    const userId = userInfo?._id;

    // Query to fetch transactions for the group
    const transactions = await Transaction.aggregate([
      { $match: { groupId: new mongoose.Types.ObjectId(groupId) } },
      {
        $lookup: {
          from: "owes",
          localField: "_id",
          foreignField: "transactionId",
          as: "owes",
        },
      },
      { $unwind: "$owes" },
      {
        $lookup: {
          from: "users",
          localField: "owes.creditor",
          foreignField: "_id",
          as: "creditorInfo",
        },
      },
      { $unwind: "$creditorInfo" },
      {
        $lookup: {
          from: "users",
          localField: "owes.debtor",
          foreignField: "_id",
          as: "debtorInfo",
        },
      },
      { $unwind: "$debtorInfo" },
      {
        $group: {
          _id: "$_id",
          totalAmount: { $first: "$amount" },
          description: { $first: "$description" },
          title: { $first: "$title" },
          category: { $first: "$category" },
          createdAt: { $first: "$createdAt" },
          creditor: {
            $first: {
              fullName: "$creditorInfo.fullName",
              email: "$creditorInfo.email",
              username: "$creditorInfo.username",
              avatar: "$creditorInfo.avatar",
            },
          },
          owes: {
            $push: {
              _id: "$owes._id",
              debtor: {
                fullName: "$debtorInfo.fullName",
                email: "$debtorInfo.email",
                username: "$debtorInfo.username",
                avatar: "$debtorInfo.avatar",
                clerkId: "$debtorInfo.clerkId",
              },
              paid: "$owes.paid",
              amount: "$owes.amount",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
          description: 1,
          title: 1,
          category: 1,
          createdAt: 1,
          creditor: 1,
          owes: 1,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalTransactions = await Transaction.countDocuments({
      groupId: new mongoose.Types.ObjectId(groupId),
    });

    const response = {
      transactions,
      totalPages: Math.ceil(totalTransactions / limit),
      currentPage: page,
    };

    // Return the response with the transactions data
    return new Response(
      JSON.stringify(createResponse("Successfully fetched group transactions", 200, true, response)),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while fetching group transactions:", error);
    return new Response(
      JSON.stringify(createError("Error while fetching group transactions", 500, false)),
      { status: 500 }
    );
  }
}