import { Group } from "@/types/types";

export async function getAllGroups(
  token: string,
  clerkId: string
): Promise<Group[]> {
  if (!token || !clerkId) {
    throw new Error("Authentication required");
  }

  try {
    const response = await fetch(
      `/(api)/group/get-all-groups/?clerkId=${clerkId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

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

export async function getGroupById(
    groupId: string,
    token: string,
    clerkId: string
) {
  console.log(groupId);
  
    if (!token || !clerkId) {
        throw new Error("Authentication required");
    }

    try {
        const response = await fetch(`/(api)/group/group/?groupId=${groupId}&userId=${clerkId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch group");
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching group:", error);
        throw error;
    }
}

export async function getGroupTransactions(
    groupId: string,
    token: string,
    clerkId: string,
    page: string,
    limit: string
) {
    if (!token || !clerkId) {
        throw new Error("Authentication required");
    }

    try {
        const response = await fetch(`/(api)/group/group-transactions/?groupId=${groupId}&page=${page}&limit=${limit}&userId=${clerkId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch group transactions");
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching group:", error);
        throw error;
    }
}

export const addMemberToGroup = async (userId: string, groupId: string, memberIds: string[], token: string) => {
  if (!token || !userId) {
    throw new Error("Authentication required");
  }
  const response = await fetch(`/(api)/group/group-member/?groupId=${groupId}&userId=${userId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ memberIds }),
  });
  if (!response.ok) throw new Error('Failed to add members');
  return response.json();
};

export const leaveGroup = async (userId: string, groupId: string, token: string) => {
  if (!token || !userId) {
    throw new Error("Authentication required");
  }
  const response = await fetch(`/(api)/group/leave-group/?groupId=${groupId}&userId=${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to leave group');
  return response.json();
};

export const removeMember = async (userId: string, groupId: string, memberId: string, token: string) => {
  if (!token || !userId) {
    throw new Error("Authentication required");
  }
  const response = await fetch(`/(api)/group/group-admin/?groupId=${groupId}&userId=${userId}&memberId=${memberId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to remove member');
  console.log("Successfully removed")
  return response.json();
};

export const makeAdmin = async (userId: string, groupId: string, memberId: string, token: string) => {
  if (!token || !userId) {
    throw new Error("Authentication required");
  }
  const response = await fetch(`/(api)/group/group-admin/?groupId=${groupId}&userId=${userId}&memberId=${memberId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to make admin');
  return response.json();
};

export const createGroupByValues = async (data: FormData, token: string | null, userId: string | null | undefined) => {
  if (!token || !userId) {
    throw new Error("Authentication required");
  }
  const response = await fetch(`/(api)/group/group/?userId=${userId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: data,
  });
  if (!response.ok) throw new Error('Failed to create group');
  return response.json();
};