import { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
    clerkId: string;
    username: string;
    email: string;
    fullName: string;
    avatar: string;
    balance: number;
    friends: Schema.Types.ObjectId[];
    groups: Schema.Types.ObjectId[];
    createdAt?: Date;
    updatedAt?: Date;
}

const userSchema: Schema<IUser> = new Schema({
    clerkId: {
        type: String,
        required: [true, "Clerk Id is missing"],
        unique: true
    },
    username: {
        type: String,
        required: [true, "Username is Required"],
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: [true, "Email is Required"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: [true, "FullName is required"],
        trim: true,
        index: true,
    },
    avatar: {
        type: String,
        required: [true, "Avatar is required"]
    },
    balance: {
        type: Number,
        default: 0
    },
    friends: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    groups: [{
        type: Schema.Types.ObjectId,
        ref: 'Group'
    }]
}, {
    timestamps: true
});

const User = models.User || model<IUser>("User", userSchema);

export default User;