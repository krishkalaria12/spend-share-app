import React, { useState, useCallback } from 'react';
import { Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteAllExpenses, getAllExpensesByCategory, getExpenseComparison } from '@/actions/expense.actions';
import ServerError from '@/components/ServerError';
import ToastManager from 'toastify-react-native';
import { ExpenseComparison } from '@/components/expense/ExpenseComparision';
import { ExpenseCategoryTabs } from '@/components/expense/ListExpense';
import { TouchableOpacity } from 'react-native';
import { ChartPieIcon, PlusIcon, TrashIcon } from 'react-native-heroicons/outline';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

const Expense = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [refreshing, setRefreshing] = useState(false);

  const { getToken, userId } = useAuth();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch expenses by category
  const { data: expensesData, isLoading: loadingExpenses, isError: errorExpenses, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', page],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) {
        throw new Error("Authentication required");
      }
      return getAllExpensesByCategory(page, limit, token, userId);
    },
    retry: false,
  });

  // Fetch expense comparison
  const { data: expenseComparison, isLoading: loadingComparison, isError: errorComparison, refetch: refetchComparison } = useQuery({
    queryKey: ['expense-comparison'],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) {
        throw new Error("Authentication required");
      }
      return getExpenseComparison(token, userId);
    },
    retry: false,
  });

  const handleDeleteAll = () => {
    setDeleteModalVisible(true);
  };

  const confirmDeleteAll = () => {
    setDeleteModalVisible(false);
    deleteAllMutation.mutate();
  };

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return deleteAllExpenses(token, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-comparison'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'All expenses deleted successfully',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || "Error deleting expenses",
      });
    },
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refetchExpenses(), refetchComparison()]).finally(() => setRefreshing(false));
  }, [refetchExpenses, refetchComparison]);

  if (errorExpenses || errorComparison) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 pt-4">
        <ScrollView
          className="flex-1 px-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <ServerError />
          <Text className="mt-4 text-center text-lg font-semibold text-gray-600">
            Pull to refresh and try again!
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loadingExpenses || loadingComparison || refreshing) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
        <View className="flex items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-lg font-semibold text-gray-600">Loading expenses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 pt-6">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 80 }} // Add padding to avoid overlap at the bottom
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ToastManager height={100} width={350} />
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-JakartaExtraBold text-secondary-900">
            Expenses
          </Text>
          <TouchableOpacity
            onPress={() => router.navigate("/(root)/add-expense")}
            className="bg-primary-500 p-3 rounded-full shadow-md"
          >
            <PlusIcon size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between mb-6">
          <TouchableOpacity
            onPress={handleDeleteAll}
            className="bg-danger-500 py-2 px-4 rounded-full shadow-md flex-row items-center"
          >
            <TrashIcon size={20} color="white" />
            <Text className="text-white font-JakartaBold ml-2">Delete All Expenses</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {/* Implement visualize function */}}
            className="bg-primary-500 py-2 px-4 rounded-full shadow-md flex-row items-center"
          >
            <ChartPieIcon size={20} color="white" />
            <Text className="text-white font-JakartaBold ml-2">Visualize</Text>
          </TouchableOpacity>
        </View>

        {expenseComparison && (
          <View className="mb-6">
            <ExpenseComparison data={expenseComparison} />
          </View>
        )}

        <View className="mb-6">
          {expensesData && <ExpenseCategoryTabs data={{ expenses: expensesData.expenses }} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Expense;
