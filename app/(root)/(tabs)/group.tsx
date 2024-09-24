import React, { useRef, useEffect, useCallback } from "react";
import { SafeAreaView, ScrollView, View, Text, ActivityIndicator, TouchableOpacity, Image, Animated, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@clerk/clerk-expo';
import { getAllGroups } from "@/actions/group.actions";
import { GroupCard } from "@/components/group/GroupCard";
import Toast from 'react-native-toast-message';
import { Link, useRouter } from 'expo-router';
import { Group } from "@/types/types";
import ServerError from "@/components/ServerError";
import { images } from "@/constants";

const GroupPage: React.FC = () => {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { data: groups, isLoading: loadingGroups, isError, refetch } = useQuery<Group[]>({
    queryKey: ["groups"],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return getAllGroups(token, userId);
    },
    retry: false,
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (loadingGroups) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-primary-100">
        <View className="flex items-center justify-center">
          <ActivityIndicator size="large" color="#0286FF" />
          <Text className="mt-4 text-lg font-JakartaSemiBold text-primary-700">Loading your groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-primary-100 pt-4">
        <ScrollView 
          className="flex-1 px-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <ServerError />
          <Text className="mt-4 text-center text-lg font-JakartaMedium text-primary-700">
            Pull to refresh and try again!
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <Animated.ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 80, paddingTop: 50 }}
        style={{ opacity: fadeAnim }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className={`flex-row items-center ${groups && groups.length > 0 ? "justify-between" : "justify-end"} mb-6`}>
          {groups && groups.length > 0 && (
            <Text className="text-3xl font-JakartaBold text-primary-900 tracking-wide">
              Your Groups
            </Text>
          )}
          <TouchableOpacity
            onPress={() => router.push("/group/create")}
            className="bg-primary-500 px-4 py-3 rounded-full shadow-md"
          >
            <Text className="text-white font-JakartaSemiBold">Create Group</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-4">
          {groups && groups.length > 0 ? (
            <View className="">
              {groups.map((group) => (
                <View key={group._id} className="mt-4">
                  <GroupCard group={group} onPress={() => router.push(`/group/${group._id}`)} />
                </View>
              ))}
            </View>
          ) : (
            <Animated.View className="items-center" style={{ opacity: fadeAnim }}>
              <Text className="text-center text-3xl font-JakartaBold text-primary-900">
                No groups yet
              </Text>
              <Text className="text-center text-primary-700 mt-2 font-JakartaMedium">
                Create one now and start managing money together!
              </Text>
              <Image
                source={images.groupNotFound}
                style={{ width: 300, height: 300, marginTop: 20 }}
                resizeMode="contain"
              />
            </Animated.View>
          )}
        </View>
      </Animated.ScrollView>

      <Toast />
    </SafeAreaView>
  );
};

export default GroupPage;