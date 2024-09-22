import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Group } from '@/types/types'; // Import your types

interface GroupCardProps {
  group: Group;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  return (
    <TouchableOpacity className="bg-white rounded-lg shadow-md p-4 mb-4">
      <View className="flex-row items-center">
        <Image
          source={{ uri: group.avatar || 'https://utfs.io/f/zDChzk2sNFdiA7tAXerYrEUV5sR61fmF9eAzIQNdoPjbinw0' }} // Fallback avatar
          style={{ width: 50, height: 50, borderRadius: 25 }}
        />
        <View className="ml-4">
          <Text className="text-lg font-semibold">{group.name}</Text>
          <Text className="text-gray-500">{group.description || "No description available"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
