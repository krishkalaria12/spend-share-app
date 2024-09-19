import { connect } from "@/lib/db";
import FeedbackModel from "@/models/feedback.models";
import { Like } from "@/models/like.models";
import User from "@/models/user.models";
import { createResponse } from "@/utils/ApiResponse";
import { createError } from "@/utils/createError";
import mongoose from "mongoose";

export async function POST(request: Request){
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

        const userInfo = await User.findOne({ clerkId: userId });

        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const mongoId = userInfo?._id;

        if (!mongoId || !mongoose.isValidObjectId(mongoId)) {
            throw createError("Invalid mongodb ID", 400, false);
        }

        const { message } = await request.json();

        if (!message) {
            throw createError("Message is Required", 401, false);
        }

        const feedback = await FeedbackModel.create({
            owner: mongoId,
            message
        });
    
        if (!feedback) {
            throw createError(
                "Error Submitting Feedback", 500, false
            );
        }

        return Response.json(
            createResponse(
                "Feedback submitted successfully", 200, true, feedback
            )
        );
    } catch (error: any) {
        console.error("Error while creating feedback", error);
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
        const feedbackId = url.searchParams.get('feedbackId');

        if (!userId) {
            throw createError("User ID is required", 400, false);
        }

        const userInfo = await User.findOne({ clerkId: userId });

        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const mongoId = userInfo?._id;

        if (!feedbackId || !mongoose.isValidObjectId(feedbackId)) {
            throw createError("Invalid request ID", 400, false);
        }
        
        if (!mongoId || !mongoose.isValidObjectId(mongoId)) {
            throw createError("Invalid mongodb ID", 400, false);
        }
        
        const feedbackDetails = await FeedbackModel.findById(feedbackId);
        
        if (!feedbackDetails) {
            throw createError("Feedback not found", 404, false);
        }
    
        const id = new mongoose.Types.ObjectId(mongoId);
    
        if (
            !mongoId || !id.equals(feedbackDetails.owner)
        ) {
            throw createError("You are not authorized to update this feedback", 200, true)
        }
        
        const feedback = await FeedbackModel.findByIdAndDelete(feedbackDetails._id);
    
        if (!feedback) {
            throw createError("Error Deleting Feedback", 500, false);
        }
    
        await Like.deleteMany({
            feedback: feedbackId,
        });
    
        return Response.json(
            createResponse("Feedback Deleted successfully", 200, true)
        );
    } catch (error) {
        console.error("Error while deleting feeedback", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}

export async function GET(request: Request) {
    await connect();

    try {
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];

        if (!sessionToken) {
            throw createError("Unauthorized", 401, false);
        }

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const userId = url.searchParams.get('userId');

        if (!userId) {
            throw createError("User ID is required", 400, false);
        }

        const userInfo = await User.findOne({ clerkId: userId });
        
        if (!userInfo) {
            throw createError("User not found", 404, false);
        }

        const mongoId = userInfo?._id;

        if (!mongoId) {
            throw createError("Unauthorized", 401, false);
        }

        const skip = (page - 1) * limit;
    
        const feedbacks = await FeedbackModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                },
            },
            {
                $addFields: {
                    owner: { $arrayElemAt: ["$ownerDetails", 0] },
                },
            },
            {
                $lookup: {
                    from: "likes",
                    let: { feedbackId: "$_id", userId: mongoId },
                    pipeline: [
                    {
                        $match: {
                        $expr: {
                            $and: [
                            { $eq: ["$feedback", "$feedbackId"] },
                            { $eq: ["$likedBy", "$userId"] },
                            ],
                        },
                        },
                    },
                    { $project: { _id: 1 } },
                    ],
                    as: "likedByUser",
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    createdAt: 1,
                    message: 1,
                    "owner.username": 1,
                    "owner.fullName": 1,
                    "owner.avatar": 1,
                    "owner.clerkId": 1,
                    isLiked: { $gt: [{ $size: "$likedByUser" }, 0] },
                },
            },
        ]);
    
        const totalFeedbacks = await FeedbackModel.countDocuments();
    
        const response = {
            feedbacks,
            totalPages: Math.ceil(totalFeedbacks / limit),
            currentPage: page,
        };
    
        return new Response(
            JSON.stringify(createResponse("Feedbacks fetched successfully", 200, true, response)),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching feedback:", error);
        if (error instanceof Error) {
            return new Response(JSON.stringify(error.message), { status: 500 });
        }
        return new Response(JSON.stringify(createError("Internal Server Error", 500, false)), { status: 500 });
    }
}