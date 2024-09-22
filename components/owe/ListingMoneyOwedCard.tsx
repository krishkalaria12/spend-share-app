import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Owe } from '@/types/types';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface ListingMoneyOwedCardProps {
  owe: Owe;
  deleteOwe: (oweId: string) => void;
  isLoading: boolean;
}

export const ListingMoneyOwedCard: React.FC<ListingMoneyOwedCardProps> = ({ owe, deleteOwe, isLoading }) => {
  return (
    <View className="bg-white rounded-2xl p-5 mb-4 shadow-lg border border-primary-100">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Image
            source={{ uri: owe.debtorInfo?.avatar || 'https://utfs.io/f/zDChzk2sNFdiA7tAXerYrEUV5sR61fmF9eAzIQNdoPjbinw0' }}
            className="w-14 h-14 rounded-full border-2 border-primary-200"
          />
          <View className="ml-4">
            <Text className="font-JakartaBold text-lg text-primary-900">{owe.title}</Text>
            <Text className="font-JakartaRegular text-sm text-secondary-600">{owe.description}</Text>
          </View>
        </View>
        <View className="bg-primary-100 p-3 rounded-full">
          <MaterialCommunityIcons name="currency-inr" size={24} color="#0286FF" />
        </View>
      </View>
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="font-JakartaRegular text-sm text-secondary-500">Amount Owed</Text>
          <Text className="font-JakartaBold text-xl text-primary-700">₹{owe.amount}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => deleteOwe(owe._id)}
          disabled={isLoading}
          className={`rounded-full px-6 py-3 flex-row items-center ${
            isLoading ? 'bg-danger-300' : 'bg-danger-500'
          }`}
        >
          <Text className="text-white font-JakartaSemiBold mr-2">
            {isLoading ? "Deleting..." : "Delete"}
          </Text>
          {!isLoading && (
            <Feather name="trash-2" size={18} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};