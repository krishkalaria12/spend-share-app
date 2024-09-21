import { connect } from "@/lib/db";
import { Friendship } from "@/models/friendship.models";
import User from "@/models/user.models";
import { createError } from "@/utils/ApiError";
import { createResponse } from "@/utils/ApiResponse";
import mongoose, { isValidObjectId } from "mongoose";

export async function GET(request: Request) {
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

        const userAccount = await User.findOne({ clerkId: userId });

        if (!userAccount) {
            throw createError("Unauthorized", 401, false);
        }

        const aggregationPipeline = [
            {
                $facet: {
                    friends: [
                        {
                            $match: {
                                $or: [
                                    { user: userAccount._id, status: 'fulfilled' }, // userAccount._id is already ObjectId
                                    { friend: userAccount._id, status: 'fulfilled' },
                                ],
                            },
                        },
                        {
                            $lookup: {
                                from: 'users',
                                let: { friendId: { $cond: { if: { $eq: ['$user', userAccount._id] }, then: '$friend', else: '$user' } } },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$_id', '$$friendId'] } } },
                                    { $project: { _id: 1, username: 1, email: 1, fullName: 1, avatar: 1 } },
                                ],
                                as: 'friendDetails',
                            },
                        },
                        { $unwind: '$friendDetails' },
                        {
                            $project: {
                                _id: '$friendDetails._id',
                                username: '$friendDetails.username',
                                email: '$friendDetails.email',
                                fullName: '$friendDetails.fullName',
                                avatar: '$friendDetails.avatar',
                                friendshipId: '$_id',
                            }
                        }
                    ],
                    pendingRequests: [
                        {
                            $match: {
                                friend: userAccount._id,
                                status: 'pending',
                            },
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'userDetails',
                            },
                        },
                        { $unwind: '$userDetails' },
                        {
                            $project: {
                                _id: 1,
                                user: {
                                    _id: '$userDetails._id',
                                    username: '$userDetails.username',
                                    email: '$userDetails.email',
                                    fullName: '$userDetails.fullName',
                                    avatar: '$userDetails.avatar',
                                },
                                createdAt: 1,
                            },
                        },
                    ],
                    yourRequests: [
                        {
                            $match: {
                                user: userAccount._id,
                                status: 'pending',
                            },
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'friend',
                                foreignField: '_id',
                                as: 'friendDetails',
                            },
                        },
                        { $unwind: '$friendDetails' },
                        {
                            $project: {
                                _id: 1,
                                user: {
                                    _id: '$friendDetails._id',
                                    username: '$friendDetails.username',
                                    email: '$friendDetails.email',
                                    fullName: '$friendDetails.fullName',
                                    avatar: '$friendDetails.avatar',
                                },
                                createdAt: 1,
                                pending: true,
                            },
                        },
                    ],
                },
            },
        ];

        const results = await Friendship.aggregate(aggregationPipeline);
        const friends = results[0].friends.map((friend: { _id: any; username: any; email: any; fullName: any; avatar: any; friendshipId: { toString: () => any; }; }) => ({
            _id: friend._id,
            username: friend.username,
            email: friend.email,
            fullName: friend.fullName,
            avatar: friend.avatar,
            friendshipId: friend.friendshipId.toString()
        }));
        const pendingRequests = results[0].pendingRequests;
        const yourRequests = results[0].yourRequests;

        return new Response(
            JSON.stringify(createResponse("Successfully fetched friends and requests", 200, true, { friends, pendingRequests, yourRequests })),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error while fetching all friends:", error);
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
        const userId = url.searchParams.get('userId');
        const friendshipId = url.searchParams.get('friendshipId');

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
    
        if (!friendshipId || !isValidObjectId(friendshipId)) {
            throw createError("Invalid friendship ID", 400, false);
        }

        const friendship = await Friendship.findById(friendshipId);
    
        if (!friendship) {
            throw createError("Friendship not found", 404, false);
        }

        const deletedFriendship = await Friendship.findByIdAndDelete(friendshipId);
    
        if (!deletedFriendship) {
            throw createError("Failed to delete friendship", 400, false);
        }
    
        await User.findByIdAndUpdate(mongoId, { $pull: { friends: friendship.friend } });
        await User.findByIdAndUpdate(friendship.friend, { $pull: { friends: mongoId } });
    
        return new Response(
            JSON.stringify(createResponse("Friend deleted successfully", 200, true, deletedFriendship)),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error while deleting friend", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}