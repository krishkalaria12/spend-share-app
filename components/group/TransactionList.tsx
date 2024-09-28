import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import TransactionCard from '@/components/group/TransactionCard';
import { Transaction } from '@/types/types';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react-native';

interface TransactionListProps {
  transactions: Transaction[];
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  groupId: string;
  currentUserId: string | null | undefined;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  totalPages,
  currentPage,
  isLoading,
  onPageChange,
  groupId,
  currentUserId,
}) => {
  const router = useRouter();

  const renderTransactionCard = ({ item }: { item: Transaction }) => (
    <TransactionCard transaction={item} currentUserId={currentUserId} />
  );

  const renderPagination = () => (
    <View className="flex-row justify-center items-center mt-6 mb-8">
      <TouchableOpacity
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex-row items-center ${currentPage === 1 ? 'opacity-50' : ''}`}
      >
        <ChevronLeft size={20} color="#0286FF" />
        <Text className="text-primary-500 font-JakartaMedium ml-1">Previous</Text>
      </TouchableOpacity>
      <Text className="mx-4 text-secondary-700 font-JakartaSemiBold">
        {currentPage} of {totalPages}
      </Text>
      <TouchableOpacity
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex-row items-center ${currentPage === totalPages ? 'opacity-50' : ''}`}
      >
        <Text className="text-primary-500 font-JakartaMedium mr-1">Next</Text>
        <ChevronRight size={20} color="#0286FF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-white rounded-t-3xl px-4 pt-6 shadow-lg">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-JakartaBold text-secondary-900">Transactions</Text>
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/(root)/group/request-money',
            params: { groupId }
          })}
          className="bg-primary-500 px-4 py-3 rounded-full shadow-md active:bg-primary-600 flex-row items-center"
        >
          <PlusCircle size={20} color="white" />
          <Text className="text-white font-JakartaSemiBold ml-2">Request Money</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0286FF" />
          <Text className="mt-4 text-secondary-600 font-JakartaMedium">Loading transactions...</Text>
        </View>
      ) : transactions.length > 0 ? (
        <FlatList
          data={transactions}
          renderItem={renderTransactionCard}
          keyExtractor={(item) => item._id}
          ListFooterComponent={renderPagination}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          className="flex-1"
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text className="text-xl text-secondary-500 font-JakartaMedium text-center">
            No transactions found!
          </Text>
          <Text className="mt-2 text-secondary-400 font-Jakarta text-center">
            Add your transaction now to get started.
          </Text>
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(root)/group/request-money',
              params: { groupId }
            })}
            className="mt-6 bg-primary-500 px-6 py-3 rounded-full shadow-md active:bg-primary-600 flex-row items-center"
          >
            <PlusCircle size={20} color="white" />
            <Text className="text-white font-JakartaSemiBold ml-2">Add Transaction</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default TransactionList;