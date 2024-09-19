import React, { useState } from 'react'
import { getAllExpensesByCategory, getExpenseComparison } from '@/actions/expense.actions';
import ServerError from '@/components/ServerError';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

const Expense = () => {
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data: expensesData, isLoading: loadingExpenses, isError: errorExpenses, isFetching: fetchingExpenses } = useQuery({
        queryKey: ['expenses', page],
        queryFn: () => getAllExpensesByCategory(page, limit),
        placeholderData: (previousData) => previousData,
    });

    const { data: expenseComparison, isLoading: loadingComparison, isError: errorExpenseComparison } = useQuery({
        queryKey: ['expense-comparison'],
        queryFn: getExpenseComparison,
    });
    
    if (loadingExpenses || loadingComparison) {
        return (
            <View>
                <Text className='text-center font-bold font-JakartaBold text-2xl'>Loading...</Text>
            </View>
        )
    }
    
    if (errorExpenses || errorExpenseComparison) {
        return <ServerError />;
    }
    
    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= (expensesData?.totalPages || 1)) {
            setPage(newPage);
        }
    };

    console.log(expenseComparison, expensesData);

    return (
        <View className={`flex-1 bg-muted/40`}>
          <ScrollView className={`flex-grow p-4`}>
            <View className={`grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-3`}>
              <View className={`flex flex-col sm:grid gap-4 sm:grid-cols-1 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4`}>
                
    
                {/* Expense Comparison Section
                {expenseComparison && (
                  <ExpenseComparison data={expenseComparison} />
                )} */}
              </View>
    
              {/* List Expenses */}
              {/* {expensesData && expensesData.expenses.length > 0 ? (
                <ListExpense expenses={expensesData.expenses} />
              ) : (
                <Text className={`text-center text-3xl font-bold tracking-tighter sm:text-3xl md:text-4xl`}>
                  No expenses Found! Add your expense now to get started.
                </Text>
              )} */}
    
              {/* Pagination is excluded as requested */}
    
              {/* Loading Indicator */}
              {fetchingExpenses && <ActivityIndicator size="large" color="#0000ff" />}
            </View>
          </ScrollView>
        </View>
      );
}

export default Expense