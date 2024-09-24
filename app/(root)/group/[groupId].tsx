import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { getGroupById } from '@/actions/group.actions';
import { Group } from '@/types/types';
import { useLocalSearchParams } from 'expo-router';
import GroupSummary from '@/components/group/GroupSummary';

const GroupId = () => {
  const params = useLocalSearchParams();
  console.log(params);
  const groupId = params.groupId as string;
  const { getToken, userId } = useAuth();
  console.log(groupId);
  
  const { data: group, isLoading, isError } = useQuery<Group>({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const token = await getToken();
      console.log(groupId); // Ensure that the group ID is logged correctly
      if (!token || !userId) throw new Error("Authentication required");
      return getGroupById(groupId, token, userId);
    },
    enabled: !!groupId,  // Only fetch if groupId is available
  });


  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-lg font-semibold text-gray-600">Loading group...</Text>
      </View>
    );
  }

  if (isError || !group) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-lg font-semibold text-gray-600">Error loading group details.</Text>
      </View>
    );
  }

  return <GroupSummary group={group} />;
};

export default GroupId;