import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, FlatList, SafeAreaView } from 'react-native';
import { formatDate } from '@/utils/formatDate';
import { Transaction } from '@/types/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payFriend } from '@/actions/owe.actions';
import { useAuth } from '@clerk/clerk-expo';
import { X, CheckCircle, AlertCircle, User, DollarSign } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TransactionCardProps {
  transaction: Transaction;
  currentUserId: string | null | undefined;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, currentUserId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerContent, setDrawerContent] = useState<'paid' | 'unpaid'>('paid');
  const queryClient = useQueryClient();
  const { userId, getToken } = useAuth();

  const currentUserOwe = transaction.owes.find((owe: { debtor: { clerkId: string | null | undefined; }; }) => owe.debtor.clerkId === currentUserId);

  const payFriendMutation = useMutation({
    mutationFn: async(oweId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return payFriend(userId, token, oweId); 
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupTransactions"] });
      // Show a success message here
    },
    onError: (error: any) => {
      // Show an error message here
    }
  });

  const handlePay = () => {
    if (currentUserOwe) {
      setIsLoading(true);
      payFriendMutation.mutate(currentUserOwe._id, {
        onSettled: () => setIsLoading(false),
      });
    }
  };

  const handleDrawer = (content: 'paid' | 'unpaid') => {
    setDrawerContent(content);
    setDrawerVisible(true);
  };

  const renderMemberItem = ({ item }: { item: Transaction['owes'][0] }) => (
    <View className="flex-row items-center p-4 border-b border-general-700">
      <Image
        source={{ uri: item.debtor.avatar }}
        className="w-10 h-10 rounded-full mr-3"
      />
      <Text className="text-secondary-800 font-JakartaMedium flex-1">{item.debtor.fullName}</Text>
      {item.paid ? (
        <CheckCircle size={20} color="#38A169" />
      ) : (
        <AlertCircle size={20} color="#E53E3E" />
      )}
    </View>
  );

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F5F8FF']}
      className="rounded-xl p-4 mb-4 shadow-md"
    >
      <View className="flex-row items-center mb-3">
        <Image
          source={{ uri: transaction.creditor.avatar }}
          className="w-12 h-12 rounded-full"
        />
        <View className="ml-3 flex-1">
          <Text className="text-lg font-JakartaBold text-secondary-900">{transaction.creditor.username}</Text>
          <Text className="text-sm font-Jakarta text-secondary-500">{formatDate(transaction.createdAt)}</Text>
        </View>
      </View>

      <View className="mb-3">
        <Text className="text-lg font-JakartaSemiBold text-secondary-800">{transaction.title}</Text>
        <Text className="text-sm font-Jakarta text-secondary-600">{transaction.category}</Text>
      </View>

      <View className="flex-row justify-between mb-4">
        <View className="flex-row items-center">
          <DollarSign size={20} color="#0286FF" />
          <View className="ml-2">
            <Text className="text-sm font-JakartaMedium text-secondary-500">Total Amount</Text>
            <Text className="text-lg font-JakartaBold text-secondary-900">₹{transaction.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <User size={20} color="#0286FF" />
          <View className="ml-2">
            <Text className="text-sm font-JakartaMedium text-secondary-500">Your Share</Text>
            <Text className="text-lg font-JakartaBold text-secondary-900">₹{currentUserOwe ? currentUserOwe.amount.toFixed(2) : "0.00"}</Text>
          </View>
        </View>
      </View>

      <View className="flex-row justify-between">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-full mr-2 ${currentUserOwe?.paid || isLoading ? 'bg-success-200' : 'bg-primary-500'}`}
          onPress={handlePay}
          disabled={currentUserOwe?.paid || isLoading}
        >
          <Text className={`text-center font-JakartaBold ${currentUserOwe?.paid || isLoading ? 'text-success-700' : 'text-white'}`}>
            {isLoading ? "Processing..." : currentUserOwe?.paid ? "Paid" : "Pay"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-1 py-3 bg-general-600 rounded-full ml-2" 
          onPress={() => handleDrawer('paid')}
        >
          <Text className="text-center font-JakartaBold text-secondary-800">Paid Members</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={drawerVisible}
        onRequestClose={() => setDrawerVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white mt-20 rounded-t-3xl">
          <LinearGradient
            colors={['#F5F8FF', '#EBF4FF']}
            className="flex-1 rounded-t-3xl"
          >
            <View className="flex-row justify-between items-center p-4 border-b border-general-700">
              <Text className="text-xl font-JakartaBold text-secondary-900">
                {drawerContent === 'paid' ? 'Paid Members' : 'Unpaid Members'}
              </Text>
              <TouchableOpacity onPress={() => setDrawerVisible(false)}>
                <X size={24} color="#4A5568" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={transaction.owes.filter((owe: { paid: any; }) => drawerContent === 'paid' ? owe.paid : !owe.paid)}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item._id}
            />
          </LinearGradient>
        </SafeAreaView>
      </Modal>
    </LinearGradient>
  );
};

export default TransactionCard;