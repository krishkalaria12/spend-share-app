import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, FlatList, SafeAreaView } from 'react-native';
import { formatDate } from '@/utils/formatDate';
import { Transaction } from '@/types/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payFriend } from '@/actions/owe.actions';
import { useAuth } from '@clerk/clerk-expo';
import { X, CheckCircle, AlertCircle, User, IndianRupee, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TransactionCardProps {
  transaction: Transaction;
  currentUserId: string | null | undefined;
}

const TransactionCard: React.FC<TransactionCardProps> = React.memo(({ transaction, currentUserId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<'paid' | 'unpaid'>('paid');
  const queryClient = useQueryClient();
  const { userId, getToken } = useAuth();

  const currentUserOwe = useMemo(
    () =>
      transaction.owes.find(
        (owe: { debtor: { clerkId: string | null | undefined } }) => owe.debtor.clerkId === currentUserId
      ),
    [transaction.owes, currentUserId]
  );

  const payFriendMutation = useMutation({
    mutationFn: async (oweId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error('Authentication required');
      return payFriend(userId, token, oweId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupTransactions'] });
    },
    onError: (error: any) => {
      console.error('Payment failed:', error);
    }
  });

  const handlePay = useCallback(() => {
    if (currentUserOwe) {
      setIsLoading(true);
      payFriendMutation.mutate(currentUserOwe._id, {
        onSettled: () => setIsLoading(false)
      });
    }
  }, [currentUserOwe, payFriendMutation]);

  const handleOpenModal = useCallback((content: 'paid' | 'unpaid') => {
    setModalContent(content);
    setModalVisible(true);
  }, []);

  const renderMemberItem = useCallback(
    ({ item }: { item: Transaction['owes'][0] }) => (
      <View className="flex-row items-center p-4 border-b border-general-700">
        <Image source={{ uri: item.debtor.avatar }} className="w-12 h-12 rounded-full mr-4" />
        <View className="flex-1">
          <Text className="text-lg font-JakartaSemiBold text-secondary-800">{item.debtor.fullName}</Text>
          <Text className="text-sm font-JakartaMedium text-secondary-500">₹{item.amount.toFixed(2)}</Text>
        </View>
        {item.paid ? <CheckCircle size={24} color="#38A169" /> : <AlertCircle size={24} color="#E53E3E" />}
      </View>
    ),
    []
  );

  const memoizedMemberList = useMemo(
    () => (
      <FlatList
        data={transaction.owes.filter((owe: { paid: boolean }) => (modalContent === 'paid' ? owe.paid : !owe.paid))}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item._id}
        className="p-4"
      />
    ),
    [transaction.owes, modalContent, renderMemberItem]
  );

  return (
    <LinearGradient colors={['#FFFFFF', '#F5F8FF']} className="rounded-2xl p-5 mb-6 shadow-lg">
      <View className="flex-row items-center mb-4">
        <Image source={{ uri: transaction.creditor.avatar }} className="w-14 h-14 rounded-full" />
        <View className="ml-4 flex-1">
          <Text className="text-xl font-JakartaBold text-secondary-900">{transaction.creditor.username}</Text>
          <Text className="text-sm font-JakartaMedium text-secondary-500">{formatDate(transaction.createdAt)}</Text>
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-lg font-JakartaSemiBold text-secondary-800">{transaction.title}</Text>
        <Text className="text-sm font-JakartaMedium text-secondary-600">{transaction.category}</Text>
      </View>

      <View className="flex-row justify-between mb-6">
        <View className="flex-row items-center">
          <View className="bg-primary-100 p-2 rounded-full mr-3">
            <IndianRupee size={24} color="#0286FF" />
          </View>
          <View>
            <Text className="text-sm font-JakartaMedium text-secondary-500">Total Amount</Text>
            <Text className="text-xl font-JakartaBold text-secondary-900">₹{transaction.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <View className="bg-primary-100 p-2 rounded-full mr-3">
            <User size={24} color="#0286FF" />
          </View>
          <View>
            <Text className="text-sm font-JakartaMedium text-secondary-500">Your Share</Text>
            <Text className="text-xl font-JakartaBold text-secondary-900">
              ₹{currentUserOwe ? currentUserOwe.amount.toFixed(2) : '0.00'}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-full mr-2 ${
            currentUserOwe?.paid || isLoading ? 'bg-success-200' : 'bg-primary-500'
          }`}
          onPress={handlePay}
          disabled={currentUserOwe?.paid || isLoading}
        >
          <Text
            className={`text-center font-JakartaBold text-base ${
              currentUserOwe?.paid || isLoading ? 'text-success-700' : 'text-white'
            }`}
          >
            {isLoading ? 'Processing...' : currentUserOwe?.paid ? 'Paid' : 'Pay'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-1 py-3 bg-general-600 rounded-full ml-2" onPress={() => handleOpenModal('paid')}>
          <Text className="text-center font-JakartaBold text-base text-secondary-800">Paid Members</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity className="py-3 bg-warning-200 rounded-full" onPress={() => handleOpenModal('unpaid')}>
        <Text className="text-center font-JakartaBold text-base text-warning-800">Unpaid Members</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView className="flex-1 bg-white mt-20 rounded-t-3xl">
          <LinearGradient colors={['#F5F8FF', '#EBF4FF']} className="flex-1 rounded-t-3xl">
            <View className="flex-row justify-between items-center p-5 border-b border-general-700">
              <View className="flex-row items-center">
                <Users size={24} color="#0286FF" />
                <Text className="text-lg font-JakartaBold text-secondary-900 ml-3">
                  {modalContent === 'paid' ? 'Paid Members' : 'Unpaid Members'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={28} color="#4A5568" />
              </TouchableOpacity>
            </View>
            {memoizedMemberList}
          </LinearGradient>
        </SafeAreaView>
      </Modal>
    </LinearGradient>
  );
});

export default TransactionCard;