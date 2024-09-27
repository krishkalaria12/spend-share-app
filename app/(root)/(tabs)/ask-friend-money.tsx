import React, { useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { getOwesToUsers, getMoneyFromUser, payFriend, deleteOwe } from '@/actions/owe.actions';
import { OweList } from '@/components/owe/OweList';
import { MoneyOwedList } from '@/components/owe/MoneyOwedList';
import Toast from 'react-native-toast-message';
import { Feather } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const AskFriendPage = () => {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const [payingOweId, setPayingOweId] = useState<string | null>(null);
  const [deletingOweId, setDeletingOweId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pendingOwes');
  const [activeMoneyOwedTab, setActiveMoneyOwedTab] = useState('pendingMoneyOwed');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchOwes = async () => {
    const token = await getToken();
    if (!token || !userId) throw new Error("Authentication required");
    return getOwesToUsers(token, userId);
  };

  const fetchMoneyOwed = async () => {
    const token = await getToken();
    if (!token || !userId) throw new Error("Authentication required");
    return getMoneyFromUser(token, userId);
  };

  const { data: owes, isLoading: loadingOwes, isError: errorOwes, refetch: refetchOwes } = useQuery({
    queryKey: ["owes"],
    queryFn: fetchOwes,
  });

  const { data: moneyOwed, isLoading: loadingMoneyOwed, isError: errorMoneyOwed, refetch: refetchMoneyOwed } = useQuery({
    queryKey: ["moneyOwed"],
    queryFn: fetchMoneyOwed,
  });

  const payOweMutation = useMutation({
    mutationFn: async (oweId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return payFriend(oweId, token, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owes"] });
      queryClient.invalidateQueries({ queryKey: ["moneyOwed"] });
      Toast.show({
        type: 'success',
        text1: 'Successfully paid friend',
        text2: 'The debt has been marked as paid.',
      });
      setPayingOweId(null);
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to mark debt as paid. Please try again later.',
      });
      setPayingOweId(null);
    },
  });

  const deleteOweMutation = useMutation({
    mutationFn: async (oweId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return deleteOwe(oweId, token, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moneyOwed"] });
      queryClient.invalidateQueries({ queryKey: ["owes"] });
      Toast.show({
        type: 'success',
        text1: 'Owe deleted successfully',
        text2: 'The transaction has been deleted.',
      });
      setDeletingOweId(null);
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to delete transaction. Please try again later.',
      });
      setDeletingOweId(null);
    },
  });

  const handlePayOwe = (oweId: string) => {
    setPayingOweId(oweId);
    payOweMutation.mutate(oweId);
  };

  const handleDeleteOwe = (oweId: string) => {
    setDeletingOweId(oweId);
    deleteOweMutation.mutate(oweId);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchOwes(), refetchMoneyOwed()]);
    setRefreshing(false);
  }, [refetchOwes, refetchMoneyOwed]);

  if (loadingOwes || loadingMoneyOwed) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-primary-100">
        <ActivityIndicator size="large" color="#0286FF" />
        <Text className="mt-4 text-primary-500 font-JakartaMedium">Loading data...</Text>
      </SafeAreaView>
    );
  }

  if (errorOwes || errorMoneyOwed) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-primary-100">
        <Text className="text-danger-500 font-JakartaBold">Error fetching data</Text>
        <TouchableOpacity
          onPress={onRefresh}
          className="mt-4 bg-primary-500 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-JakartaSemiBold">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const pendingOwes = owes?.filter((owe) => !owe.paid) || [];
  const confirmedOwes = owes?.filter((owe) => owe.paid) || [];
  const pendingMoneyOwed = moneyOwed?.filter((owe) => !owe.paid) || [];
  const confirmedMoneyOwed = moneyOwed?.filter((owe) => owe.paid) || [];

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 pt-8 bg-primary-100">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0286FF"]} />
          }
        >
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl w-4/5 font-JakartaBold text-primary-900">Your Money Management</Text>
            <TouchableOpacity onPress={() => router.push("/(root)/ask-friend-money/ask")} className="bg-primary-500 p-3 rounded-full shadow-md">
              <Feather name="plus" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View className="mb-8">
            <Text className="text-xl font-JakartaSemiBold mb-4 text-primary-800">Transactions to Pay</Text>
            <View className="flex-row mb-4 bg-primary-200 p-1 rounded-full">
              <TouchableOpacity
                onPress={() => setActiveTab('pendingOwes')}
                className={`flex-1 py-3 ${activeTab === 'pendingOwes' ? 'bg-primary-500 shadow-md' : ''} rounded-full`}
              >
                <Text className={`text-center font-JakartaMedium ${activeTab === 'pendingOwes' ? 'text-white' : 'text-primary-500'}`}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('confirmedOwes')}
                className={`flex-1 py-3 ${activeTab === 'confirmedOwes' ? 'bg-primary-500 shadow-md' : ''} rounded-full`}
              >
                <Text className={`text-center font-JakartaMedium ${activeTab === 'confirmedOwes' ? 'text-white' : 'text-primary-500'}`}>Paid</Text>
              </TouchableOpacity>
            </View>
            <View className="min-h-[100px]">
              <OweList
                owes={activeTab === 'pendingOwes' ? pendingOwes : confirmedOwes}
                payOwe={handlePayOwe}
                isPayOweLoading={payOweMutation.isPending}
                payingOweId={payingOweId}
              />
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-xl font-JakartaSemiBold mb-4 text-primary-800">Owes Remaining</Text>
            <View className="flex-row mb-4 bg-primary-200 p-1 rounded-full">
              <TouchableOpacity
                onPress={() => setActiveMoneyOwedTab('pendingMoneyOwed')}
                className={`flex-1 py-3 ${activeMoneyOwedTab === 'pendingMoneyOwed' ? 'bg-primary-500 shadow-md' : ''} rounded-full`}
              >
                <Text className={`text-center font-JakartaMedium ${activeMoneyOwedTab === 'pendingMoneyOwed' ? 'text-white' : 'text-primary-500'}`}>To be Paid</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveMoneyOwedTab('confirmedMoneyOwed')}
                className={`flex-1 py-3 ${activeMoneyOwedTab === 'confirmedMoneyOwed' ? 'bg-primary-500 shadow-md' : ''} rounded-full`}
              >
                <Text className={`text-center font-JakartaMedium ${activeMoneyOwedTab === 'confirmedMoneyOwed' ? 'text-white' : 'text-primary-500'}`}>Paid</Text>
              </TouchableOpacity>
            </View>
            <View className="min-h-[100px]">
              <MoneyOwedList
                moneyOwed={activeMoneyOwedTab === 'pendingMoneyOwed' ? pendingMoneyOwed : confirmedMoneyOwed}
                deleteOwe={handleDeleteOwe}
                isDeleteOweLoading={deleteOweMutation.isPending}
                deletingOweId={deletingOweId}
              />
            </View>
          </View>
        </ScrollView>
        <Toast />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default AskFriendPage;