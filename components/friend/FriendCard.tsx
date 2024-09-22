import React, { FC, useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Animated } from 'react-native';
import { UserCircleIcon } from 'react-native-heroicons/outline';
import { Friend } from '@/types/types';

interface FriendCardProps {
  friend: (Friend & { friendshipId?: string }) | undefined;
  method: (id: string) => void;
  remove?: boolean;
  yourRequestStatus?: boolean;
}

export const FriendCard: FC<FriendCardProps> = ({ friend, method, remove = false, yourRequestStatus = false }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // If friend is undefined, don't render anything
  if (!friend) return null;

  const handleAction = () => {
    method(friend.friendshipId ?? friend._id);
    setModalVisible(false);
  };

  const avatarUrl = friend.avatar || 'https://utfs.io/f/zDChzk2sNFdiA7tAXerYrEUV5sR61fmF9eAzIQNdoPjbinw0';
  const buttonText = remove ? (yourRequestStatus ? 'Cancel Request' : 'Remove') : 'Add Friend';
  const modalTitle = yourRequestStatus ? 'Cancel Friend Request' : (remove ? 'Remove Friend' : 'Add Friend');
  const modalDescription = remove
    ? `Are you sure you want to ${yourRequestStatus ? 'cancel this friend request' : 'remove this friend'}? This action cannot be undone.`
    : `Do you want to send a friend request to ${friend.username}?`;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }} className="bg-white rounded-xl shadow-md p-4 mb-4">
      <View className="flex-row items-center space-x-4">
        {friend.avatar ? (
          <Image
            source={{ uri: avatarUrl }}
            className="w-16 h-16 rounded-full"
          />
        ) : (
          <UserCircleIcon size={64} color="#0286FF" />
        )}

        <View className="flex-1">
          <Text className="text-lg font-JakartaSemiBold text-secondary-900">{friend.username}</Text>
          {friend.fullName && (
            <Text className="text-sm font-JakartaLight text-secondary-500">{friend.fullName}</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className={`px-4 py-2 rounded-full ${remove ? 'bg-danger-500' : 'bg-primary-500'}`}
        >
          <Text className="text-white font-JakartaSemiBold">{buttonText}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white p-6 rounded-lg shadow-lg w-4/5">
            <Text className="text-xl font-JakartaBold mb-4 text-secondary-900">{modalTitle}</Text>
            <Text className="text-base text-center mb-6 font-JakartaMedium text-secondary-700">{modalDescription}</Text>

            <View className="flex-row justify-around">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-secondary-300 py-2 px-4 rounded-full"
              >
                <Text className="text-secondary-700 font-JakartaSemiBold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAction}
                className={`py-2 px-4 rounded-full ${remove ? 'bg-danger-500' : 'bg-primary-500'}`}
              >
                <Text className="text-white font-JakartaSemiBold">{buttonText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};