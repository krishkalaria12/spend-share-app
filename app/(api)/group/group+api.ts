import { connect } from "@/lib/db";
import { Group } from "@/models/group.models";
import { Transaction } from "@/models/transaction.models";
import { Owe } from "@/models/owe.models";
import User from "@/models/user.models";
import { createError } from "@/utils/createError";
import { createResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";

// Create a group (POST)
export async function POST(request: Request) {
    await connect();

    try {
        const formData = await request.formData();
        const name = formData.get("name");
        const description = formData.get("description");
        const friends = formData.get("friends");
        const avatar = formData.get("avatar");
        const url = new URL(request.url);

        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];
        if (!sessionToken) {
            throw createError("Unauthorized", 401, false);
        }

        const userId = url.searchParams.get('userId');
        if (!userId || !mongoose.isValidObjectId(userId)) {
            throw createError("Unauthorized", 401, false);
        }

        const userInfo = await User.findOne({ clerkId: userId });
        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        if (!name || !description) {
            throw createError("Invalid group name or description", 400, false);
        }

        const members = friends?.toString().split(",");
        if (!members || !Array.isArray(members) || members.length < 1) {
            throw createError("Invalid members", 400, false);
        }

        if (!members.includes(userId)) {
            members.push(userId);
        }

        for (const memberId of members) {
            if (!mongoose.isValidObjectId(memberId)) {
                throw createError("Invalid member ID", 400, false);
            }
        }

        const groupData = {
            name,
            description,
            members,
            admin: userId,
            creator: userId,
            avatar: avatar || ""
        };

        const group = await Group.create(groupData);

        if (!group) {
            throw createError("Failed to create group", 500, false);
        }

        await User.updateMany(
            { _id: { $in: members } },
            { $addToSet: { groups: group._id } }
        );

        return new Response(
            JSON.stringify(createResponse("Group created successfully", 201, true, group)),
            { status: 201 }
        );
    } catch (error) {
        console.log("Error while creating group", error);
        throw createError("Internal Server Error", 500, false);
    }
}

// Delete a group (DELETE)
export async function DELETE(request: Request) {
    await connect();

    try {
        const url = new URL(request.url)
        const groupId = url.searchParams.get('groupId');
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];
        const clerkId = url.searchParams.get('userId');

        if (!sessionToken || !clerkId || !mongoose.isValidObjectId(clerkId)) {
            throw createError("Unauthorized", 401, false);
        }

        const userInfo = await User.findOne({ clerkId });
        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        // Validate group ID
        if (!groupId || !mongoose.isValidObjectId(groupId)) {
            throw createError("Invalid group ID", 400, false);
        }

        const group = await Group.findById(groupId);
        if (!group) {
            throw createError("Group does not exist", 404, false);
        }

        const userId =  userInfo?._id;

        // Check if the current user is the admin of the group
        if (!userId.equals(group.admin)) {
            throw createError("Unauthorized to delete group", 401, false);
        }

        // Remove group references from users
        await User.updateMany(
            { _id: { $in: group.members } },
            { $pull: { groups: groupId } }
        );

        // Delete all transactions and owes associated with the group
        await Transaction.deleteMany({ groupId });
        await Owe.deleteMany({ groupId });

        const deletedGroup = await Group.findByIdAndDelete(groupId);

        return new Response(
            JSON.stringify(createResponse("Group deleted successfully", 200, true, deletedGroup)),
            { status: 200 }
        );
    } catch (error) {
        console.log("Error while deleting group", error);
        throw createError("Internal Server Error", 500, false);
    }
}

// Get group details by ID (GET)
export async function GET(request: Request) {
    await connect();

    try {
        const url = new URL(request.url)
        const groupId = url.searchParams.get('groupId');
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];
        const userId = url.searchParams.get('userId');

        if (!sessionToken || !userId || !mongoose.isValidObjectId(userId)) {
            throw createError("Unauthorized", 401, false);
        }

        const userInfo = await User.findOne({ clerkId: userId });
        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        // Validate group ID
        if (!groupId || !mongoose.isValidObjectId(groupId)) {
            throw createError("Invalid group ID", 400, false);
        }

        // MongoDB aggregation pipeline to fetch group details
        const group = await Group.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(groupId) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "members",
                    foreignField: "_id",
                    as: "members"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "admin",
                    foreignField: "_id",
                    as: "admin"
                }
            },
            {
                $unwind: "$members"
            },
            {
                $addFields: {
                    "members.isAdmin": { $eq: ["$members._id", { $arrayElemAt: ["$admin._id", 0] }] }
                }
            },
            {
                $sort: { "members.fullName": 1 }
            },
            {
                $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    description: { $first: "$description" },
                    admin: { $first: "$admin" },
                    members: { $push: "$members" },
                    createdAt: { $first: "$createdAt" },
                    avatar: { $first: "$avatar" }
                }
            },
            {
                $unwind: "$admin"
            },
            {
                $addFields: {
                    totalMembers: { $size: "$members" },
                    isAdmin: { $eq: ["$admin._id", new mongoose.Types.ObjectId(userId)] }
                }
            },
            {
                $lookup: {
                    from: "friendships",
                    let: { adminId: "$admin._id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$user", "$$adminId"] },
                                        { $eq: ["$status", "fulfilled"] }
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "friend",
                                foreignField: "_id",
                                as: "friendDetails"
                            }
                        },
                        { $unwind: "$friendDetails" }
                    ],
                    as: "adminFriends"
                }
            },
            {
                $addFields: {
                    friendsNotInGroup: {
                        $filter: {
                            input: "$adminFriends",
                            as: "friend",
                            cond: {
                                $not: { $in: ["$$friend.friendDetails._id", "$members._id"] }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    friends: {
                        $cond: {
                            if: "$isAdmin",
                            then: "$friendsNotInGroup",
                            else: []
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    members: {
                        _id: 1,
                        username: 1,
                        email: 1,
                        fullName: 1,
                        isAdmin: 1,
                        avatar: 1,
                        clerkId: 1
                    },
                    totalMembers: 1,
                    isAdmin: 1,
                    createdAt: 1,
                    friends: {
                        $map: {
                            input: "$friends",
                            as: "friend",
                            in: {
                                username: "$$friend.friendDetails.username",
                                email: "$$friend.friendDetails.email",
                                fullName: "$$friend.friendDetails.fullName",
                                avatar: "$$friend.friendDetails.avatar",
                                _id: "$$friend.friendDetails._id"
                            }
                        }
                    },
                    avatar: 1
                }
            }
        ]);

        if (!group || group.length === 0) {
            throw createError("Group not found", 404, false);
        }

        return new Response(
            JSON.stringify(createResponse("Group found successfully", 200, true, group[0])),
            { status: 200 }
        );
    } catch (error) {
        console.log("Error while fetching group details", error);
        throw createError("Internal Server Error", 500, false);
    }
}