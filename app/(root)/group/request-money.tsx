import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { requestMoneyFromGroup } from '@/actions/group.actions';
import { InputField } from '@/components/InputField';
import { CustomButton } from '@/components/CustomButton';
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'react-native';

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Amount must be a valid number." }),
  description: z.string().min(1, { message: "Description is required." }),
  category: z.string().min(1, { message: "Category is required." }),
  splitType: z.enum(['EQUAL', 'PERCENTAGE', 'SHARE']),
  memberShares: z.record(z.string(), z.string()).optional(),
});

type RequestMoneyFormData = z.infer<typeof formSchema>;

const categories = ['Food', 'Studies', 'Outing', 'Miscellaneous'];
const splitTypes = ['EQUAL', 'PERCENTAGE', 'SHARE'];

export const ExpenseSplittingForm: React.FC = () => {
  const params = useLocalSearchParams();
  const groupId = params.groupId as string;
  const groupMembers = useMemo(() => {
    try {
      return JSON.parse(params.groupMembers as string);
    } catch (error) {
      console.error('Error parsing group members:', error);
      return [];
    }
  }, [params.groupMembers]);

  const [step, setStep] = useState(1);
  const { userId, getToken } = useAuth();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const { control, handleSubmit, formState: { errors, isValid }, watch, setValue, getValues, trigger } = useForm<RequestMoneyFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      amount: '',
      description: '',
      category: '',
      splitType: 'EQUAL',
      memberShares: {},
    },
    mode: 'onChange',
  });

  const watchSplitType = watch('splitType');
  const watchAmount = watch('amount');

  const mutation = useMutation({
    mutationFn: async (data: RequestMoneyFormData) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return requestMoneyFromGroup(userId, groupId, token, data);
    },
    onSuccess: () => {
      Alert.alert("Success", "Request sent successfully");
      // Reset form or navigate to another screen
    },
    onError: (error) => {
      console.error(error);
      Alert.alert("Error", "Something went wrong. Please try again later.");
    },
  });

  const onSubmit = useCallback((data: RequestMoneyFormData) => {
    let userShare = 0;
    const totalAmount = parseFloat(data.amount);
    const memberShares = data.memberShares || {};
    
    if (data.splitType === 'EQUAL') {
      const equalShare = totalAmount / (selectedMembers.length + 1);
      selectedMembers.forEach((memberId: string) => {
        memberShares[memberId] = equalShare.toFixed(2);
      });
      userShare = equalShare;
    } else {
      const totalShares = Object.values(memberShares).reduce((sum, share) => sum + parseFloat(share), 0);
      if (data.splitType === 'PERCENTAGE') {
        userShare = totalAmount * (1 - totalShares / 100);
      } else { // SHARE
        userShare = totalAmount - totalShares;
      }
    }

    memberShares['mine'] = userShare.toFixed(2);
    mutation.mutate({ ...data, memberShares });
  }, [selectedMembers, mutation]);

  const addMember = useCallback((memberId: string) => {
    setSelectedMembers(prev => [...prev, memberId]);
  }, []);

  const removeMember = useCallback((index: number) => {
    setSelectedMembers(prev => {
      const newSelected = [...prev];
      newSelected.splice(index, 1);
      return newSelected;
    });
  
    const currentShares = getValues('memberShares') || {};
    const updatedShares = { ...currentShares };
    delete updatedShares[selectedMembers[index]]; // Remove the share
    
    // Pass the updated object directly to setValue
    setValue('memberShares', updatedShares);
  }, [selectedMembers, setValue, getValues]);
  
  

  const availableMembers = useMemo(() => groupMembers.filter(
    (member: { _id: string, clerkId: string }) => !selectedMembers.includes(member._id) && member.clerkId !== userId
  ), [groupMembers, selectedMembers, userId]);

  const validateTotalShares = useCallback(() => {
    const totalAmount = parseFloat(getValues('amount'));
    const shares = getValues('memberShares') || {};
    const totalShares = Object.values(shares).reduce((sum, share) => sum + parseFloat(share || '0'), 0);

    if (watchSplitType === 'PERCENTAGE' && totalShares > 100) {
      return "Total percentage cannot exceed 100%";
    }
    if (watchSplitType === 'SHARE' && totalShares > totalAmount) {
      return "Total shares cannot exceed the total amount";
    }
    return true;
  }, [getValues, watchSplitType]);

  useEffect(() => {
    if (watchSplitType === 'EQUAL') {
      setSelectedMembers([]);
      setValue('memberShares', {});
    }
  }, [watchSplitType, setValue]);

  useEffect(() => {
    if (watchSplitType !== 'EQUAL' && watchAmount) {
      trigger('memberShares');
    }
  }, [watchAmount, watchSplitType, trigger]);

  const renderStepIndicator = () => (
    <View className="flex-row justify-center mb-6">
      <View className={`w-3 h-3 rounded-full mx-1 ${step >= 1 ? 'bg-white' : 'bg-gray-400'}`} />
      <View className={`w-3 h-3 rounded-full mx-1 ${step >= 2 ? 'bg-white' : 'bg-gray-400'}`} />
    </View>
  );

  const renderMemberInputs = () => {
    return selectedMembers.map((memberId, index) => (
      <View key={index} className="flex-row items-center mb-3 bg-white rounded-lg p-3 shadow-sm">
        <Text className="flex-1 text-base font-medium text-gray-800">
          {groupMembers.find((member: { _id: string }) => member._id === memberId)?.fullName}
        </Text>
        <Controller
          control={control}
          name={`memberShares.${memberId}`}
          rules={{
            required: 'This field is required',
            validate: (value) => {
              if (watchSplitType === 'PERCENTAGE' && parseFloat(value) > 100) {
                return 'Percentage cannot exceed 100';
              }
              if (watchSplitType === 'SHARE' && parseFloat(value) > parseFloat(watchAmount)) {
                return 'Share cannot exceed total amount';
              }
              return true;
            }
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View>
              <InputField
                label={watchSplitType === 'PERCENTAGE' ? 'Percentage' : 'Amount'}
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                containerStyle="w-24 ml-2"
                inputStyle="text-right"
                placeholder={watchSplitType === 'PERCENTAGE' ? "%" : "$"}
              />
              {error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
            </View>
          )}
        />
        <TouchableOpacity onPress={() => removeMember(index)} className="ml-2">
          <Ionicons name="close-circle" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    ));
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View className="bg-white bg-opacity-90 rounded-xl p-6 mb-6">
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <>
                  <InputField
                    label="Title"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    containerStyle={`mb-1 ${error ? 'border-red-500' : ''}`}
                    placeholder="Enter expense title"
                  />
                  {error && <Text className="text-red-500 text-xs mb-4">{error.message}</Text>}
                </>
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <>
                  <InputField
                    label="Description"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    multiline
                    numberOfLines={3}
                    containerStyle={`mb-1 h-24 ${error ? 'border-red-500' : ''}`}
                    placeholder="Enter expense description"
                  />
                  {error && <Text className="text-red-500 text-xs mb-4">{error.message}</Text>}
                </>
              )}
            />
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View className="mb-4">
                  <Text className="text-base font-semibold mb-2 text-gray-700">Category</Text>
                  <View className={`border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}>
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      className="h-12"
                    >
                      <Picker.Item label="Select a category..." value="" />
                      {categories.map((category) => (
                        <Picker.Item key={category} label={category} value={category} />
                      ))}
                    </Picker>
                  </View>
                  {error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
                </View>
              )}
            />
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <>
                  <InputField
                    label="Total Amount"
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    containerStyle={`mb-1 ${error ? 'border-red-500' : ''}`}
                    placeholder="Enter total amount"
                  />
                  {error && <Text className="text-red-500 text-xs mb-4">{error.message}</Text>}
                </>
              )}
            />
            <CustomButton
              title="Next"
              onPress={() => {
                trigger().then((isValid) => {
                  if (isValid) setStep(2);
                });
              }}
              disabled={!isValid}
              className={`mt-4 py-3 rounded-full ${isValid ? 'bg-blue-500' : 'bg-gray-400'}`}
            />
          </View>
        );
      case 2:
        return (
          <View className="bg-white bg-opacity-90 rounded-xl p-6 mb-6">
            <Controller
              control={control}
              name="splitType"
              render={({ field: { onChange, value } }) => (
                <View className="mb-4">
                  <Text className="text-base font-semibold mb-2 text-gray-700">Split Type</Text>
                  <View className="border border-gray-300 rounded-md">
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      className="h-12"
                    >
                      <Picker.Item label="Select split type..." value="" />
                      {splitTypes.map((type) => (
                        <Picker.Item key={type} label={type} value={type} />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}
            />
            {watchSplitType !== 'EQUAL' && (
              <>
                {renderMemberInputs()}
                {availableMembers.length > 0 && (
                  <View className="mt-4 mb-4">
                    <Text className="text-base font-semibold mb-2 text-gray-700">Select a member to add:</Text>
                    <View className="border border-gray-300 rounded-md">
                      <Picker
                        selectedValue={undefined}
                        onValueChange={addMember}
                        className="h-12"
                      >
                        <Picker.Item label="Select a member..." value="" />
                        {availableMembers.map((member: { _id: string, fullName: string }) => (
                          <Picker.Item key={member._id} label={member.fullName} value={member._id} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                )}
              </>
            )}
            {validateTotalShares() !== true && (
              <Text className="text-red-500 text-sm font-medium mt-2 mb-4">{validateTotalShares()}</Text>
            )}
            <CustomButton
              title={mutation.isPending ? "Submitting..." : "Submit"}
              onPress={handleSubmit(onSubmit)}
              disabled={mutation.isPending || !isValid || validateTotalShares() !== true}
              className={`mt-4 py-3 rounded-full ${mutation.isPending || !isValid || validateTotalShares() !== true ? 'bg-gray-400' : 'bg-green-500'}`}
            />
            {mutation.isPending && <ActivityIndicator size="large" color="#0000ff" className="mt-4" />}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView className="flex-1 bg-gradient-to-b from-blue-600 to-blue-800">
      <StatusBar barStyle="light-content" />
      <View className="p-6 pb-10">
        <Text className="text-3xl font-bold text-white mb-6 text-center">Expense Splitting</Text>
        {renderStepIndicator()}
        {renderStepContent()}
      </View>
    </ScrollView>
  );
};

export default ExpenseSplittingForm;