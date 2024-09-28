import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Text, Animated, TouchableOpacity, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { getGroupById, getGroupTransactions } from '@/actions/group.actions';
import { Group, Transaction } from '@/types/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import GroupSummary from '@/components/group/GroupSummary';
import ServerError from '@/components/ServerError';
import TransactionList from '@/components/group/TransactionList';
import { AlertCircle, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const GroupId = () => {
  const params = useLocalSearchParams();
  const groupId = params.groupId as string;
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { data: group, isLoading: loadingGroup, isError: errorGroup, refetch: refetchGroup } = useQuery<Group>({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return getGroupById(groupId, token, userId);
    },
    enabled: !!groupId,
  });

  const { 
    data: groupTransactions, 
    isLoading: loadingGroupTransactions, 
    isError: errorGroupTransactions,
    refetch: refetchTransactions
  } = useQuery<{
    transactions: Transaction[];
    totalPages: number;
    currentPage: number;
  }>({
    queryKey: ["groupTransactions", groupId, page],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return getGroupTransactions(groupId, token, userId, String(page), String(limit));
    },
    enabled: !!groupId,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchGroup(), refetchTransactions()]);
    setRefreshing(false);
  }, [refetchGroup, refetchTransactions]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (loadingGroup || loadingGroupTransactions) {
    return (
      <LinearGradient
        colors={['#F5F8FF', '#EBF4FF']}
        className="flex-1 justify-center items-center"
      >
        <ActivityIndicator size="large" color="#0286FF" />
        <Animated.Text 
          className="mt-4 text-lg font-JakartaSemiBold text-secondary-700"
          style={{ opacity: fadeAnim }}
        >
          Loading group details...
        </Animated.Text>
      </LinearGradient>
    );
  }

  if (errorGroup || !group || errorGroupTransactions) {
    return (
      <SafeAreaView className="flex-1 bg-general-500">
        <ScrollView 
          className="flex-1 px-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <ServerError />
          <TouchableOpacity 
            className="mt-8 bg-primary-500 py-3 px-6 rounded-full self-center"
            onPress={onRefresh}
          >
            <Text className="text-white font-JakartaBold text-base">Retry</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <LinearGradient
        colors={['#F5F8FF', '#EBF4FF']}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-4 py-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#0286FF" />
          </TouchableOpacity>
          <Text className="text-xl font-JakartaBold text-secondary-900">{group.name}</Text>
          <View style={{ width: 24 }} /> {/* Placeholder for balance */}
        </View>
        <Animated.ScrollView 
          className="flex-1"
          style={{ opacity: fadeAnim }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="px-4 py-6">
            <GroupSummary group={group} />
          </View>

          {groupTransactions && (
            <TransactionList
              transactions={groupTransactions.transactions}
              totalPages={groupTransactions.totalPages}
              currentPage={groupTransactions.currentPage}
              isLoading={loadingGroupTransactions}
              onPageChange={(newPage) => setPage(newPage)}
              groupId={groupId}
              currentUserId={userId}
            />
          )}
        </Animated.ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default GroupId;