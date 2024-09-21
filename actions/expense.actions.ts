import { ExpenseCategory } from "@/types/types";

export const getAllExpensesByCategory = async (
    page: number,
    limit: number,
    token: string | null,
    clerkId: string | null | undefined
): Promise<{
    expenses: ExpenseCategory[];
    totalPages: number;
    currentPage: number;
}> => {
    if (!token || !clerkId) {
        throw new Error("Authentication required");
    }

    const response = await fetch(
        `/(api)/expense/get-expenses-of-user-by-category/?page=${page}&limit=${limit}&clerkId=${clerkId}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Error fetching expenses: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
};

export const getExpenseComparison = async (
    token: string | null,
    clerkId: string | null | undefined
) => {
    if (!token || !clerkId) {
        throw new Error("Authentication required");
    }

    const response = await fetch(
        `/(api)/expense/get-expense-by-comparision/?clerkId=${clerkId}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(
            `Error fetching expense comparison: ${response.statusText}`
        );
    }

    const data = await response.json();
    return data.data;
};

export const deleteExpense = async (
    expenseId: string,
    token: string | null,
    clerkId: string | null | undefined
) => {
    if (!token || !clerkId) {
        throw new Error("Authentication required");
    }

    const response = await fetch(
        `/(api)/expense/expense/?expenseId=${expenseId}&clerkId=${clerkId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(
            `Error deleting expense: ${response.statusText}`
        );
    }

    const data = await response.json();
    return data.data;
}

interface ExpenseFormData {
    title: string;
    amount: string;
    description: string | undefined;
    category: string;
}

export const addExpense = async (data: ExpenseFormData, token: string, userId: string) => {
    try {
        if (!token || !userId) {
            throw new Error("Authentication required");
        }

        const response = await fetch(`/(api)/expense/expense/?userId=${userId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error submitting expense");
        }

        const expenseData = await response.json();
        return expenseData;
    } catch (error: any) {
        throw new Error(error.message || "Failed to submit expense");
    }
};

export const deleteAllExpenses = async (
    token: string | null,
    userId: string | null | undefined
) => {
    if (!token || !userId) {
        throw new Error("Authentication required");
    }

    const response = await fetch(
        `/(api)/expense/expense/?userId=${userId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(
            `Error deleting all expenses: ${response.statusText}`
        );
    }

    const data = await response.json();
    return data.data;
}