import React, { useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { deleteExpense } from '@/actions/expense.actions';
import Toast from 'react-native-toast-message';

interface Expense {
  _id: string;
  title: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface ExpenseCategory {
  category: string;
  totalExpense: number;
  totalPages: number;
  currentPage: number;
  expenses: Expense[];
}

interface ExpenseCategoryTabsProps {
  data: ExpenseCategory[];
  onPageChange: (page: number) => void;
  onCategoryChange: (category: string) => void;
  activeCategory: string;
  loadingMore: boolean;
}

const CategoryIcon: React.FC<{ category: string }> = React.memo(({ category }) => {
  const iconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    Food: "food",
    Miscellaneous: "package-variant",
    Studies: "school",
    Outing: "walk",
  };

  return (
    <MaterialCommunityIcons
      name={iconMap[category] || "cash"}
      size={24}
      color="#0286FF"
    />
  );
});

const ExpenseItem: React.FC<{ item: Expense; onDelete: (id: string) => void }> = React.memo(({ item, onDelete }) => (
  <View className="bg-white rounded-lg p-4 mb-3 shadow-md border border-primary-200">
    <View className="flex-row justify-between items-center mb-2">
      <View className="flex-1 mr-2">
        <Text className="text-lg font-JakartaSemiBold text-secondary-900 truncate">{item.title}</Text>
      </View>
      <Text className="text-lg font-JakartaBold text-primary-500">₹{item.amount.toFixed(2)}</Text>
    </View>
    <Text className="text-sm font-JakartaMedium text-secondary-700 mb-2 line-clamp-2">{item.description}</Text>
    <View className="flex-row justify-between items-center">
      <Text className="text-xs font-JakartaLight text-secondary-500">
        {format(new Date(item.createdAt), 'dd MMM yyyy')}
      </Text>
      <Text className="text-xs font-JakartaLight text-secondary-500">
        {format(new Date(item.createdAt), 'hh:mm a')}
      </Text>
    </View>
    <TouchableOpacity
      onPress={() => onDelete(item._id)}
      className="absolute top-2 right-2 bg-danger-100 rounded-full p-2"
    >
      <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
    </TouchableOpacity>
  </View>
));

const CustomPagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loadingMore: boolean;
}> = React.memo(({ currentPage, totalPages, onPageChange, loadingMore }) => {
  if (totalPages <= 1) return null;

  return (
    <View className="flex-row justify-center items-center mt-4 mb-8">
      <TouchableOpacity
        onPress={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`mx-1 px-3 py-2 rounded-full ${currentPage === 1 ? 'bg-gray-200' : 'bg-primary-500'}`}
      >
        <MaterialCommunityIcons name="chevron-left" size={20} color={currentPage === 1 ? '#9CA3AF' : 'white'} />
      </TouchableOpacity>
      <Text className="mx-2 text-sm text-secondary-700">
        Page {currentPage} of {totalPages}
      </Text>
      <TouchableOpacity
        onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || loadingMore}
        className={`mx-1 px-3 py-2 rounded-full ${currentPage === totalPages || loadingMore ? 'bg-gray-200' : 'bg-primary-500'}`}
      >
        <MaterialCommunityIcons name="chevron-right" size={20} color={currentPage === totalPages || loadingMore ? '#9CA3AF' : 'white'} />
      </TouchableOpacity>
      {loadingMore && <ActivityIndicator size="small" color="#0286FF" style={{ marginLeft: 10 }} />}
    </View>
  );
});

export const ExpenseCategoryTabs: React.FC<ExpenseCategoryTabsProps> = React.memo(({ 
  data, 
  onPageChange, 
  onCategoryChange, 
  activeCategory,
  loadingMore
}) => {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return deleteExpense(expenseId, token, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Expense deleted successfully',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || "Error deleting expense",
      });
    },
  });

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => deleteMutation.mutate(id), style: "destructive" }
      ]
    );
  }, [deleteMutation]);

  // Split categories into 2 rows
  const row1Categories = useMemo(() => data.slice(0, 2), [data]);
  const row2Categories = useMemo(() => data.slice(2), [data]);

  const renderTab = useCallback((category: ExpenseCategory) => (
    <TouchableOpacity
      className={`py-3 px-4 items-center ${activeCategory === category.category ? 'border-b-2 border-primary-500' : ''}`}
      onPress={() => onCategoryChange(category.category)}
    >
      <View className="flex-row items-center">
        <CategoryIcon category={category.category} />
        <View className="ml-2">
          <Text className={`text-sm font-JakartaMedium ${activeCategory === category.category ? 'text-primary-500' : 'text-secondary-800'}`}>{category.category}</Text>
          <Text className="text-xs font-JakartaBold text-primary-500">₹{category.totalExpense.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [activeCategory, onCategoryChange]);

  const renderTabBar = useCallback(() => (
    <View className="bg-white shadow-sm mb-4 rounded-lg">
      {/* First row */}
      <FlatList
        data={row1Categories}
        renderItem={({ item }) => renderTab(item)}
        keyExtractor={(item) => item.category}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      />
      {/* Second row */}
      <FlatList
        data={row2Categories}
        renderItem={({ item }) => renderTab(item)}
        keyExtractor={(item) => item.category}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      />
    </View>
  ), [row1Categories, row2Categories, renderTab]);

  const activeData = useMemo(() => data.find(cat => cat.category === activeCategory), [data, activeCategory]);

  const renderExpenseItem = useCallback(({ item }: { item: Expense }) => (
    <ExpenseItem item={item} onDelete={handleDelete} />
  ), [handleDelete]);

  return (
    <View style={{ flex: 1 }}>
      {renderTabBar()}
      {deleteMutation.isPending && (
        <View className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <ActivityIndicator size="large" color="#0286FF" />
        </View>
      )}
      {activeData && (
        <>
          <FlatList
            data={activeData.expenses}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={() => (
              <Text className="text-center text-secondary-500 mt-4">No expenses found for this category.</Text>
            )}
          />
          <CustomPagination
            currentPage={activeData.currentPage}
            totalPages={activeData.totalPages}
            onPageChange={onPageChange}
            loadingMore={loadingMore}
          />
        </>
      )}
    </View>
  );
});