import { Group } from "@/types/types";

export async function getAllGroups(token: string, clerkId: string): Promise<Group[]> {
    if (!token || !clerkId) {
        throw new Error("Authentication required");
    }

    try {
        const response = await fetch(`/(api)/group/get-all-groups/?clerkId=${clerkId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch groups");
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching groups:", error);
        throw error;
    }
}