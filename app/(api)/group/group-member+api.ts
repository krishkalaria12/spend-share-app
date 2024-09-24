import { connect } from "@/lib/db";
import { Group } from "@/models/group.models";
import User from "@/models/user.models";
import mongoose from "mongoose";
import { createError } from "@/utils/createError";
import { createResponse } from "@/utils/ApiResponse";

export async function POST(request: Request) {
    await connect();

    try {
        // Extract Authorization token from the request headers
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];

        if (!sessionToken) {
            throw createError("Unauthorized", 401, false);
        }

        const url = new URL(request.url);
        const groupId = url.searchParams.get('groupId');
        const userId = url.searchParams.get('userId');

        // Get the memberIds from the request body
        const { memberIds } = await request.json();

        if (!userId || !groupId || !mongoose.isValidObjectId(groupId)) {
            throw createError("Invalid group ID or User ID", 400, false);
        }

        // Retrieve the user info from the database
        const userInfo = await User.findOne({ clerkId: userId });
        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const mongoId = new mongoose.Types.ObjectId(userInfo._id);

        // Fetch the group by its ID
        const group = await Group.findById(groupId);

        // Check if the group exists
        if (!group) {
            throw createError("Group does not exist", 404, false);
        }

        // Check if the current user is the group admin
        if (!mongoId.equals(group.admin)) {
            throw createError("Unauthorized to add members to this group", 403, false);
        }

        // Check for valid member IDs
        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            throw createError("Member IDs must be provided as an array", 400, false);
        }

        // Validate and filter member IDs
        const invalidMemberIds = [];
        for (const memberId of memberIds) {
            if (!mongoose.isValidObjectId(memberId)) {
                invalidMemberIds.push(memberId);
            } else {
                const user = await User.findById(memberId);
                if (!user) {
                    invalidMemberIds.push(memberId);
                }
            }
        }

        if (invalidMemberIds.length > 0) {
            throw createError(`Invalid member IDs: ${invalidMemberIds.join(", ")}`, 400, false);
        }

        // Add new members to the group
        for (const memberId of memberIds) {
            if (!group.members.includes(memberId)) {
                group.members.push(memberId);
                // Update the user's list of groups
                await User.findByIdAndUpdate(memberId, { $addToSet: { groups: groupId } });
            }
        }

        // Save the updated group with new members
        await group.save();

        // Fetch the updated group details with members populated
        const updatedGroup = await Group.findById(groupId)
            .populate<{ members: any[], admin: { _id: any; } }>("members", "_id username email fullName")
            .populate("admin", "_id");

        if (!updatedGroup) {
            throw createError("Group does not exist", 404, false);
        }

        // Format the members with admin check
        const formattedMembers = updatedGroup.members.map((member) => ({
            _id: member._id,
            username: member.username,
            email: member.email,
            fullName: member.fullName,
            isAdmin: member._id.equals(updatedGroup.admin._id),
        }));

        // Prepare response with updated group info
        const response = {
            _id: updatedGroup._id,
            name: updatedGroup.name,
            description: updatedGroup.description,
            members: formattedMembers,
            admin: updatedGroup.admin._id,
            avatar: updatedGroup.avatar,
            createdAt: updatedGroup.createdAt,
            updatedAt: updatedGroup.updatedAt,
            __v: updatedGroup.__v
        };

        // Return success response
        return new Response(JSON.stringify(createResponse("Successfully added members to group", 200, true, response)), { status: 200 });

    } catch (error) {
        console.error("Error while adding members to group", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify({ message: error.message }), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}

export async function GET(request: Request) {
    await connect();

    try {
        // Extract Authorization token from the request headers
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];

        if (!sessionToken) {
            throw createError("Unauthorized", 401, false);
        }

        const url = new URL(request.url);
        const groupId = url.searchParams.get('groupId');
        const userId = url.searchParams.get('userId');

        // Validate userId and groupId
        if (!userId || !mongoose.isValidObjectId(userId)) {
            throw createError("Invalid user ID", 400, false);
        }

        if (!groupId || !mongoose.isValidObjectId(groupId)) {
            throw createError("Invalid group ID", 400, false);
        }

        // Fetch the group by its ID and populate the members
        const group = await Group.findById(groupId).populate("members");

        if (!group) {
            throw createError("Invalid Group", 400, false);
        }

        // Find the members in the User collection using the IDs in the group members array
        const members = await User.find({ _id: { $in: group.members } });

        if (!members || members.length === 0) {
            throw createError("No members found for the group", 400, false);
        }

        // Return the response with the members' details
        return new Response(
            JSON.stringify(createResponse("Fetched Group Members successfully", 200, true, { members })),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error while getting group members", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify({ message: error.message }), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal server error", 500, false)), { status: 500 });
    }
}