import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './user.models';

export interface ITransaction extends Document {
    amount: number;
    description: string;
    title: string;
    category: "Food" | "Studies" | "Outing" | "Miscellaneous";
    userId: IUser;
    groupId?: mongoose.Types.ObjectId;
    members?: mongoose.Types.ObjectId[];
    createdAt?: Date;
    updatedAt?: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema({
    amount: {
        type: Number,
        required: [true, "Amount is required"]
    },
    description: {
        type: String,
        required: [true, "Description is required"]
    },
    title: {
        type: String,
        required: [true, "Title is required"]
    },
    category: {
        type: String,
        enum: ["Food", "Studies", "Outing", "Miscellaneous"],
        required: [true, "Category is required"]
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }]
}, {
    timestamps: true
});

export const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);