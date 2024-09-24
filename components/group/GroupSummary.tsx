import React, { useRef } from 'react';
import { TouchableOpacity, Text, View, Image, Animated } from 'react-native';
import { Group } from '@/types/types';
import { Link } from 'expo-router';

interface GroupSummaryProps {
  group: Group;
}

const GroupSummary: React.FC<GroupSummaryProps> = ({ group }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Link href={{
      pathname: "/(root)/group/groupDetails/[groupId]",
      params: { groupId: group._id, group: JSON.stringify(group) }
    }} asChild>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View 
          className="bg-white dark:bg-primary-900 rounded-xl shadow-lg p-6 m-2"
          style={{
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View className="flex-row items-center">
            {group.avatar ? (
              <Image source={{ uri: group.avatar }} className="w-16 h-16 rounded-full mr-4" />
            ) : (
              <View className="w-16 h-16 rounded-full bg-primary-500 mr-4 items-center justify-center">
                <Text className="text-white text-2xl font-JakartaBold">{group.name.charAt(0)}</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-xl font-JakartaBold text-primary-900 dark:text-primary-100">{group.name}</Text>
              <Text className="text-sm font-JakartaMedium text-primary-700 dark:text-primary-300">
                {group.totalMembers} members
              </Text>
            </View>
          </View>
          <Text className="text-base font-JakartaRegular text-secondary-700 dark:text-secondary-300 mt-4" numberOfLines={2}>
            {group.description || "No description available"}
          </Text>
          <View className="flex-row mt-4">
            {group.members.slice(0, 3).map((member, index) => (
              <Image 
                key={member._id} 
                source={{ uri: member.avatar || 'https://utfs.io/f/zDChzk2sNFdiA7tAXerYrEUV5sR61fmF9eAzIQNdoPjbinw0' }} 
                className="w-10 h-10 rounded-full border-2 border-white"
                style={{ marginLeft: index > 0 ? -10 : 0 }}
              />
            ))}
            {group.totalMembers && group.totalMembers > 3 && (
              <View className="w-10 h-10 rounded-full bg-primary-200 items-center justify-center ml-[-10]">
                <Text className="text-xs font-JakartaSemiBold text-primary-700">+{group.totalMembers - 3}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Link>
  );
};

export default GroupSummary;