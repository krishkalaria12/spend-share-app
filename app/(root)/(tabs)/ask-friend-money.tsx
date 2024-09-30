import React, { useState, useCallback, useMemo } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { getOwesToUsers, getMoneyFromUser, payFriend, deleteOwe } from '@/actions/owe.actions';
import { OweList } from '@/components/owe/OweList';
import { MoneyOwedList } from '@/components/owe/MoneyOwedList';
import Toast from 'react-native-toast-message';
import { Feather } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Owe } from '@/types/types';

type TabButtonProps = {
  title: string;
  isActive: boolean;
  onPress: () => void;
};

// Custom hooks with type safety
const useOwesQuery = (getToken: () => Promise<string | null>, userId: string | null | undefined) => {
  return useQuery<Owe[], Error>({
    queryKey: ["owes"],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return getOwesToUsers(token, userId);
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes caching
  });
};

const useMoneyOwedQuery = (getToken: () => Promise<string | null>, userId: string | null | undefined) => {
  return useQuery<Owe[], Error>({
    queryKey: ["moneyOwed"],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return getMoneyFromUser(token, userId);
    },
  });
};

// Memoized components
const TabButton: React.FC<TabButtonProps> = React.memo(({ title, isActive, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-1 py-3 ${isActive ? 'bg-primary-500 shadow-md' : ''} rounded-full`}
  >
    <Text className={`text-center font-JakartaMedium ${isActive ? 'text-white' : 'text-primary-500'}`}>{title}</Text>
  </TouchableOpacity>
));

const AskFriendPage: React.FC = () => {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const [payingOweId, setPayingOweId] = useState<string | null>(null);
  const [deletingOweId, setDeletingOweId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pendingOwes' | 'confirmedOwes'>('pendingOwes');
  const [activeMoneyOwedTab, setActiveMoneyOwedTab] = useState<'pendingMoneyOwed' | 'confirmedMoneyOwed'>('pendingMoneyOwed');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const { data: owes, isLoading: loadingOwes, isError: errorOwes, refetch: refetchOwes } = useOwesQuery(getToken, userId);
  const { data: moneyOwed, isLoading: loadingMoneyOwed, isError: errorMoneyOwed, refetch: refetchMoneyOwed } = useMoneyOwedQuery(getToken, userId);

  const payOweMutation = useMutation<void, Error, string>({
    mutationFn: async (oweId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return payFriend(oweId, token, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owes", "moneyOwed"] });
      Toast.show({
        type: 'success',
        text1: 'Successfully paid friend',
        text2: 'The debt has been marked as paid.',
      });
      setPayingOweId(null);
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to mark debt as paid. Please try again later.',
      });
      setPayingOweId(null);
    },
  });

  const deleteOweMutation = useMutation<void, Error, string>({
    mutationFn: async (oweId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return deleteOwe(oweId, token, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moneyOwed", "owes"] });
      Toast.show({
        type: 'success',
        text1: 'Owe deleted successfully',
        text2: 'The transaction has been deleted.',
      });
      setDeletingOweId(null);
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to delete transaction. Please try again later.',
      });
      setDeletingOweId(null);
    },
  });

  const handlePayOwe = useCallback((oweId: string) => {
    setPayingOweId(oweId);
    payOweMutation.mutate(oweId);
  }, [payOweMutation]);

  const handleDeleteOwe = useCallback((oweId: string) => {
    setDeletingOweId(oweId);
    deleteOweMutation.mutate(oweId);
  }, [deleteOweMutation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchOwes(), refetchMoneyOwed()]);
    setRefreshing(false);
  }, [refetchOwes, refetchMoneyOwed]);

  const { pendingOwes, confirmedOwes, pendingMoneyOwed, confirmedMoneyOwed } = useMemo(() => ({
    pendingOwes: owes?.filter((owe) => !owe.paid) || [],
    confirmedOwes: owes?.filter((owe) => owe.paid) || [],
    pendingMoneyOwed: moneyOwed?.filter((owe) => !owe.paid) || [],
    confirmedMoneyOwed: moneyOwed?.filter((owe) => owe.paid) || [],
  }), [owes, moneyOwed]);

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

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 pt-8 bg-primary-100">
        <StatusBar barStyle="dark-content" />
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
              <TabButton
                title="Pending"
                isActive={activeTab === 'pendingOwes'}
                onPress={() => setActiveTab('pendingOwes')}
              />
              <TabButton
                title="Paid"
                isActive={activeTab === 'confirmedOwes'}
                onPress={() => setActiveTab('confirmedOwes')}
              />
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
              <TabButton
                title="To be Paid"
                isActive={activeMoneyOwedTab === 'pendingMoneyOwed'}
                onPress={() => setActiveMoneyOwedTab('pendingMoneyOwed')}
              />
              <TabButton
                title="Paid"
                isActive={activeMoneyOwedTab === 'confirmedMoneyOwed'}
                onPress={() => setActiveMoneyOwedTab('confirmedMoneyOwed')}
              />
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

export default React.memo(AskFriendPage);