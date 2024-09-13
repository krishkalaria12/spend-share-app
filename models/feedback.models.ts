import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
    owner: mongoose.Types.ObjectId;
    message: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const FeedbackSchema: Schema<IFeedback> = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "User is required for the feedback"]
    },
    message: {
        type: String,
        required: [true, "Message is required"]
    },
}, {
    timestamps: true
});

const FeedbackModel = (mongoose.models.Feedback as mongoose.Model<IFeedback>) || (mongoose.model<IFeedback>("Feedback", FeedbackSchema));

export default FeedbackModel;