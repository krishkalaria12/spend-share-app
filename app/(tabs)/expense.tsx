import React, { useState, useCallback } from 'react';
import { Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllExpensesByCategory, getExpenseComparison } from '@/actions/expense.actions';
import ServerError from '@/components/ServerError';
import ToastManager from 'toastify-react-native';
import { ExpenseComparison } from '@/components/expense/ExpenseComparision';
import { ExpenseCategoryTabs } from '@/components/expense/ListExpense';

const Expense = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [refreshing, setRefreshing] = useState(false);

  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

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
        contentContainerStyle={{ paddingBottom: 50 }} // Add padding to avoid overlap at the bottom
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ToastManager height={100} width={350} />
        <Text className="text-3xl font-JakartaExtraBold font-bold mb-6 text-gray-800">
          Expenses Overview
        </Text>

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
