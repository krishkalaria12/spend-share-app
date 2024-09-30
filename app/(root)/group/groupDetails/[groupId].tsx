import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, Animated, SafeAreaView, ActivityIndicator, StatusBar } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { Group, Friend } from '@/types/types';
import MultiSelect from 'react-native-multiple-select';
import { addMemberToGroup, leaveGroup, removeMember, makeAdmin } from '@/actions/group.actions';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

const GroupDetails = () => {
  const { id, group: groupString } = useLocalSearchParams<{ id: string; group: string }>();
  const group: Group = useMemo(() => JSON.parse(groupString), [groupString]);
  
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [localMembers, setLocalMembers] = useState(group.members);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 12,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const addMemberMutation = useMutation({
    mutationFn: async (memberIds: string[]) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return addMemberToGroup(userId, group._id, memberIds, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setSelectedMembers([]);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Members added to the group!',
      });
    },
    onError: (error) => {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add members. Please try again.',
      });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return leaveGroup(userId, group._id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      Toast.show({
        type: 'success',
        text1: 'Left Group',
        text2: 'You have left the group successfully.',
      });
      setTimeout(() => {
        router.push('/(root)/(tabs)/group');
      }, 1000);
    },
    onError: (error) => {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to leave the group. Please try again.',
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return removeMember(userId, group._id, memberId, token);
    },
    onMutate: (memberId: string) => {
      setLocalMembers(prev => prev.filter(member => member._id !== memberId));
    },
    onError: (err, memberId, context) => {
      setLocalMembers(group.members);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to remove member. Please try again.',
      });
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Member Removed',
        text2: 'The member was removed from the group.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
    },
  });

  const makeAdminMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return makeAdmin(userId, group._id, memberId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      Toast.show({
        type: 'success',
        text1: 'Admin Updated',
        text2: 'A new admin was assigned.',
      });
      router.back();
    },
    onError: (error) => {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to make admin. Please try again.',
      });
    },
  });

  const handleAddMembers = useCallback(() => {
    addMemberMutation.mutate(selectedMembers);
  }, [addMemberMutation, selectedMembers]);

  const handleLeaveGroup = useCallback(() => {
    leaveGroupMutation.mutate();
  }, [leaveGroupMutation]);

  const handleRemoveMember = useCallback((memberId: string) => {
    removeMemberMutation.mutate(memberId);
  }, [removeMemberMutation]);

  const handleMakeAdmin = useCallback((memberId: string) => {
    makeAdminMutation.mutate(memberId);
  }, [makeAdminMutation]);

  const renderMemberItem = useCallback(({ item }: { item: Group['members'][0] }) => (
    <View className="flex-row justify-between items-center py-4 border-b border-primary-200">
      <View className="flex-row items-center">
        <Image source={{ uri: item.avatar }} className="w-12 h-12 rounded-full mr-4" />
        <View>
          <Text className="font-JakartaSemiBold text-primary-800 text-base">{item.username}</Text>
          <Text className="font-JakartaMedium text-primary-600 text-sm">{item.isAdmin ? 'Admin' : 'Member'}</Text>
        </View>
      </View>
      {group.isAdmin && userId !== item._id && (
        <View className="flex-row">
          {!item.isAdmin && (
            <TouchableOpacity 
              onPress={() => handleRemoveMember(item._id)} 
              className="bg-danger-100 p-2 rounded-full mr-2 active:bg-danger-200 transition-colors duration-200"
            >
              <Ionicons name="person-remove" size={20} color="#E53E3E" />
            </TouchableOpacity>
          )}
          {!item.isAdmin && (
            <TouchableOpacity 
              onPress={() => handleMakeAdmin(item._id)} 
              className="bg-primary-100 p-2 rounded-full active:bg-primary-200 transition-colors duration-200"
            >
              <MaterialIcons name="admin-panel-settings" size={20} color="#0286FF" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  ), [group.isAdmin, userId, handleRemoveMember, handleMakeAdmin]);

  const memoizedMemberList = useMemo(() => (
    <FlatList
      data={localMembers}
      renderItem={renderMemberItem}
      keyExtractor={item => item._id}
    />
  ), [localMembers, renderMemberItem]);

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="dark-content" />
      <ScrollView className="flex-1">
        <LinearGradient
          colors={['#0286FF', '#0250FF']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          className="pt-12 pb-8 px-6 rounded-b-3xl"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }} className="items-center">
            {group.avatar ? (
              <Image source={{ uri: group.avatar }} className="w-32 h-32 rounded-full mb-4 border-4 border-white" />
            ) : (
              <View className="w-32 h-32 rounded-full bg-white mb-4 items-center justify-center">
                <Text className="text-primary-500 text-5xl font-JakartaBold">{group.name.charAt(0)}</Text>
              </View>
            )}
            <Text className="text-3xl font-JakartaBold text-white mb-2">{group.name}</Text>
            <Text className="text-base font-JakartaMedium text-white opacity-80">{group.totalMembers} members</Text>
            <Text className="text-sm font-Jakarta text-white opacity-70 mt-3 text-center">{group.description}</Text>
          </Animated.View>
        </LinearGradient>

        <View className="px-6 pt-8">
          {group.isAdmin && (
            <Animated.View className="mb-8 bg-white rounded-2xl p-6 shadow-lg" style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <Text className="text-xl font-JakartaBold text-primary-900 mb-4">Add Members</Text>
              <MultiSelect
                items={group.friends.map((friend: Friend) => ({ id: friend._id, name: friend.username }))}
                uniqueKey="id"
                onSelectedItemsChange={setSelectedMembers}
                selectedItems={selectedMembers}
                selectText="Select members"
                styleListContainer={{ maxHeight: 200 }}
                styleMainWrapper={{ backgroundColor: '#F5F8FF', borderRadius: 12, padding: 12 }}
                styleTextDropdown={{ fontFamily: 'Jakarta', color: '#475A99' }}
                styleTextDropdownSelected={{ fontFamily: 'JakartaSemiBold', color: '#0286FF' }}
                tagRemoveIconColor="#F56565"
                tagBorderColor="#C3D9FF"
                tagTextColor="#0286FF"
              />
              <TouchableOpacity 
                onPress={handleAddMembers} 
                className={`bg-primary-500 py-4 px-6 rounded-full mt-6 shadow-md active:bg-primary-600 transition-colors ${addMemberMutation.isPending ? 'bg-primary-300' : 'bg-primary-500'} duration-200`}
                disabled={addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? (
                  <View className='flex justify-center flex-row gap-4 items-center'>
                    <ActivityIndicator color="#FFF" />
                    <Text className='text-white text-center font-JakartaBold'>Adding Members...</Text>
                  </View>
                ) : (
                  <Text className="text-white text-center font-JakartaBold">Add Selected Members</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          <Animated.View className="bg-white rounded-2xl p-6 shadow-lg mb-8" style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text className="text-xl font-JakartaBold text-primary-900 mb-4">Members</Text>
            {memoizedMemberList}
          </Animated.View>

          <TouchableOpacity 
            onPress={handleLeaveGroup} 
            className={`py-4 px-6 rounded-full shadow-lg transition-colors duration-200 mb-12 ${leaveGroupMutation.isPending ? 'bg-danger-300' : 'bg-danger-500'}`} 
            disabled={leaveGroupMutation.isPending}
          >
            {leaveGroupMutation.isPending ? (
              <View className='flex justify-center flex-row gap-4 items-center'>
                <ActivityIndicator color="#FFF" />
                <Text className='text-white text-center font-JakartaBold'>Leaving...</Text>
              </View>
            ) : (
              <Text className="text-white text-center font-JakartaBold">Leave Group</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

export default React.memo(GroupDetails);