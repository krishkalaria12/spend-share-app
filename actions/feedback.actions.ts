type FeedbackType = {
  _id: string;
  message: string;
  createdAt: string;
  likes: number;
  owner: {
    username: string;
    fullName: string;
    avatar: string;
    clerkId: string;
  };
  isLiked: boolean;
};

export const getFeedback = async (
  page: number,
  limit: number,
  token: string | null,
  userId: string | null | undefined
): Promise<{
  feedbacks: FeedbackType[];
  totalPages: number;
  currentPage: number;
}> => {
  if (!token || !userId) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`/(api)/feedback/feedback/?page=${page}&limit=${limit}&userId=${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching feedback: ${response.statusText}`);
  }

  const data = await response.json();
  
  return data.data;
};

// Create a new feedback
export const createFeedback = async (
  message: string,
  token: string | null,
  clerkId: string | null | undefined
): Promise<FeedbackType> => {
  if (!token || !clerkId) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`/(api)/feedback/feedback/?userId=${clerkId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error("Error creating feedback");
  }

  const data = await response.json();
  return data.data;
};

// Delete feedback by ID
export const deleteFeedback = async (
  feedbackId: string,
  token: string | null,
  clerkId: string | null | undefined
): Promise<void> => {

  if (!token || !clerkId) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`/(api)/feedback/feedback/?userId=${clerkId}&feedbackId=${feedbackId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error deleting feedback");
  }

  const data = await response.json();
  
  return data.data;
};