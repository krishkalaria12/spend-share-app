import React, { useState } from "react";
import { SafeAreaView, ActivityIndicator, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getGroupById, getGroupTransactions } from "@/actions/group.actions";
import { useAuth } from "@clerk/clerk-expo"; // For user authentication
import Toast from 'react-native-toast-message';

// This is the Expo Router, it will help in extracting groupId from route
const GroupId = () => {
  const router = useRouter();
  const { getToken, userId } = useAuth(); // Getting the user details from Clerk Expo

  const [page, setPage] = useState(1);
  const limit = 10;
  const { id } = useLocalSearchParams();

  // Fetching group details
  const { data: groupDetails, isLoading: loadingGroupDetails, isError: errorGroupDetails } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return getGroupById(groupId, token);
    },
    enabled: !!groupId, // Enable the query only if groupId is available
  });

  // Fetching group transactions
  const { data: groupTransactions, isLoading: loadingGroupTransactions, isError: errorGroupTransactions } = useQuery({
    queryKey: ["groupTransactions", groupId, page],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return getGroupTransactions(groupId, page, limit, token);
    },
    enabled: !!groupId, // Enable the query only if groupId is available
  });

  // Logging the fetched group details and transactions
  console.log("Group Details:", groupDetails);
  console.log("Group Transactions:", groupTransactions);

  // Showing loading screen while fetching
  if (loadingGroupDetails || loadingGroupTransactions) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
        <View className="flex items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-lg font-semibold text-gray-600">Loading group details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error handling
  if (errorGroupDetails || errorGroupTransactions) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
        <View className="flex items-center justify-center">
          <Text className="text-xl font-bold text-red-500">Error fetching group details or transactions</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No UI is returned since you're logging data only
  return null;
};

export default GroupId;