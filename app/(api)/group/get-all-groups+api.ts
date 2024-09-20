import { connect } from "@/lib/db";
import { Group } from "@/models/group.models";
import { createError } from "@/utils/createError";
import { createResponse } from "@/utils/ApiResponse";
import User from "@/models/user.models";
import mongoose from "mongoose";

export async function GET(request: Request) {
    await connect();

    try {
        const url = new URL(request.url);
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];
        const userId = url.searchParams.get('userId');

        if (!sessionToken) {
            return new Response(JSON.stringify(createError("Unauthorized", 401, false)), { status: 401 });
        }

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return new Response(JSON.stringify(createError("Invalid user ID", 400, false)), { status: 400 });
        }

        // Check if the user exists in the database
        const user = await User.findById(userId);
        if (!user) {
            return new Response(JSON.stringify(createError("User not found", 404, false)), { status: 404 });
        }

        // Fetch all groups where the user is a member
        const groups = await Group.aggregate([
            { $match: { members: new mongoose.Types.ObjectId(userId) } },
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
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    avatar: "$avatar",
                    members: {
                        $map: {
                            input: "$members",
                            as: "member",
                            in: {
                                _id: "$$member._id",
                                username: "$$member.username",
                                email: "$$member.email",
                                fullName: "$$member.fullName",
                                avatar: "$$member.avatar",
                                isAdmin: {
                                    $eq: ["$$member._id", { $arrayElemAt: ["$admin._id", 0] }]
                                }
                            }
                        }
                    }
                }
            },
            {
                $sort: {
                    "members.fullName": 1 // Sort members by full name
                }
            },
            {
                $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    description: { $first: "$description" },
                    avatar: { $first: "$avatar" },
                    members: { $push: "$members" }
                }
            }
        ]);

        if (!groups || groups.length === 0) {
            return new Response(JSON.stringify(createError("No groups found", 404, false)), { status: 404 });
        }

        return new Response(
            JSON.stringify(createResponse("Successfully fetched groups", 200, true, groups)),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching groups:", error);
        return new Response(
            JSON.stringify(createError("Internal Server Error", 500, false)),
            { status: 500 }
        );
    }
}
