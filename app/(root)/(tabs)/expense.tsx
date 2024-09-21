import React, { useState, useCallback, useMemo } from 'react';
import { Text, View, ScrollView, RefreshControl, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteAllExpenses, getAllExpenses, getExpensePagination, getExpenseComparison } from '@/actions/expense.actions';
import ServerError from '@/components/ServerError';
import ToastManager from 'toastify-react-native';
import { ExpenseComparison } from '@/components/expense/ExpenseComparision';
import { ExpenseCategoryTabs } from '@/components/expense/ListExpense';
import { ChartPieIcon, PlusIcon, TrashIcon } from 'react-native-heroicons/outline';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

const Expense = () => {
  const [activeCategory, setActiveCategory] = useState<string>('Food');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch all expenses
  const { data: expensesData, isLoading: loadingExpenses, isError: errorExpenses, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) {
        throw new Error("Authentication required");
      }
      return getAllExpenses(token, userId);
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

  const handlePageChange = async (newPage: number) => {
    const activeCategoryData = expensesData?.expenses.find((cat: { category: string; }) => cat.category === activeCategory);
    
    if (!activeCategoryData) return;

    // If we're moving to a page we've already loaded, don't fetch new data
    if (newPage <= activeCategoryData.currentPage) {
      queryClient.setQueryData(['expenses'], (oldData: any) => ({
        ...oldData,
        expenses: oldData.expenses.map((cat: any) => 
          cat.category === activeCategory 
            ? { ...cat, currentPage: newPage }
            : cat
        )
      }));
      return;
    }

    setLoadingMore(true);
    try {
      const token = await getToken();
      if (!token || !userId) {
        throw new Error("Authentication required");
      }
      const newExpenses = await getExpensePagination(newPage, 10, token, userId, activeCategory);
      queryClient.setQueryData(['expenses'], (oldData: any) => ({
        ...oldData,
        expenses: oldData.expenses.map((cat: any) => 
          cat.category === activeCategory 
            ? { 
                ...cat, 
                currentPage: newPage, 
                expenses: [...cat.expenses, ...newExpenses.expenses],
                totalPages: newExpenses.totalPages
              }
            : cat
        )
      }));
    } catch (error) {
      console.error('Error fetching more expenses:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load more expenses',
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  const memoizedExpensesData = useMemo(() => {
    if (!expensesData) return null;
    return {
      ...expensesData,
      expenses: expensesData.expenses.map((category: { expenses: string | any[]; currentPage: number; }) => ({
        ...category,
        expenses: category.expenses.slice(0, category.currentPage * 10) // Only show loaded expenses
      }))
    };
  }, [expensesData]);

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
        contentContainerStyle={{ paddingBottom: 80 }}
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
            onPress={() => router.push("/(root)/add-expense")}
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
        {memoizedExpensesData && (
          <ExpenseCategoryTabs 
            data={memoizedExpensesData.expenses}
            onPageChange={handlePageChange}
            onCategoryChange={handleCategoryChange}
            activeCategory={activeCategory}
            loadingMore={loadingMore}
          />
        )}
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white p-6 rounded-lg shadow-lg w-4/5">
            <Text className="text-xl font-JakartaBold mb-4 text-center">
              Confirm Delete
            </Text>
            <Text className="text-base mb-6 text-center">
              Are you sure you want to delete all expenses? This action cannot be undone.
            </Text>
            <View className="flex-row justify-around">
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                className="bg-gray-300 py-2 px-4 rounded-full"
              >
                <Text className="text-black font-JakartaBold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeleteAll}
                className="bg-danger-500 py-2 px-4 rounded-full"
              >
                <Text className="text-white font-JakartaBold">Delete All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Expense;