import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { SafeAreaView, ScrollView, View, Text, ActivityIndicator, TouchableOpacity, Image, Animated, RefreshControl, StatusBar } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@clerk/clerk-expo';
import { getAllGroups } from "@/actions/group.actions";
import { GroupCard } from "@/components/group/GroupCard";
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { Group } from "@/types/types";
import ServerError from "@/components/ServerError";
import { images } from "@/constants";
import ErrorBoundary from "@/components/ErrorBoundary";

const MemoizedGroupCard = React.memo(GroupCard);

const LoadingView = () => (
  <SafeAreaView className="flex-1 justify-center items-center bg-primary-100">
    <View className="flex items-center justify-center">
      <ActivityIndicator size="large" color="#0286FF" />
      <Text className="mt-4 text-lg font-JakartaSemiBold text-primary-700">Loading your groups...</Text>
    </View>
  </SafeAreaView>
);

const ErrorView = ({ onRefresh, refreshing }: { onRefresh: () => Promise<void>, refreshing: boolean }) => (
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

const EmptyGroupsView = ({ fadeAnim }: { fadeAnim: Animated.Value }) => (
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
);

const GroupPage: React.FC = React.memo(() => {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { data: groups, isLoading: loadingGroups, isError, refetch } = useQuery<Group[]>({
    queryKey: ["groups", userId],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return getAllGroups(token, userId);
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing groups:", error);
      Toast.show({
        type: 'error',
        text1: 'Failed to refresh groups',
        text2: 'Please try again later',
      });
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const navigateToCreateGroup = useCallback(() => {
    router.push("/group/create");
  }, [router]);

  const navigateToGroup = useCallback((groupId: string) => {
    router.push(`/group/${groupId}`);
  }, [router]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const memoizedGroups = useMemo(() => groups, [groups]);

  if (loadingGroups) return <LoadingView />;
  if (isError) return <ErrorView onRefresh={onRefresh} refreshing={refreshing} />;

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-primary-100">
        <StatusBar barStyle="dark-content" />
        <Animated.ScrollView 
          contentContainerStyle={{ padding: 20, paddingBottom: 80, paddingTop: 50 }}
          style={{ opacity: fadeAnim }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className={`flex-row items-center ${memoizedGroups && memoizedGroups.length > 0 ? "justify-between" : "justify-end"} mb-6`}>
            {memoizedGroups && memoizedGroups.length > 0 && (
              <Text className="text-3xl font-JakartaBold text-primary-900 tracking-wide">
                Your Groups
              </Text>
            )}
            <TouchableOpacity
              onPress={navigateToCreateGroup}
              className="bg-primary-500 px-4 py-3 rounded-full shadow-md"
            >
              <Text className="text-white font-JakartaSemiBold">Create Group</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-4">
            {memoizedGroups && memoizedGroups.length > 0 ? (
              <View className="">
                {memoizedGroups.map((group) => (
                  <View key={group._id} className="mt-4">
                    <MemoizedGroupCard 
                      group={group} 
                      onPress={() => navigateToGroup(group._id)} 
                    />
                  </View>
                ))}
              </View>
            ) : (
              <EmptyGroupsView fadeAnim={fadeAnim} />
            )}
          </View>
        </Animated.ScrollView>

        <Toast />
      </SafeAreaView>
    </ErrorBoundary>
  );
});

GroupPage.displayName = 'GroupPage';

export default GroupPage;