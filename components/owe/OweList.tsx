import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Owe } from '@/types/types';
import { ListingOweCard } from './ListingOweCard';

interface OweListProps {
  owes: Owe[];
  payOwe: (oweId: string) => void;
  isPayOweLoading: boolean;
  payingOweId: string | null;
}

export const OweList: React.FC<OweListProps> = ({ owes, payOwe, isPayOweLoading, payingOweId }) => {
  if (owes.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-8 bg-white rounded-2xl shadow-md">
        <Text className="text-lg font-JakartaSemiBold text-secondary-500 text-center px-4">
          No transactions found. You're all caught up!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={owes}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <ListingOweCard
          owe={item}
          payOwe={payOwe}
          isLoading={isPayOweLoading && payingOweId === item._id}
        />
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};