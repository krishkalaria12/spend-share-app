import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOwe extends Document {
    groupId: mongoose.Types.ObjectId;
    creditor: mongoose.Types.ObjectId;
    debtor: mongoose.Types.ObjectId;
    amount: number;
    description: string;
    paid: boolean;
    title: string;
    category: "Food" | "Studies" | "Outing" | "Miscellaneous";
    transactionId?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const OweSchema: Schema<IOwe> = new Schema({
    groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
    },
    creditor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Creditor for the Owe is required"]
    },
    debtor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Debtor is Required"]
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"]
    },
    description: {
        type: String,
        required: [true, "Description for the owe is required"]
    },
    paid: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
        required: [true, "Title is Required"]
    },
    category: {
        type: String,
        enum: ["Food", "Studies", "Outing", "Miscellaneous"],
        required: [true, "Category is required"]
    },
    transactionId: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction'
    }
}, {
    timestamps: true
});

export const Owe: Model<IOwe> = mongoose.models.Owe || mongoose.model<IOwe>('Owe', OweSchema);
