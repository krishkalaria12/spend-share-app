import React, { useMemo, useCallback } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InputField } from '@/components/InputField';
import { CustomButton } from '@/components/CustomButton';
import { addExpense } from '@/actions/expense.actions';
import { useAuth } from '@clerk/clerk-expo';
import { ExclamationTriangleIcon } from 'react-native-heroicons/outline';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const categories = ["Food", "Studies", "Outing", "Miscellaneous"] as const;

const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Amount must be a valid number with up to 2 decimal places" }),
    description: z.string().max(200, { message: "Description should be less than 200 characters" }),
    category: z.enum(categories, { required_error: "Category is required" }),
});

type FormData = z.infer<typeof formSchema>;

const AddExpense: React.FC = () => {
    const { getToken, userId } = useAuth();
    const queryClient = useQueryClient();
    const router = useRouter();

    const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            amount: '',
            description: '',
            category: categories[0],
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: FormData) => {
            const token = await getToken();
            if (!token || !userId) throw new Error("Authentication required");
            return addExpense(data, token, userId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense-comparison'] });
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Expense added successfully',
                position: 'top'
            });
            reset();
            setTimeout(() => {
                router.replace("/(root)/(tabs)/expense");
            }, 2000);
        },
        onError: (error: Error) => {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || "Error adding expense",
                position: 'top',
            });
        },
    });

    const onSubmit = useCallback((data: FormData) => {
        mutation.mutate(data);
    }, [mutation]);

    const renderErrors = useMemo(() => {
        const errorMessages = Object.values(errors).map(error => error?.message);
        if (errorMessages.length === 0) return null;

        return (
            <View className="bg-red-100 p-4 rounded-xl mt-4">
                <View className="flex-row items-center mb-2">
                    <ExclamationTriangleIcon size={20} color="#DC2626" />
                    <Text className="text-red-600 font-bold ml-2">Please correct the following errors:</Text>
                </View>
                {errorMessages.map((message, index) => (
                    <Text key={index} className="text-red-600 ml-5">• {message}</Text>
                ))}
            </View>
        );
    }, [errors]);

    const MemoizedInputField = useMemo(() => React.memo(InputField), []);
    const MemoizedCustomButton = useMemo(() => React.memo(CustomButton), []);
    const MemoizedPicker = useMemo(() => React.memo(Picker), []);

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <ScrollView className="flex-grow p-4">
                <Toast />
                <View className="bg-white rounded-xl p-6 shadow-sm">
                    <Controller
                        control={control}
                        name="title"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <MemoizedInputField
                                label="Title"
                                placeholder="Enter expense title"
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="amount"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <MemoizedInputField
                                label="Amount"
                                placeholder="Enter amount"
                                keyboardType="decimal-pad"
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="description"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <MemoizedInputField
                                label="Description"
                                placeholder="Enter description"
                                multiline
                                numberOfLines={3}
                                maxLength={200}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="category"
                        render={({ field: { onChange, value } }) => (
                            <View>
                                <Text className="text-base font-semibold mb-2 text-blue-900">Category</Text>
                                <View className="border border-blue-500 rounded-lg">
                                    <MemoizedPicker
                                        selectedValue={value}
                                        onValueChange={onChange}
                                        className="text-blue-700"
                                    >
                                        {categories.map((category) => (
                                            <Picker.Item key={category} label={category} value={category} />
                                        ))}
                                    </MemoizedPicker>
                                </View>
                            </View>
                        )}
                    />

                    {renderErrors}

                    <MemoizedCustomButton
                        title={mutation.isPending ? "Adding..." : "Add Expense"}
                        onPress={handleSubmit(onSubmit)}
                        disabled={mutation.isPending}
                        className="mt-8"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default React.memo(AddExpense);