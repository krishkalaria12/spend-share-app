import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { Group, Friend } from '@/types/types';
import MultiSelect from 'react-native-multiple-select';
import { addMemberToGroup, leaveGroup, removeMember, makeAdmin } from '@/actions/group.actions';
import { useLocalSearchParams, useRouter } from 'expo-router';

const GroupDetails = () => {
  const { id, group: groupString } = useLocalSearchParams<{ id: string; group: string }>();
  const group: Group = JSON.parse(groupString);
  
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const router = useRouter();

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (memberIds: string[]) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return addMemberToGroup(userId, id, memberIds, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] })
      setSelectedMembers([]);
    },
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return leaveGroup(userId, id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      router.push('/group');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return removeMember(userId, id, memberId, token);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group', id] })
  });

  // Make admin mutation
  const makeAdminMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return makeAdmin(userId, id, memberId, token);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group', id] })
  });

  return (
    <ScrollView className="flex-1 bg-white p-4">
      {/* Group Avatar and Info */}
      <View className="items-center mb-6">
        {group.avatar ? (
          <Image source={{ uri: group.avatar }} className="w-24 h-24 rounded-full mb-3" />
        ) : (
          <View className="w-24 h-24 rounded-full bg-primary-500 mb-3 items-center justify-center">
            <Text className="text-white text-3xl font-bold">{group.name.charAt(0)}</Text>
          </View>
        )}
        <Text className="text-2xl font-bold">{group.name}</Text>
        <Text className="text-sm text-gray-600">{group.totalMembers} members</Text>
        <Text className="text-sm text-gray-600 mt-2">{group.description}</Text>
      </View>

      {/* Add Members */}
      {group.isAdmin && (
        <View className="mb-6">
          <Text className="text-base mb-2">Add Members</Text>
          <MultiSelect
            items={group.friends.map((friend: Friend) => ({ id: friend._id, name: friend.username }))}
            uniqueKey="id"
            onSelectedItemsChange={setSelectedMembers}
            selectedItems={selectedMembers}
            selectText="Select members"
          />
          <TouchableOpacity 
            onPress={() => addMemberMutation.mutate(selectedMembers)} 
            className="bg-primary-500 py-2 px-4 rounded mt-2"
          >
            <Text className="text-white text-center">Add Selected Members</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Members */}
      <Text className="text-base mb-2">Members</Text>
      <FlatList 
        data={group.members} 
        renderItem={({ item }) => (
          <View className="flex-row justify-between py-2">
            <Text>{item.username}</Text>
            {group.isAdmin && userId !== item._id && (
              <View className="flex-row">
                <TouchableOpacity 
                  onPress={() => removeMemberMutation.mutate(item._id)} 
                  className="bg-danger-500 px-3 py-1 rounded mr-2"
                >
                  <Text className="text-white">Remove</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => makeAdminMutation.mutate(item._id)} 
                  className="bg-primary-500 px-3 py-1 rounded"
                >
                  <Text className="text-white">Make Admin</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )} 
        keyExtractor={item => item._id} 
      />

      {/* Leave Group */}
      <TouchableOpacity 
        onPress={() => leaveGroupMutation.mutate()} 
        className="bg-danger-500 py-2 px-4 rounded mt-6"
      >
        <Text className="text-white text-center">Leave Group</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default GroupDetails;