import React from "react";
import { SafeAreaView, ScrollView, View, Text, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@clerk/clerk-expo';
import { getAllGroups } from "@/actions/group.actions";
import { GroupCard } from "@/components/group/GroupCard";
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router'; // You can also use React Navigation
import { Group } from "@/types/types"; // Import your types here
import ServerError from "@/components/ServerError";
import { images } from "@/constants";

const GroupPage: React.FC = () => {
  const { getToken, userId } = useAuth();
  const router = useRouter();

  // Fetch groups using React Query
  const { data: groups, isLoading: loadingGroups, isError } = useQuery<Group[]>({
    queryKey: ["groups"],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return getAllGroups(token, userId);
    },
    retry: false,
  });

  if (loadingGroups) {
    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
          <View className="flex items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-4 text-lg font-semibold text-gray-600">Loading expenses...</Text>
          </View>
        </SafeAreaView>
      );
  }

  if (isError) {
    return (
        <SafeAreaView className="flex-1 bg-gray-100 pt-4">
          <ScrollView
            className="flex-1 px-4"
            // refreshControl={
            //   <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            // }
          >
            <ServerError />
            <Text className="mt-4 text-center text-lg font-semibold text-gray-600">
              Pull to refresh and try again!
            </Text>
          </ScrollView>
        </SafeAreaView>
      );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View className={`flex-row ${groups && groups.length > 0 ? "justify-between" : "justify-end"}`}>
          {groups && groups.length > 0 && (
            <Text className="text-2xl font-bold tracking-wide">
              Your Groups
            </Text>
          )}
          {/* Create Group Button */}
          <TouchableOpacity
            // onPress={() => router.push("/group/create")}
            className="bg-primary-500 p-3 rounded-full"
          >
            <Text className="text-white font-semibold">Create Group</Text>
          </TouchableOpacity>
        </View>

        {/* Groups List */}
        <View className="mt-4">
          {groups && groups.length > 0 ? (
            <View className="grid grid-cols-2 gap-4">
              {groups.map((group) => (
                <GroupCard key={group._id} group={group} />
              ))}
            </View>
          ) : (
            // No Groups Found
            <View className="items-center">
              <Text className="text-center text-3xl font-bold">
                You don't have any groups yet.
              </Text>
              <Text className="text-center text-gray-400 mt-2">
                Create one now and start managing money together!
              </Text>
              <Image
                source={images.groupNotFound}
                style={{ width: 300, height: 300, marginTop: 20 }}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
};

export default GroupPage;