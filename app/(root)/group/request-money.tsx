import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
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

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Amount must be a valid number." }),
  description: z.string().min(1, { message: "Description is required." }),
  category: z.string().min(1, { message: "Category is required." }),
  splitType: z.enum(['EQUAL', 'PERCENTAGE', 'SHARE']),
  memberShares: z.record(z.string(), z.string()).optional(),
});

export type RequestMoneyFormData = z.infer<typeof formSchema>;

const categories = ['Food', 'Studies', 'Outing', 'Miscellaneous'];
const splitTypes = ['EQUAL', 'PERCENTAGE', 'SHARE'];

export const ExpenseSplittingForm: React.FC = () => {
  const params = useLocalSearchParams();
  const group = JSON.parse(params.group as string);
  const groupId = group._id;
  const groupMembers = group.members;

  const [step, setStep] = useState(1);
  const { userId, getToken } = useAuth();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const { control, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<RequestMoneyFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      amount: '',
      description: '',
      category: '',
      splitType: 'EQUAL',
      memberShares: {},
    },
  });

  const watchSplitType = watch('splitType');

  const mutation = useMutation({
    mutationFn: async (RequestMoneyFormData: RequestMoneyFormData) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return requestMoneyFromGroup(userId, groupId, token, RequestMoneyFormData);
    },
    onSuccess: (response) => {
      console.log(response);
      Alert.alert("Success", "Request sent successfully");
    },
    onError: (error) => {
      console.error(error);
      Alert.alert("Error", "Something went wrong. Please try again later.");
    },
  });

  const onSubmit = (data: RequestMoneyFormData) => {
    let userShare = 0;
    const totalAmount = parseFloat(data.amount);
    const memberShares = data.memberShares || {};
    
    if (data.splitType === 'EQUAL') {
      const equalShare = totalAmount / (selectedMembers.length);
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
  };

  const addMember = (memberId: string) => {
    setSelectedMembers([...selectedMembers, memberId]);
  };

  const removeMember = (index: number) => {
    const newSelected = [...selectedMembers];
    newSelected.splice(index, 1);
    setSelectedMembers(newSelected);
    const shares = { ...getValues('memberShares') };
    delete shares[selectedMembers[index]];
    setValue('memberShares', shares);
  };

  const availableMembers = groupMembers.filter(
    (member: { _id: string, clerkId: string }) => !selectedMembers.includes(member._id) && member.clerkId !== userId
  );

  const validateTotalShares = () => {
    const totalAmount = parseFloat(getValues('amount'));
    const shares = getValues('memberShares') || {};
    const totalShares = Object.values(shares).reduce((sum, share) => sum + parseFloat(share), 0);

    if (watchSplitType === 'PERCENTAGE' && totalShares > 100) {
      return "Total percentage cannot exceed 100%";
    }
    if (watchSplitType === 'SHARE' && totalShares > totalAmount) {
      return "Total shares cannot exceed the total amount";
    }
    return true;
  };

  useEffect(() => {
    if (watchSplitType === 'EQUAL') {
      setSelectedMembers([]);
      setValue('memberShares', {});
    }
  }, [watchSplitType, setValue]);

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
          render={({ field: { onChange, value } }) => (
            <InputField
              label={watchSplitType === 'PERCENTAGE' ? 'Percentage' : 'Amount'}
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              containerStyle="w-24 ml-2"
              inputStyle="text-right"
              placeholder={watchSplitType === 'PERCENTAGE' ? "%" : "$"}
            />
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
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Title"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  containerStyle={`mb-4 ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="Enter expense title"
                />
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Description"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  multiline
                  numberOfLines={3}
                  containerStyle={`mb-4 h-24 ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="Enter expense description"
                />
              )}
            />
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <View className="mb-4">
                  <Text className="text-base font-semibold mb-2 text-gray-700">Category</Text>
                  <View className="border border-gray-300 rounded-md">
                    <Picker
                      selectedValue={value}
                      onValueChange={(itemValue) => onChange(itemValue)}
                      className="h-12"
                    >
                      <Picker.Item label="Select a category..." value="" />
                      {categories.map((category) => (
                        <Picker.Item key={category} label={category} value={category} />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}
            />
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Total Amount"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  containerStyle={`mb-4 ${errors.amount ? 'border-red-500' : ''}`}
                  placeholder="Enter total amount"
                />
              )}
            />
            <CustomButton
              title="Next"
              onPress={() => setStep(2)}
              className="mt-4 bg-blue-500 py-3 rounded-full"
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
                      onValueChange={(itemValue) => onChange(itemValue)}
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
              title="Submit"
              onPress={handleSubmit(onSubmit)}
              disabled={mutation.isPending}
              className="mt-4 bg-green-500 py-3 rounded-full"
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView className="flex-1 bg-gradient-to-b from-blue-600 to-blue-800">
      <View className="p-6 pb-10">
        <Text className="text-3xl font-bold text-primary-500 mb-6 text-center">Expense Splitting</Text>
        {renderStepIndicator()}
        {renderStepContent()}
      </View>
    </ScrollView>
  );
};

export default ExpenseSplittingForm;