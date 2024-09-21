import React from 'react';
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

    const onSubmit = (data: FormData) => {
        mutation.mutate(data);
    };

    const renderErrors = () => {
        const errorMessages = Object.values(errors).map(error => error?.message);
        if (errorMessages.length === 0) return null;

        return (
            <View style={{ backgroundColor: '#FEE2E2', padding: 16, borderRadius: 12, marginTop: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <ExclamationTriangleIcon size={20} color="#DC2626" />
                    <Text style={{ color: '#DC2626', fontWeight: 'bold', marginLeft: 8 }}>Please correct the following errors:</Text>
                </View>
                {errorMessages.map((message, index) => (
                    <Text key={index} style={{ color: '#DC2626', marginLeft: 20 }}>• {message}</Text>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
                <Toast />
                <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.1 }}>
                    <Controller
                        control={control}
                        name="title"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <InputField
                                label="Title"
                                placeholder="Enter expense title"
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                                // customReactIcon={() => <Ionicons name="pencil" size={20} color="#0286FF" />}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="amount"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <InputField
                                label="Amount"
                                placeholder="Enter amount"
                                keyboardType="decimal-pad"
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                                // customReactIcon={() => <Ionicons name='cash-outline' size={20} color="#0286FF" />}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="description"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <InputField
                                label="Description"
                                placeholder="Enter description"
                                multiline
                                numberOfLines={3}
                                maxLength={200}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                                // customReactIcon={() => <Ionicons name='create-outline' size={20} color="#0286FF" />}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="category"
                        render={({ field: { onChange, value } }) => (
                            <View>
                                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#1E3A8A' }}>Category</Text>
                                <View style={{ borderColor: '#0286FF', borderWidth: 1, borderRadius: 8 }}>
                                    <Picker
                                        selectedValue={value}
                                        onValueChange={onChange}
                                        style={{ color: '#475A99' }}
                                    >
                                        {categories.map((category) => (
                                            <Picker.Item key={category} label={category} value={category} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        )}
                    />

                    {renderErrors()}

                    <CustomButton
                        title={mutation.isPending ? "Adding..." : "Add Expense"}
                        onPress={handleSubmit(onSubmit)}
                        disabled={mutation.isPending}
                        className='mt-8'
                        // customReactIcon={mutation.isPending ? () => <Ionicons name="sync" size={20} color="white" style={{ marginRight: 8 }} /> : () => <Ionicons name="add-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />}
                        // style={{ marginTop: 16 }}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AddExpense;
