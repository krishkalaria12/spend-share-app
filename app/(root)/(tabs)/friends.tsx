import React, { useState, useCallback } from 'react';
import { Text, View, ScrollView, RefreshControl, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllFriends, searchFriend } from '@/actions/friend.actions';
import { ServerError } from '@/components/ServerError';
import Toast from 'react-native-toast-message';
import { PlusIcon, TrashIcon } from 'react-native-heroicons/outline';
import { Friend, FriendRequest } from '@/types/types';
import debounce from 'lodash.debounce';

interface FriendsData {
    friends: Friend[];
    pendingRequests: FriendRequest[];
    yourRequests: FriendRequest[];
}

const FriendPage = () => {
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Friend[]>([]);
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
    });

    // Function to handle search API call
    const fetchSearchResults = async (query: string) => {
        const token = await getToken();
        if (!token || !userId) throw new Error("Authentication required");
        if (query.trim() === '') {
            setSearchResults([]);
            return;
        }
        const results = await searchFriend(query, token, userId);
        setSearchResults(results);
    };

    // Debounced search function to limit API calls
    const debouncedSearch = useCallback(debounce((query: string) => {
        fetchSearchResults(query);
    }, 500), []);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        debouncedSearch(query); // Trigger debounced search
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        refetchFriends().finally(() => setRefreshing(false));
    }, [refetchFriends]);

    if (errorFriends) {
        return (
            <SafeAreaView className="flex-1 bg-gray-100 pt-4">
                <ScrollView
                    className="flex-1 px-4"
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <ServerError />
                    <Text className="mt-4 text-center text-lg font-semibold text-gray-600">
                        Pull to refresh and try again!
                    </Text>
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (loadingFriends || refreshing) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
                <View className="flex items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="mt-4 text-lg font-semibold text-gray-600">Loading friends...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-100 pt-6">
            <ScrollView
                className="flex-1 px-4"
                contentContainerStyle={{ paddingBottom: 80 }}
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
                        className="border border-gray-300 rounded-full p-3 bg-white text-lg font-JakartaSemiBold"
                    />
                </View>

                {/* Render Search Results if Search Query is Present */}
                {searchQuery && searchResults.length > 0 && (
                    <View>
                        <Text className="text-lg font-semibold text-gray-600 mb-2">Search Results:</Text>
                        {searchResults.map((friend) => (
                            <View key={friend._id} className="p-4 bg-white mb-2 rounded-xl shadow-md">
                                <Text className="text-lg font-semibold">{friend.username}</Text>
                                <Text className="text-sm text-gray-600">{friend.email}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Render Friends List if No Search Query */}
                {!searchQuery && friendsData?.friends &&  friendsData?.friends.length > 0 && (
                    <View>
                        <Text className="text-lg font-semibold text-gray-600 mb-2">Your Friends:</Text>
                        {friendsData.friends.map((friend) => (
                            <View key={friend._id} className="p-4 bg-white mb-2 rounded-xl shadow-md">
                                <Text className="text-lg font-semibold">{friend.username}</Text>
                                <Text className="text-sm text-gray-600">{friend.email}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default FriendPage;
