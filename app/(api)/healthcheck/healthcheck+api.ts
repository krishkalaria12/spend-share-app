import { connect } from "@/lib/db";
import { createError } from "@/utils/ApiError";
import { createResponse } from "@/utils/ApiResponse";

export async function GET(request: Request) {
    await connect();

    try {
        return Response.json(
            createResponse(
                "Everything is fine", 200, true
            )
        )
    } catch (error) {
        console.log(error);
        throw createError(
            "Internal Server Error", 500, false
        );
    }
}