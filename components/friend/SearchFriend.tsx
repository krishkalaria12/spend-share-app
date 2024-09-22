import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { InputField } from '@/components/InputField';
import { FriendCard } from '@/components/friend/FriendCard';
import { useDebouncedCallback } from 'use-debounce';
import { Friend } from '@/types/types';

interface SearchFriendProps {
  loading: boolean;
  searchResults: Friend[];
  onSearchQueryChange: (query: string) => void;
  query: string;
  method: (id: string) => void;
  remove: boolean;
}

export const SearchFriend: React.FC<SearchFriendProps> = ({
  loading,
  searchResults,
  onSearchQueryChange,
  query,
  method,
  remove
}) => {
  const [searchText, setSearchText] = useState(query);
  const [fadeAnim] = useState(new Animated.Value(0));

  const debouncedSearch = useDebouncedCallback((value) => {
    onSearchQueryChange(value);
  }, 500);

  const handleInputChange = (value: string) => {
    setSearchText(value);
    debouncedSearch(value);
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.ScrollView
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      style={{ opacity: fadeAnim }}
    >
      <View className="my-2">
        <Text className="text-3xl font-JakartaExtraBold text-secondary-900 mb-4">
          Find and Add Friends
        </Text>
        <Text className="text-gray-500 text-base mb-8">
          Search for friends to connect and manage your expenses together.
        </Text>

        <InputField
          label="Search"
          placeholder="Search friends..."
          value={searchText}
          onChangeText={handleInputChange}
          className="bg-white rounded-xl shadow-md p-4"
        />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0286FF" />
          <Text className="mt-4 text-secondary-600 font-JakartaMedium">Searching for friends...</Text>
        </View>
      ) : searchResults.length === 0 && searchText.trim() !== '' ? (
        <Text className="text-gray-500 text-center mt-8 font-JakartaMedium">No results found.</Text>
      ) : (
        searchResults.map((friend) => (
          <FriendCard
            key={friend._id}
            friend={friend}
            method={method}
            remove={remove}
          />
        ))
      )}
    </Animated.ScrollView>
  );
};