import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TextInput, TouchableOpacity, FlatList } from 'react-native';
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

const FriendPage = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchLoading, setSearchLoading] = useState(false); // New state for search loading
  const [activeTab, setActiveTab] = useState<'friends' | 'pendingRequests' | 'yourRequests'>('friends');
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch friends and requests data
  const { data: friendsData, isLoading: loadingFriends, isError: errorFriends, refetch: refetchFriends } = useQuery<FriendsData>({
    queryKey: ['friends'],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return getAllFriends(token, userId);
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes caching
  });

  // Add friend mutation
  const addFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return addFriend(token, userId, friendId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      Toast.show({
        type: 'success',
        text1: 'Friend request sent successfully',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to send friend request',
        text2: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    },
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return removeFriend(token, userId, friendshipId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      Toast.show({
        type: 'success',
        text1: 'Friend removed successfully',
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to remove friend',
        text2: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    },
  });

  // Function to handle search API call
  const fetchSearchResults = async (query: string) => {
    const token = await getToken();
    if (!token || !userId) throw new Error("Authentication required");

    setSearchLoading(true); // Set search loading state

    if (query.trim() === '') {
      setSearchResults([]);
      setSearchLoading(false); // End loading if query is empty
      return;
    }

    const results = await searchFriend(query, token, userId);
    setSearchResults(results);
    setSearchLoading(false); // End loading after search completes
  };

  // Debounced search function to limit API calls
  const debouncedSearch = useCallback(debounce((query: string) => {
    fetchSearchResults(query);
  }, 500), []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetchFriends().finally(() => setRefreshing(false));
  }, [refetchFriends]);

  // Memoize the tab content to avoid re-rendering on state changes
  const renderTabContent = useMemo(() => {
    if (!friendsData) return null;

    switch (activeTab) {
      case 'friends':
        return (
          <FlatList
            data={friendsData.friends}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <FriendCard
                key={item._id}
                friend={item}
                method={(id) => removeFriendMutation.mutate(id)}
                remove={true}
              />
            )}
            ListEmptyComponent={() => (
              <Text className="text-center text-lg font-JakartaSemiBold text-secondary-600 mt-4">
                You don't have any friends yet. Start by searching for friends!
              </Text>
            )}
          />
        );
      case 'pendingRequests':
        return (
          <FlatList
            data={friendsData.pendingRequests}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <FriendCard
                key={item._id}
                friend={item.sender}
                method={(id) => addFriendMutation.mutate(id)}
                remove={false}
              />
            )}
            ListEmptyComponent={() => (
              <Text className="text-center text-lg font-JakartaSemiBold text-secondary-600 mt-4">
                No pending requests at the moment.
              </Text>
            )}
          />
        );
      case 'yourRequests':
        return (
          <FlatList
            data={friendsData.yourRequests}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <FriendCard
                key={item._id}
                friend={item.receiver}
                method={(id) => removeFriendMutation.mutate(id)}
                remove={true}
                yourRequestStatus={true}
              />
            )}
            ListEmptyComponent={() => (
              <Text className="text-center text-lg font-JakartaSemiBold text-secondary-600 mt-4">
                You haven't sent any requests yet.
              </Text>
            )}
          />
        );
      default:
        return null;
    }
  }, [activeTab, friendsData, addFriendMutation, removeFriendMutation]);

  if (errorFriends) {
    return (
      <SafeAreaView className="flex-1 bg-primary-100 pt-4">
        <ScrollView
          className="flex-1 px-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
        <View className="flex items-center justify-center">
          <ActivityIndicator size="large" color="#0286FF" />
          <Text className="mt-4 text-lg font-JakartaSemiBold text-secondary-600">Loading friends...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-100 pt-6">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Toast />
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-JakartaExtraBold text-secondary-900">
            Friends
          </Text>
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <TextInput
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search for friends..."
            className="border border-secondary-300 rounded-full p-3 bg-white text-lg font-JakartaSemiBold"
          />
        </View>

        {/* Display loader during search */}
        {searchLoading && (
          <View className="flex justify-center items-center mb-4">
            <ActivityIndicator size="small" color="#0286FF" />
            <Text className="text-lg font-JakartaSemiBold text-secondary-600">Searching...</Text>
          </View>
        )}

        {/* Tabs */}
        <View className="flex-row justify-around mb-4">
          <TouchableOpacity
            onPress={() => setActiveTab('friends')}
            className={`flex-1 items-center py-2 ${activeTab === 'friends' ? 'border-b-2 border-primary-500' : ''}`}
          >
            <UserGroupIcon color={activeTab === 'friends' ? '#0286FF' : '#999999'} size={24} />
            <Text className={`mt-1 font-JakartaSemiBold ${activeTab === 'friends' ? 'text-primary-500' : 'text-secondary-600'}`}>My Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('pendingRequests')}
            className={`flex-1 items-center py-2 ${activeTab === 'pendingRequests' ? 'border-b-2 border-primary-500' : ''}`}
          >
            <ClockIcon color={activeTab === 'pendingRequests' ? '#0286FF' : '#999999'} size={24} />
            <Text className={`mt-1 font-JakartaSemiBold ${activeTab === 'pendingRequests' ? 'text-primary-500' : 'text-secondary-600'}`}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('yourRequests')}
            className={`flex-1 items-center py-2 ${activeTab === 'yourRequests' ? 'border-b-2 border-primary-500' : ''}`}
          >
            <UserIcon color={activeTab === 'yourRequests' ? '#0286FF' : '#999999'} size={24} />
            <Text className={`mt-1 font-JakartaSemiBold ${activeTab === 'yourRequests' ? 'text-primary-500' : 'text-secondary-600'}`}>Your Requests</Text>
          </TouchableOpacity>
        </View>

        {/* Render Search Results if Search Query is Present */}
        {searchQuery && !searchLoading && searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <FriendCard
                key={item._id}
                friend={item}
                method={(id) => addFriendMutation.mutate(id)}
                remove={false}
              />
            )}
          />
        )}

        {/* No search results message */}
        {searchQuery && !searchLoading && searchResults.length === 0 && (
          <Text className="text-center text-lg font-JakartaSemiBold text-secondary-600 mt-4">
            No results found.
          </Text>
        )}

        {/* Render Tab Content if No Search Query */}
        {!searchQuery && renderTabContent}
      </ScrollView>
    </SafeAreaView>
  );
};

export default FriendPage;