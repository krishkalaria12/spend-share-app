import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Picker } from "@react-native-picker/picker";
import { CustomButton } from "@/components/CustomButton";
import { askMoneyFromFriend } from '@/actions/owe.actions';
import { getAllFriends } from '@/actions/friend.actions';
import ToastManager, { Toast } from "toastify-react-native";
import { useNavigation } from '@react-navigation/native';
import { Friend, OweCreation } from '@/types/types';
import { useAuth } from '@clerk/clerk-expo'
import { TouchableOpacity } from "react-native-gesture-handler";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  Easing,
  FadeInDown,
  FadeOutUp
} from 'react-native-reanimated';

const formSchema = z.object({
  category: z.string().min(1, { message: "Category is required." }),
  amount: z.number().min(0.01, { message: "Amount must be greater than 0." }),
  title: z.string().min(1, { message: "Title is required." }),
  description: z.string().max(200, { message: "Description can't be longer than 200 characters." }),
  friendId: z.string().min(1, { message: "Friend is required." }),
});

type FormValues = z.infer<typeof formSchema>;

const AskMoneyFromFriend: React.FC = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const { getToken, userId } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedFriend, setSelectedFriend] = useState<string>("");

  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.9);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    scaleAnim.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, []);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      amount: 0,
      title: "",
      description: "",
      friendId: "",
    },
  });

  const { data: friendsData, isLoading, isError } = useQuery<{ friends: Friend[] }, Error>({
    queryKey: ["friends", userId],
    queryFn: async() => {
      const token = await getToken();
      return getAllFriends(token, userId)
    },
    enabled: !!userId,
  });

  const askMoneyMutation = useMutation({
    mutationFn: async ({ friendId, data }: { friendId: string; data: OweCreation }) => {
      const token = await getToken();
      if (!token || !userId) {
        throw new Error("Authentication required");
      }
      return askMoneyFromFriend(token, userId, friendId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owes"] });
      queryClient.invalidateQueries({ queryKey: ["moneyOwed"] });
      Toast.success("Money requested successfully");
      navigation.goBack();
      reset();
    },
    onError: (error: Error) => {
      console.error(error);
      Toast.error("Something went wrong. Please try again later.", 'top');
    }
  });

  const onSubmit = (data: FormValues) => {
    askMoneyMutation.mutate({ friendId: data.friendId, data });
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary-100">
        <ActivityIndicator size="large" color="#0286FF" />
        <Text className="mt-4 text-primary-700 font-JakartaMedium">Loading friends...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center bg-primary-100">
        <Text className="text-danger-600 font-JakartaSemiBold mb-4">Error fetching friends. Please try again.</Text>
        <TouchableOpacity 
          onPress={() => queryClient.invalidateQueries({ queryKey: ["friends"] })}
          className="bg-primary-500 px-6 py-3 rounded-full shadow-md active:scale-95 transition-transform"
        >
          <Text className="text-white font-JakartaBold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-primary-100">
      <Animated.View 
        entering={FadeInDown.duration(800).springify()}
        style={[{ padding: 20 }, animatedStyle]}
      >
        <Text className="text-3xl font-JakartaExtraBold mb-6 text-primary-800">Ask Money from a Friend</Text>
        <ToastManager height={100} width={350} />
        
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Controller
            control={control}
            name="friendId"
            render={({ field }) => (
              <View className="mb-4">
                <Text className="text-lg mb-2 text-primary-700 font-JakartaSemiBold">Select Friend</Text>
                <View className="border border-primary-300 rounded-lg overflow-hidden bg-white shadow-sm">
                  <Picker
                    selectedValue={selectedFriend}
                    onValueChange={(itemValue) => {
                      setSelectedFriend(itemValue);
                      field.onChange(itemValue);
                    }}
                    style={{ height: 50, width: '100%' }}
                  >
                    <Picker.Item label="Choose a friend..." value="" />
                    {friendsData?.friends.map((friend) => (
                      <Picker.Item key={friend._id} label={friend.username} value={friend._id} />
                    ))}
                  </Picker>
                </View>
                {errors.friendId && <Text className="text-danger-500 mt-1 font-JakartaMedium">{errors.friendId.message}</Text>}
              </View>
            )}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <View className="mb-4">
                <Text className="text-lg mb-2 text-primary-700 font-JakartaSemiBold">Title</Text>
                <TextInput
                  placeholder="Enter title"
                  value={field.value}
                  onChangeText={field.onChange}
                  className="border border-primary-300 rounded-lg p-3 text-primary-800 bg-white shadow-sm"
                />
                {errors.title && <Text className="text-danger-500 mt-1 font-JakartaMedium">{errors.title.message}</Text>}
              </View>
            )}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <View className="mb-4">
                <Text className="text-lg mb-2 text-primary-700 font-JakartaSemiBold">Category</Text>
                <View className="border border-primary-300 rounded-lg overflow-hidden bg-white shadow-sm">
                  <Picker
                    selectedValue={selectedCategory}
                    onValueChange={(itemValue) => {
                      setSelectedCategory(itemValue);
                      field.onChange(itemValue);
                    }}
                    style={{ height: 50, width: '100%' }}
                  >
                    <Picker.Item label="Select a category..." value="" />
                    <Picker.Item label="Food" value="Food" />
                    <Picker.Item label="Studies" value="Studies" />
                    <Picker.Item label="Outing" value="Outing" />
                    <Picker.Item label="Miscellaneous" value="Miscellaneous" />
                  </Picker>
                </View>
                {errors.category && <Text className="text-danger-500 mt-1 font-JakartaMedium">{errors.category.message}</Text>}
              </View>
            )}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(800).duration(500)}>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <View className="mb-4">
                <Text className="text-lg mb-2 text-primary-700 font-JakartaSemiBold">Amount</Text>
                <TextInput
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  value={field.value ? String(field.value) : ""}
                  onChangeText={(val) => field.onChange(parseFloat(val))}
                  className="border border-primary-300 rounded-lg p-3 text-primary-800 bg-white shadow-sm"
                />
                {errors.amount && <Text className="text-danger-500 mt-1 font-JakartaMedium">{errors.amount.message}</Text>}
              </View>
            )}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1000).duration(500)}>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <View className="mb-4">
                <Text className="text-lg mb-2 text-primary-700 font-JakartaSemiBold">Description</Text>
                <TextInput
                  placeholder="Enter description"
                  multiline
                  numberOfLines={4}
                  value={field.value}
                  onChangeText={field.onChange}
                  className="border border-primary-300 rounded-lg p-3 text-primary-800 bg-white shadow-sm"
                />
                {errors.description && <Text className="text-danger-500 mt-1 font-JakartaMedium">{errors.description.message}</Text>}
              </View>
            )}
          />
        </Animated.View>

        {Object.keys(errors).length > 0 && (
          <Animated.View 
            entering={FadeInDown.duration(500)}
            exiting={FadeOutUp.duration(500)}
            className="mb-4 p-3 bg-danger-100 rounded-lg"
          >
            <Text className="text-danger-800 font-JakartaBold mb-2">Please correct the following errors:</Text>
            {Object.entries(errors).map(([key, error]) => (
              <Text key={key} className="text-danger-600 font-JakartaMedium">• {error.message}</Text>
            ))}
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(1200).duration(500)}>
          <CustomButton
            title={askMoneyMutation.isPending ? "Submitting..." : "Submit Request"}
            onPress={handleSubmit(onSubmit)}
            disabled={askMoneyMutation.isPending}
            bgVariant="primary"
            className="mt-4 py-4 rounded-full shadow-lg active:scale-95 transition-transform"
          />
        </Animated.View>
      </Animated.View>
    </ScrollView>
  );
};

export default AskMoneyFromFriend;