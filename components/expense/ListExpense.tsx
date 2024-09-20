import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";

interface ExpenseCategory {
  category: string;
  totalExpense: number;
  expenses: {
    _id: string;
    title: string;
    amount: number;
    description: string;
    createdAt: string;
  }[];
}

interface ExpenseCategoryTabsProps {
  data: {
    expenses: ExpenseCategory[];
  };
}

const CategoryIcon = ({ category }: { category: string }) => {
  const iconMap: {
    [key: string]: keyof typeof MaterialCommunityIcons.glyphMap;
  } = {
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
};

const ExpenseItem = ({ item }: { item: ExpenseCategory['expenses'][0] }) => (
    <View className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-primary-200">
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
    </View>
  );

export const ExpenseCategoryTabs: React.FC<ExpenseCategoryTabsProps> = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const routes = data.expenses.map((cat) => ({
    key: cat.category,
    title: cat.category,
    expenses: cat.expenses,
    totalExpense: cat.totalExpense,
  }));

  const renderTabBar = () => (
    <View className="bg-white shadow-sm mb-4">
      <View className="flex-row">
        {routes.slice(0, 2).map((route, i) => renderTab(route, i))}
      </View>
      <View className="flex-row">
        {routes.slice(2).map((route, i) => renderTab(route, i + 2))}
      </View>
    </View>
  );

  const renderTab = (route: any, index: number) => (
    <TouchableOpacity
      key={index}
      className="flex-1 py-3 px-2 items-center"
      onPress={() => setActiveIndex(index)}
    >
      <View className="flex-row items-center">
        <CategoryIcon category={route.key} />
        <View className="ml-2">
          <Text className="text-sm font-JakartaMedium text-secondary-800">{route.title}</Text>
          <Text className="text-xs font-JakartaBold text-primary-500">₹{route.totalExpense.toFixed(2)}</Text>
        </View>
      </View>
      {activeIndex === index && (
        <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      {renderTabBar()}
      <FlatList
        data={routes[activeIndex].expenses}
        renderItem={({ item }) => <ExpenseItem item={item} />}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
};
