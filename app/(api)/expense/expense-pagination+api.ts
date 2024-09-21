import { connect } from "@/lib/db";
import { Expense } from "@/models/expense.models";
import User from "@/models/user.models";
import { createResponse } from "@/utils/ApiResponse";
import { createError } from "@/utils/ApiError";

export async function GET(request: Request) {
  await connect();
  try {
    const sessionToken = request.headers.get('Authorization')?.split(' ')[1];
    if (!sessionToken) {
      throw createError("Unauthorized", 401, false);
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const category = url.searchParams.get("category");
    const clerkId = url.searchParams.get('clerkId');

    if (!clerkId || !category) {
      throw createError("Clerk ID and category are required", 400, false);
    }

    const userInfo = await User.findOne({ clerkId: clerkId });
    if (!userInfo) {
      throw createError("User not found", 404, false);
    }

    const mongoId = userInfo._id;
    const skip = (page - 1) * limit;

    const expenses = await Expense.find({ owner: mongoId, category })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Expense.countDocuments({ owner: mongoId, category });
    const totalPages = Math.ceil(totalCount / limit);

    return Response.json(
      createResponse(
        "Expenses fetched successfully",
        200,
        true,
        { 
          expenses,
          currentPage: page,
          totalPages,
          category
        }
      )
    );
  } catch (error) {
    console.error("Error while fetching expenses: ", error);
    if (error instanceof Error) {
      return new Response(
        JSON.stringify(createError(error.message, 500, false)),
        { status: 500 }
      );
    }
    return new Response(
      JSON.stringify(createError("Internal Server Error", 500, false)),
      { status: 500 }
    );
  }
}