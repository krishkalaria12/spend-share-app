import { ExpenseCategory } from "@/types/types";

export const getAllExpensesByCategory = async (
    page: number, 
    limit: number
): Promise<{
    expenses: ExpenseCategory[],
    totalPages: number,
    currentPage: number,
}> => {
    try {
        const response = await fetch(`/(api)/expense/get-expenses-of-user-by-category?page=${page}&limit=${limit}`);
        
        // Check if the response is successful
        if (!response.ok) {
            throw new Error(`Error fetching expenses: ${response.statusText}`);
        }
    
        const data = await response.json(); // Parse the JSON response
        return data.data; // Assuming `data.data` contains the required fields
    } catch (error) {
        console.error("Failed to fetch expenses by category", error);
        throw error; // Rethrow error for handling elsewhere
    }
};

export const getExpenseComparison = async () => {
    try {
        const response = await fetch(`/(api)/expense/get-expense-by-comparison`);
        
        // Check if the response is successful
        if (!response.ok) {
            throw new Error(`Error fetching expense comparison: ${response.statusText}`);
        }

        const data = await response.json(); // Parse the JSON response
        return data.data; // Assuming `data.data` contains the comparison data
    } catch (error) {
        console.error("Failed to fetch expense comparison", error);
        throw error; // Rethrow error for handling elsewhere
    }
};