import { connect } from "@/lib/db";
import { Group } from "@/models/group.models";
import User from "@/models/user.models";
import { createError } from "@/utils/createError";
import { createResponse } from "@/utils/ApiResponse";
import mongoose, { isValidObjectId } from "mongoose";

// PATCH request to change the group admin
export async function PATCH(request: Request) {
  await connect();

  try {
    const sessionToken = request.headers.get("Authorization")?.split(" ")[1];

    // Validate token
    if (!sessionToken) {
      return new Response(JSON.stringify(createError("Unauthorized", 401, false)), { status: 401 });
    }
    
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("userId");
    const groupId = url.searchParams.get("groupId");
    const memberId = url.searchParams.get("memberId");
    
    if (!clerkId) {
      return new Response(JSON.stringify(createError("Invalid user ID", 400, false)), { status: 400 });
    }
    
    const userInfo = await User.findOne({ clerkId: clerkId });
    if (!userInfo) {
      return new Response(JSON.stringify(createError("User not found", 404, false)), { status: 404 });
    }

    const userId = userInfo._id;
    
    if (!groupId || !memberId) {
      return new Response(JSON.stringify(createError("Invalid group ID or member ID", 400, false)), { status: 400 });
    }

    if (!isValidObjectId(groupId) || !isValidObjectId(memberId)) {
      return new Response(JSON.stringify(createError("Invalid group ID or member ID", 400, false)), { status: 400 });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return new Response(JSON.stringify(createError("Group not found", 404, false)), { status: 404 });
    }

    // Ensure the current user is the admin
    if (!group.admin.equals(new mongoose.Types.ObjectId(userId))) {
      return new Response(JSON.stringify(createError("Unauthorized: You are not the admin", 401, false)), { status: 401 });
    }

    // Ensure the member exists in the group
    if (!group.members.includes(new mongoose.Types.ObjectId(memberId))) {
      return new Response(JSON.stringify(createError("Member not found in group", 404, false)), { status: 404 });
    }

    // Admin cannot change admin to themselves
    if (group.admin.equals(memberId)) {
      return new Response(JSON.stringify(createError("Invalid member ID: Cannot change admin to self", 400, false)), { status: 400 });
    }

    group.admin = new mongoose.Types.ObjectId(memberId); // Update admin

    await group.save();

    return new Response(
      JSON.stringify(createResponse("Group admin changed successfully", 200, true, group)),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while changing group admin:", error);
    return new Response(JSON.stringify(createError("Failed to change group admin", 500, false)), { status: 500 });
  }
}

// DELETE request to remove a member from the group
export async function DELETE(request: Request) {
  await connect();

  try {
    const sessionToken = request.headers.get("Authorization")?.split(" ")[1];

    // Validate token
    if (!sessionToken) {
      return new Response(JSON.stringify(createError("Unauthorized", 401, false)), { status: 401 });
    }
    
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("userId");
    const memberId = url.searchParams.get("memberId");
    const groupId = url.searchParams.get("groupId");
    
    if (!clerkId) {
      return new Response(JSON.stringify(createError("Invalid user ID", 400, false)), { status: 400 });
    }
    
    const userInfo = await User.findOne({ clerkId: clerkId });
    if (!userInfo) {
      return new Response(JSON.stringify(createError("User not found", 404, false)), { status: 404 });
    }

    const userId = userInfo._id;
    
    if (!groupId || !memberId) {
      return new Response(JSON.stringify(createError("Invalid group ID or member ID", 400, false)), { status: 400 });
    }

    if (!isValidObjectId(groupId) || !isValidObjectId(memberId)) {
      return new Response(JSON.stringify(createError("Invalid group ID or member ID", 400, false)), { status: 400 });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return new Response(JSON.stringify(createError("Group not found", 404, false)), { status: 404 });
    }

    // Ensure the current user is the admin
    if (!group.admin.equals(new mongoose.Types.ObjectId(userId))) {
      return new Response(JSON.stringify(createError("Unauthorized: You are not the admin", 401, false)), { status: 401 });
    }

    // Find the member and remove them from the group
    const memberIndex = group.members.indexOf(new mongoose.Types.ObjectId(memberId));
    if (memberIndex === -1) {
      return new Response(JSON.stringify(createError("Member not found in group", 404, false)), { status: 404 });
    }

    // Remove the member from the group
    group.members.splice(memberIndex, 1);
    await group.save();

    // Remove the group from the member's list of groups
    await User.findByIdAndUpdate(memberId, { $pull: { groups: groupId } });

    // Fetch the updated group with populated member details
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "_id username email fullName avatar") // Ensure full user data is populated
      .populate("admin", "_id");

    if (!updatedGroup) {
      return new Response(JSON.stringify(createError("Group not found", 404, false)), { status: 404 });
    }

    // Format members with fully populated user data
    const formattedMembers = updatedGroup.members.map((member: any) => ({
      _id: member._id,
      username: member.username,
      email: member.email,
      fullName: member.fullName,
      avatar: member.avatar,
      isAdmin: member._id.equals(updatedGroup.admin._id), // Check if the member is the admin
    }));

    const response = {
      _id: updatedGroup._id,
      name: updatedGroup.name,
      description: updatedGroup.description,
      members: formattedMembers,
      admin: updatedGroup.admin._id,
      avatar: updatedGroup.avatar,
      createdAt: updatedGroup.createdAt,
      updatedAt: updatedGroup.updatedAt,
      __v: updatedGroup.__v,
    };

    console.log("Final response from API: ", response);
    

    return new Response(
      JSON.stringify(createResponse("Successfully removed member from group", 200, true, response)),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while removing member from group:", error);
    return new Response(JSON.stringify(createError("Error while removing member from group", 500, false)), { status: 500 });
  }
}