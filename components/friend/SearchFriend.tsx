import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { InputField } from '@/components/InputField'; // Your custom InputField component
import { FriendCard } from '@/components/friend/FriendCard'; // Assuming you have a FriendCard component
import { useDebouncedCallback } from 'use-debounce'; // Library for debouncing

interface SearchFriendProps {
  loading: boolean;
  searchResults: any[];
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

  // Debounce search input to avoid unnecessary calls
  const debouncedSearch = useDebouncedCallback((value) => {
    onSearchQueryChange(value);
  }, 500);

  const handleInputChange = (value: string) => {
    setSearchText(value);
    debouncedSearch(value); // Apply debounced search
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, flexGrow: 1 }}>
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
        <ActivityIndicator size="large" color="#0286FF" />
      ) : searchResults.length === 0 && searchText.trim() !== '' ? (
        <Text className="text-gray-500 text-center mt-8">No results found.</Text>
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
    </ScrollView>
  );
};
