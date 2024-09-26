import React, { useEffect, useRef, useCallback } from 'react';
import { View, ActivityIndicator, Text, Animated, TouchableOpacity, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { getGroupById } from '@/actions/group.actions';
import { Group } from '@/types/types';
import { useLocalSearchParams } from 'expo-router';
import GroupSummary from '@/components/group/GroupSummary';
import ServerError from '@/components/ServerError';

const GroupId = () => {
  const params = useLocalSearchParams();
  const groupId = params.groupId as string;
  const { getToken, userId } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { data: group, isLoading, isError, refetch } = useQuery<Group>({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return getGroupById(groupId, token, userId);
    },
    enabled: !!groupId,
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

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary-100">
        <ActivityIndicator size="large" color="#0286FF" />
        <Animated.Text 
          className="mt-4 text-lg font-JakartaSemiBold text-primary-700"
          style={{ opacity: fadeAnim }}
        >
          Loading group details...
        </Animated.Text>
      </View>
    );
  }

  if (isError || !group) {
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

  console.log(group);
  

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <Animated.ScrollView 
        style={{ opacity: fadeAnim }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <GroupSummary group={group} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default GroupId;