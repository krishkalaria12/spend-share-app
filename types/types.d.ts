import { TextInputProps, TouchableOpacityProps } from "react-native";
import React from "react";

declare interface ButtonProps extends TouchableOpacityProps {
    title: string;
    bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
    textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
    IconLeft?: React.ComponentType<any>;
    IconRight?: React.ComponentType<any>;
    className?: string;
}

declare interface GoogleInputProps {
    icon?: string;
    initialLocation?: string;
    containerStyle?: string;
    textInputBackgroundColor?: string;
    handlePress: ({
        latitude,
        longitude,
        address,
    }: {
        latitude: number;
        longitude: number;
        address: string;
    }) => void;
}

declare interface InputFieldProps extends TextInputProps {
    label: string;
    icon?: any;
    secureTextEntry?: boolean;
    labelStyle?: string;
    containerStyle?: string;
    inputStyle?: string;
    iconStyle?: string;
    className?: string;
}

declare interface ExpenseCategory {
    category: string;
    totalExpense: number;
    expenses: {
        _id: string;
        title: string;
        amount: number;
        description: string;
        createdAt: string;
    }[];
};

declare interface FeedbackType {
    _id: string;
    owner: { username: string; avatar: { url: string }; clerkId: string };
    message: string;
    createdAt: string;
    isLiked: boolean;
};

declare interface ExpenseComparisonProps {
    data: {
        monthExpense: number;
        overallExpenseAmount: number;
        percentageComparison: {
            month: string;
            week: string;
        };
        totalExpenseAmount: number;
        weekExpense: number;
    };
}

declare interface Friend {
    clerkId?: string | null | undefined;
    _id: string;
    username: string;
    email: string;
    fullName: string;
    avatar: string;
    isAdmin?: boolean;
}

declare interface FriendRequest {
    sender?: Friend & { friendshipId?: string | undefined; };
    receiver?: Friend & { friendshipId?: string | undefined; };
    _id: string;
    user: Friend;
    status: 'pending' | 'fulfilled';
    createdAt: Date;
    updatedAt: Date;
}

declare interface GroupFriend {
    _id: string;
    username: string;
    email: string;
    avatar: string;
}