import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILike extends Document {
    likedBy: mongoose.Types.ObjectId;
    feedback: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const likeSchema: Schema<ILike> = new Schema({
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User Liking is required"]
    },
    feedback: {
        type: Schema.Types.ObjectId,
        ref: "Feedback",
        required: [true, "Feedback message is required"]
    }
}, {
    timestamps: true
});

export const Like: Model<ILike> = mongoose.models.Like || mongoose.model<ILike>("Like", likeSchema);
