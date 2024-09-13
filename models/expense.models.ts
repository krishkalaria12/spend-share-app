import mongoose, { Schema, Document, Model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface IExpense extends Document {
    owner: mongoose.Types.ObjectId;
    category: "Food" | "Studies" | "Outing" | "Miscellaneous";
    amount: number;
    title: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const expenseSchema: Schema<IExpense> = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "User is required"]
    },
    category: {
        type: String,
        enum: ["Food", "Studies", "Outing", "Miscellaneous"],
        required: [true, "Category is required"]
    },
    amount: {
        type: Number,
        required: [true, "Amount for expense is required"]
    },
    title: {
        type: String,
        required: [true, "Title for expense is required"],
    },
    description: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true
});

expenseSchema.plugin(mongooseAggregatePaginate);

export const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', expenseSchema);
