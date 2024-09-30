import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TextInput, TouchableOpacity, FlatList, ListRenderItem, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllFriends, searchFriend, addFriend, removeFriend } from '@/actions/friend.actions';
import { ServerError } from '@/components/ServerError';
import Toast from 'react-native-toast-message';
import { PlusIcon, TrashIcon, UserIcon, UserGroupIcon, ClockIcon } from 'react-native-heroicons/outline';
import debounce from 'lodash.debounce';
import { FriendCard } from '@/components/friend/FriendCard';
import { Friend, FriendRequest } from '@/types/types';

interface FriendsData {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  yourRequests: FriendRequest[];
}

type TabType = 'friends' | 'pendingRequests' | 'yourRequests';

const FriendPage: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  const { data: friendsData, isLoading: loadingFriends, isError: errorFriends, refetch: refetchFriends } = useQuery<FriendsData, Error>({
    queryKey: ['friends'],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return getAllFriends(token, userId);
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes caching
  });

  const addFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return addFriend(token, userId, friendId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      Toast.show({ type: 'success', text1: 'Friend request sent successfully' });
    },
    onError: (error: Error) => {
      Toast.show({ type: 'error', text1: 'Failed to send friend request', text2: error.message });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return removeFriend(token, userId, friendshipId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      Toast.show({ type: 'success', text1: 'Friend removed successfully' });
    },
    onError: (error: Error) => {
      Toast.show({ type: 'error', text1: 'Failed to remove friend', text2: error.message });
    },
  });

  const fetchSearchResults = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    try {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      const results = await searchFriend(query, token, userId);
      setSearchResults(results);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Search failed', text2: (error as Error).message });
    } finally {
      setSearchLoading(false);
    }
  }, [getToken, userId]);

  const debouncedSearch = useMemo(
    () => debounce(fetchSearchResults, 500),
    [fetchSearchResults]
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchFriends();
    setRefreshing(false);
  }, [refetchFriends]);

  const renderFriendItem: ListRenderItem<Friend> = useCallback(({ item }) => (
    <FriendCard
      friend={item}
      method={(id) => removeFriendMutation.mutate(id)}
      remove={true}
    />
  ), [removeFriendMutation]);

  const renderPendingRequestItem: ListRenderItem<FriendRequest> = useCallback(({ item }) => (
    <FriendCard
      friend={item.sender}
      method={(id) => addFriendMutation.mutate(id)}
      remove={false}
    />
  ), [addFriendMutation]);

  const renderYourRequestItem: ListRenderItem<FriendRequest> = useCallback(({ item }) => (
    <FriendCard
      friend={item.receiver}
      method={(id) => removeFriendMutation.mutate(id)}
      remove={true}
      yourRequestStatus={true}
    />
  ), [removeFriendMutation]);

  const renderTabContent = useMemo(() => {
    if (!friendsData) return null;

    if (activeTab === 'friends') {
      return (
        <FlatList
          data={friendsData.friends}
          keyExtractor={(item) => item._id}
          renderItem={renderFriendItem}
          ListEmptyComponent={() => (
            <Text className="text-center text-lg font-JakartaSemiBold text-secondary-600 mt-4">
              You don't have any friends yet. Start by searching for friends!
            </Text>
          )}
        />
      );
    } else if (activeTab === 'pendingRequests') {
      return (
        <FlatList
          data={friendsData.pendingRequests}
          keyExtractor={(item) => item._id}
          renderItem={renderPendingRequestItem}
          ListEmptyComponent={() => (
            <Text className="text-center text-lg font-JakartaSemiBold text-secondary-600 mt-4">
              No pending requests at the moment.
            </Text>
          )}
        />
      );
    } else if (activeTab === 'yourRequests') {
      return (
        <FlatList
          data={friendsData.yourRequests}
          keyExtractor={(item) => item._id}
          renderItem={renderYourRequestItem}
          ListEmptyComponent={() => (
            <Text className="text-center text-lg font-JakartaSemiBold text-secondary-600 mt-4">
              You haven't sent any requests yet.
            </Text>
          )}
        />
      );
    }
  }, [activeTab, friendsData, renderFriendItem, renderPendingRequestItem, renderYourRequestItem]);

  const TabButton: React.FC<{ tab: TabType; icon: React.ReactNode; label: string }> = useCallback(({ tab, icon, label }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`flex-1 items-center py-2 ${activeTab === tab ? 'border-b-2 border-primary-500' : ''}`}
    >
      {React.cloneElement(icon as React.ReactElement, { color: activeTab === tab ? '#0286FF' : '#999999', size: 24 })}
      <Text className={`mt-1 font-JakartaSemiBold ${activeTab === tab ? 'text-primary-500' : 'text-secondary-600'}`}>{label}</Text>
    </TouchableOpacity>
  ), [activeTab]);

  if (errorFriends) {
    return (
      <SafeAreaView className="flex-1 bg-primary-100 pt-4">
        <ScrollView
          className="flex-1 px-4"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <ServerError />
          <Text className="mt-4 text-center text-lg font-JakartaSemiBold text-secondary-600">
            Pull to refresh and try again!
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loadingFriends || refreshing) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-primary-100">
        <ActivityIndicator size="large" color="#0286FF" />
        <Text className="mt-4 text-lg font-JakartaSemiBold text-secondary-600">Loading friends...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-100 pt-6">
      <StatusBar barStyle="dark-content" />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Toast />
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-JakartaExtraBold text-secondary-900">Friends</Text>
        </View>

        <TextInput
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search for friends..."
          className="border border-secondary-300 rounded-full p-3 bg-white text-lg font-JakartaSemiBold mb-4"
        />

        {searchLoading && (
          <View className="flex justify-center items-center mb-4">
            <ActivityIndicator size="small" color="#0286FF" />
            <Text className="text-lg font-JakartaSemiBold text-secondary-600">Searching...</Text>
          </View>
        )}

        <View className="flex-row justify-around mb-4">
          <TabButton tab="friends" icon={<UserGroupIcon />} label="My Friends" />
          <TabButton tab="pendingRequests" icon={<ClockIcon />} label="Pending" />
          <TabButton tab="yourRequests" icon={<UserIcon />} label="Your Requests" />
        </View>

        {searchQuery && !searchLoading && (
          searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <FriendCard
                  friend={item}
                  method={(id) => addFriendMutation.mutate(id)}
                  remove={false}
                />
              )}
            />
          ) : (
            <Text className="text-center text-lg font-JakartaSemiBold text-secondary-600 mt-4">
              No results found.
            </Text>
          )
        )}

        {!searchQuery && renderTabContent}
      </ScrollView>
    </SafeAreaView>
  );
};

export default React.memo(FriendPage);