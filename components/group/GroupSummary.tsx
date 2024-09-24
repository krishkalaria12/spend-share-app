import React from 'react';
import { TouchableOpacity, Text, View, Image } from 'react-native';
import { Group } from '@/types/types';
import { Link } from 'expo-router';

interface GroupSummaryProps {
  group: Group;
}

const GroupSummary: React.FC<GroupSummaryProps> = ({ group }) => {
  return (
    <Link href={{
      pathname: "/(root)/group/groupDetails/[groupId]",
      params: { groupId: group._id, group: JSON.stringify(group) }
    }} asChild>
      <TouchableOpacity className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 m-2">
        <View className="flex-row items-center">
          {group.avatar ? (
            <Image source={{ uri: group.avatar }} className="w-12 h-12 rounded-full mr-4" />
          ) : (
            <View className="w-12 h-12 rounded-full bg-primary-500 mr-4 items-center justify-center">
              <Text className="text-white text-lg font-bold">{group.name.charAt(0)}</Text>
            </View>
          )}
          <View>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">{group.name}</Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300">
              {group.totalMembers} members
            </Text>
          </View>
        </View>
        <Text className="text-sm text-gray-600 dark:text-gray-400 mt-2" numberOfLines={2}>
          {group.description}
        </Text>
      </TouchableOpacity>
    </Link>
  );
};

export default GroupSummary;