import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { Group } from '@/types/types';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

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
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      className="w-full mb-6"
    >
      <Animated.View 
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <LinearGradient
          colors={['rgba(2, 134, 255, 0.8)', 'rgba(2, 134, 255, 0.6)']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          className="p-4"
        >
          <View className="flex-row items-center mb-3">
            <Image
              source={{ uri: group.avatar || 'https://utfs.io/f/zDChzk2sNFdiA7tAXerYrEUV5sR61fmF9eAzIQNdoPjbinw0' }}
              style={{ width: 70, height: 70, borderRadius: 35 }}
              className="border-2 border-white"
            />
            <View className="ml-4 flex-1">
              <Text className="text-2xl font-JakartaBold text-white" numberOfLines={1}>{group.name}</Text>
              <Text className="text-white font-JakartaMedium opacity-80" numberOfLines={1}>
                {group.members[0].length} members
              </Text>
            </View>
          </View>
          <Text className="text-white font-JakartaMedium mb-2" numberOfLines={2}>
            {group.description || "No description available"}
          </Text>
        </LinearGradient>
        <View className="p-4 bg-white">
          <View className="flex-row justify-between items-center">
            <View className="bg-primary-100 px-3 py-1 rounded-full">
              <Text className="font-JakartaMedium text-primary-700">
                {group.transactions?.length || 0} transactions
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};