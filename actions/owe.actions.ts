import { Owe } from "@/types/types";

export const getOwesToUsers = async (token: string, userId: string): Promise<Owe[]> => {
    if (!token || !userId) {
        throw new Error("Authentication required");
    }

    try {
        const response = await fetch(
            `/(api)/owe/get-owe-of-users/?userId=${userId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        if (!response.ok) {
            throw new Error("Failed to fetch expenses");
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching expenses:", error);
        throw error;
    }
};

export const getMoneyFromUser = async (token: string, userId: string): Promise<Owe[]> => {
    if (!token || !userId) {
        throw new Error("Authentication required");
    }

    try {
        const response = await fetch(
            `/(api)/owe/get-money-from-user/?userId=${userId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        if (!response.ok) {
            throw new Error("Failed to fetch expenses");
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching expenses:", error);
        throw error;
    }
};

export const payFriend = async (
    clerkId: string,
    token: string,
    oweId: string
) => {
    if (!token || !clerkId) {
        throw new Error("Authentication required");
    }

    try {
        const response = await fetch(
            `/(api)/owe/pay-friend/?oweId=${oweId}&clerkId=${clerkId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        if (!response.ok) {
            throw new Error("Failed to pay owe");
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error paying owe:", error);
        throw error;
    }
};

export const deleteOwe = async (
    oweId: string,
    token: string,
    userId: string
) => {
    if (!token || !userId) {
        throw new Error("Authentication required");
    }

    try {
        const response = await fetch(
            `/(api)/owe/delete-owe/?oweId=${oweId}&userId=${userId}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        if (!response.ok) {
            throw new Error("Failed to delete owe");
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error deleting owe:", error);
        throw error;
    }
}