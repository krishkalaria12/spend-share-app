import React, { FC, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Friend } from '@/types/types';

interface FriendCardProps {
  friend: Friend & { friendshipId?: string };
  method: (id: string) => void;
  remove?: boolean;
  yourRequestStatus?: boolean;
}

export const FriendCard: FC<FriendCardProps> = ({ friend, method, remove = false, yourRequestStatus = false }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleRemove = () => {
    method(friend.friendshipId ?? friend._id);
    setModalVisible(false);
  };

  const avatarUrl = friend.avatar || 'https://example.com/default-avatar.png';
  const buttonText = yourRequestStatus ? 'Cancel Request' : 'Remove';
  const modalTitle = yourRequestStatus ? 'Cancel Friend Request' : 'Remove Friend';
  const modalDescription = `Are you sure you want to ${yourRequestStatus ? 'cancel this friend request' : 'remove this friend'}? This action cannot be undone.`;

  return (
    <View className="bg-white rounded-xl shadow-md p-4 mb-4 flex-row items-center space-x-4">
      {/* Avatar */}
      <Image
        source={{ uri: avatarUrl }}
        className="w-16 h-16 rounded-full"
      />

      {/* Friend Info */}
      <View className="flex-1">
        <Text className="text-lg font-semibold text-secondary-900">{friend.username}</Text>
        <Text className="text-sm text-secondary-600">{friend.email}</Text>
        <Text className="text-sm text-secondary-500">{friend.fullName}</Text>
      </View>

      {/* Action Button */}
      {!remove ? (
        <TouchableOpacity onPress={() => method(friend._id)} className="bg-primary-500 px-4 py-2 rounded-full">
          <Text className="text-white font-semibold">Add</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-danger-500 px-4 py-2 rounded-full">
            <Text className="text-white font-semibold">{buttonText}</Text>
          </TouchableOpacity>

          {/* Confirmation Modal */}
          <Modal
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
              <View className="bg-white p-6 rounded-lg shadow-lg w-4/5">
                <Text className="text-xl font-semibold mb-4">{modalTitle}</Text>
                <Text className="text-base text-center mb-6">{modalDescription}</Text>

                <View className="flex-row justify-around">
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="bg-gray-300 py-2 px-4 rounded-full"
                  >
                    <Text className="text-black font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRemove}
                    className="bg-danger-500 py-2 px-4 rounded-full"
                  >
                    <Text className="text-white font-semibold">{buttonText}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};
