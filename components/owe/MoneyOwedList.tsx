import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Owe } from '@/types/types';
import { ListingMoneyOwedCard } from './ListingMoneyOwedCard';

interface MoneyOwedListProps {
  moneyOwed: Owe[];
  deleteOwe: (oweId: string) => void;
  isDeleteOweLoading: boolean;
  deletingOweId: string | null;
}

export const MoneyOwedList: React.FC<MoneyOwedListProps> = ({ moneyOwed, deleteOwe, isDeleteOweLoading, deletingOweId }) => {
  if (moneyOwed.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-8 bg-white rounded-2xl shadow-md">
        <Text className="text-lg font-JakartaSemiBold text-secondary-500 text-center px-4">
          No outstanding debts. Great job managing your finances!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={moneyOwed}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <ListingMoneyOwedCard
          owe={item}
          deleteOwe={deleteOwe}
          isLoading={isDeleteOweLoading && deletingOweId === item._id}
        />
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};