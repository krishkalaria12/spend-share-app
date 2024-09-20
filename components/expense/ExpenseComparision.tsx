import React from 'react';
import { View, Text } from 'react-native';
import * as Progress from 'react-native-progress';
import { ExpenseComparisonProps } from '@/types/types';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, CalendarIcon } from 'react-native-heroicons/outline';

export const ExpenseComparison: React.FC<ExpenseComparisonProps> = ({ data }) => {
  const weekPercentage = parseFloat(data.percentageComparison.week.replace('%', '')) / 100;
  const monthPercentage = parseFloat(data.percentageComparison.month.replace('%', '')) / 100;

  const valueForWeek = weekPercentage > 0 ? weekPercentage : 0;
  const valueForMonth = monthPercentage > 0 ? monthPercentage : 0;

  const renderTrendIcon = (percentage: string) => {
    const value = parseFloat(percentage);
    if (value > 0) {
      return <ArrowTrendingUpIcon size={20} color="#EF4444" />;
    } else if (value < 0) {
      return <ArrowTrendingDownIcon size={20} color="#10B981" />;
    }
    return null;
  };

  const getPercentageColor = (percentage: string) => {
    const value = parseFloat(percentage);
    if (value > 0) return "text-red-500";
    if (value < 0) return "text-green-500";
    return "text-gray-500";
  };

  return (
    <View className="px-4 py-2">
      {/* This Week Card */}
      <View className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xl font-JakartaSemiBold text-gray-700">This Week</Text>
          <CalendarIcon size={24} color="#6B7280" />
        </View>
        <Text className="text-4xl font-JakartaBold text-primary-600 mb-2">₹{data.weekExpense}</Text>
        <View className="flex-row items-center">
          {renderTrendIcon(data.percentageComparison.week)}
          <Text className={`text-sm ${getPercentageColor(data.percentageComparison.week)} ml-1`}>
            {data.percentageComparison.week} from last week
          </Text>
        </View>
        <Progress.Bar
          progress={valueForWeek}
          width={null}
          color="#3B82F6"
          unfilledColor="#EBF4FF"
          borderWidth={0}
          height={6}
          borderRadius={3}
          className="mt-3"
        />
      </View>

      {/* This Month Card */}
      <View className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xl font-JakartaSemiBold text-gray-700">This Month</Text>
          <CalendarIcon size={24} color="#6B7280" />
        </View>
        <Text className="text-4xl font-JakartaBold text-primary-600 mb-2">₹{data.monthExpense}</Text>
        <View className="flex-row items-center">
          {renderTrendIcon(data.percentageComparison.month)}
          <Text className={`text-sm ${getPercentageColor(data.percentageComparison.month)} ml-1`}>
            {data.percentageComparison.month} from last month
          </Text>
        </View>
        <Progress.Bar
          progress={valueForMonth}
          width={null}
          color="#3B82F6"
          unfilledColor="#EBF4FF"
          borderWidth={0}
          height={6}
          borderRadius={3}
          className="mt-3"
        />
      </View>

      {/* Overall Expenses Card */}
      <View className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
        <Text className="text-xl font-JakartaSemiBold text-gray-700 mb-2">Overall Expenses</Text>
        <Text className="text-4xl font-JakartaBold text-primary-600 mb-4">₹{data.overallExpenseAmount}</Text>
        <View className="bg-gray-100 rounded-lg p-4">
          <Text className="text-sm text-gray-600 italic font-JakartaMedium text-center">
            "Mindful spending leads to financial freedom."
          </Text>
        </View>
      </View>
    </View>
  );
};