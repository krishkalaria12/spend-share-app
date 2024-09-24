import { connect } from "@/lib/db";
import { Group } from "@/models/group.models";
import User from "@/models/user.models";
import { createError } from "@/utils/ApiError";
import { createResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";

export async function DELETE(request: Request) {
    await connect();

    try {
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];
        
        // Check if the session token is present
        if (!sessionToken) {
            return new Response(JSON.stringify(createError("Unauthorized", 401, false)), { status: 401 });
        }
        
        // Validate and extract the group ID from the URL
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId");
        const groupId = url.searchParams.get("groupId");

        if (!groupId || !mongoose.isValidObjectId(groupId)) {
            return new Response(JSON.stringify(createError("Invalid group ID", 400, false)), { status: 400 });
        }

        if (!userId) {
            return new Response(JSON.stringify(createError("Invalid user ID", 400, false)), { status: 400 });
        }

        // Check if the user exists in the database
        const userInfo = await User.findOne({ clerkId: userId });
        if (!userInfo) {
            return new Response(JSON.stringify(createError("User not found", 404, false)), { status: 404 });
        }

        const mongoUserId = new mongoose.Types.ObjectId(userInfo._id);

        // Find the group by group ID
        const group = await Group.findById(groupId);
        if (!group) {
            return new Response(JSON.stringify(createError("Group not found", 404, false)), { status: 404 });
        }

        // Check if the user is a member of the group
        if (!group.members.includes(mongoUserId)) {
            return new Response(JSON.stringify(createError("You are not a member of this group", 404, false)), { status: 404 });
        }

        // Check if the leaving member is the admin
        if (group.admin.equals(mongoUserId)) {
            // If the leaving member is the admin, transfer admin role to another member
            const newAdminId = group.members.find(memberId => !memberId.equals(mongoUserId));
            if (!newAdminId) {
                return new Response(JSON.stringify(createError("Failed to leave group: No alternative admin found", 500, false)), { status: 500 });
            }
            group.admin = newAdminId;
        }

        // Remove the user from the group members
        group.members = group.members.filter(memberId => !memberId.equals(mongoUserId));
        await group.save();

        // Remove the group from the user's list of groups
        await User.findByIdAndUpdate(userId, { $pull: { groups: groupId } });

        // Return success response
        return new Response(
            JSON.stringify(createResponse("Group left successfully", 200, true, group)),
            { status: 200 }
        );

    } catch (error: any) {
        console.log("Error while leaving group", error);
        return new Response(
            JSON.stringify(createError("Failed to leave group", 500, false)),
            { status: 500 }
        );
    }
}
