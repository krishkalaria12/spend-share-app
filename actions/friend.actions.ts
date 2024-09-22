import { Friend, FriendRequest } from "@/types/types";

// Fetch all friends, pending requests, and your sent requests
export const getAllFriends = async (
    token: string | null,
    userId: string | null | undefined
): Promise<{
    friends: Friend[];
    pendingRequests: FriendRequest[];
    yourRequests: FriendRequest[];
}> => {
    if (!token || !userId) {
        throw new Error("Authentication required");
    }

    const response = await fetch(`/(api)/friendship/friend/?userId=${userId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
            errorData.message || `Error fetching friends: ${response.statusText}`
        );
    }

    const data = await response.json();
    return data.data;
};

// This function will perform the friend search on the backend.
export const searchFriend = async (query: string, token: string | null, userId: string | null) => {
    if (!token || !userId) {
        throw new Error("Authentication required");
    }

    const response = await fetch(`/(api)/friendship/search-friend/?query=${query}&userId=${userId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error searching friends');
    }

    const data = await response.json();
    return data.data;  // Assuming response contains { data: friends[] }
};

export const addFriend = async (
    token: string | null,
    userId: string | null, 
    friendId: string
) => {
    if (!token || !userId) {
        throw new Error("Authentication required");
    }

    const response = await fetch(`/(api)/friendship/accept-request/?userId=${userId}&requestId=${friendId}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error searching friends');
    }

    const data = await response.json();
    return data.data;
}

export const removeFriend = async (
    token: string | null,
    userId: string | null, 
    friendshipId: string
) => {
    if (!token || !userId) {
        throw new Error("Authentication required");
    }

    const response = await fetch(`/(api)/friendship/friend/?userId=${userId}&friendshipId=${friendshipId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error searching friends');
    }

    const data = await response.json();
    return data.data;
}