import React, { useState, useCallback } from "react";
import { ScrollView, View, Text, ActivityIndicator, SafeAreaView, Alert, Image } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MultiSelect from "react-native-multiple-select";
import * as ImagePicker from 'expo-image-picker';
import { CustomButton } from "@/components/CustomButton";
import { InputField } from "@/components/InputField";
import { FormErrors } from "@/components/FormErrors";
import { createGroupByValues } from "@/actions/group.actions";
import { getAllFriends } from "@/actions/friend.actions";
import { openSettings } from "expo-linking";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useAuth } from "@clerk/clerk-expo";
import { upload } from "cloudinary-react-native";
import { cld } from "@/utils/Cloudinary";
import { useRouter } from "expo-router";
import { StatusBar } from "react-native";

// Validation Schema with Zod
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().min(5, "Description must be at least 5 characters."),
  friends: z.array(z.string()).nonempty("Select at least one member."),
  avatar: z.string(),
});

// Memoized Components for better performance
const MemoizedInputField = React.memo(InputField);
const MemoizedMultiSelect = React.memo(MultiSelect);

export default function CreateGroupPage() {
  const queryClient = useQueryClient();
  const [imageUploadUrl, setImageUploadUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const router = useRouter();
  const { getToken, userId } = useAuth();

  // Form initialization
  const { control, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      friends: [],
      avatar: "",
    },
  });

  // Fetching friends data
  const { data: friendsData, isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) {
        throw new Error("Authentication required");
      }
      return getAllFriends(token, userId);
    },
  });

  const friends = friendsData?.friends.map((friend: any) => ({
    id: friend._id,
    name: friend.username,
  })) || [];

  // Mutation to create group
  const createGroupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const token = await getToken();
      if (!token || !userId) {
        throw new Error("Authentication required");
      }
      return createGroupByValues(data, token, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      Alert.alert("Success", "Group created successfully!");
      router.push("/(root)/(tabs)/group");
    },
    onError: (error: any) => {
      console.error(error);
      Alert.alert("Error", "Failed to create group. Try again later.");
    },
  });

  // Handle image upload using Cloudinary
  const uploadImage = useCallback(async (imageUri: string) => {
    setIsUploading(true);
    const options = {
      upload_preset: 'default',
      unsigned: true,
    };
    
    try {
      const response = await upload(cld, {
        file: imageUri, 
        options: options,    
        callback: (error: any, response: any) => {
          if (response && response.secure_url) {
            setImageUploadUrl(response.secure_url);
            setValue("avatar", response.secure_url);
            Alert.alert("Success", "Image uploaded successfully!");
          } else {
            throw new Error("Failed to get secure URL from upload response");
          }
        }
      });
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [setValue]);

  // Handle image picking
  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        "No Permissions",
        "You need to grant permission to your Photos to use this",
        [
          { text: "Dismiss" },
          { text: "Open Settings", onPress: openSettings },
        ],
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadImage(result.assets[0].uri);
    }
  }, [uploadImage]);

  const onSubmit = (data: any) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("friends", data.friends.join(","));
    if (imageUploadUrl) {
      formData.append("avatar", imageUploadUrl);
    }
    createGroupMutation.mutate(formData);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 80 }}>
        <Text className="text-3xl font-JakartaBold mb-4 text-primary-500">Create Group</Text>

        {/* Group Name Input */}
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <MemoizedInputField
              label="Group Name"
              placeholder="Enter group name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        {/* Description Input */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <MemoizedInputField
              label="Description"
              placeholder="Enter group description"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        {/* Friends Selection */}
        {loadingFriends ? (
          <View className="flex-1 justify-center items-center my-6">
            <ActivityIndicator size="large" color="#0286FF" />
            <Text className="mt-2 text-gray-500">Loading your friends...</Text>
          </View>
        ) : (
          <Controller
            control={control}
            name="friends"
            render={({ field: { onChange, value } }) => (
              <View className="mb-4">
                <Text className="text-lg font-JakartaSemiBold mb-2">Select Members</Text>
                <MemoizedMultiSelect
                  items={friends}
                  uniqueKey="id"
                  onSelectedItemsChange={onChange}
                  selectedItems={value}
                  selectText="Choose Friends"
                  searchInputPlaceholderText="Search Friends..."
                  tagRemoveIconColor="#CCC"
                  tagBorderColor="#CCC"
                  tagTextColor="#333"
                  selectedItemTextColor="#0286FF"
                  selectedItemIconColor="#0286FF"
                  itemTextColor="#000"
                  displayKey="name"
                  searchInputStyle={{ color: '#333' }}
                  submitButtonColor="#0286FF"
                  submitButtonText="Submit"
                  styleMainWrapper={{
                    backgroundColor: '#F4F4F4',
                    borderRadius: 8,
                    padding: 10,
                  }}
                  styleDropdownMenuSubsection={{
                    backgroundColor: '#FFF',
                    borderRadius: 8,
                    padding: 10,
                  }}
                />
              </View>
            )}
          />
        )}

        {/* Image Upload */}
        <Animated.View className="w-full h-52 bg-primary-200 rounded-lg justify-center items-center overflow-hidden mb-4" style={animatedStyle}>
          {imageUploadUrl ? (
            <Image source={{ uri: imageUploadUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Text className="text-secondary-500 text-lg font-JakartaMedium">No image selected</Text>
          )}
        </Animated.View>

        <CustomButton
          onPress={pickImage}
          title={isUploading ? "Uploading..." : "Upload Group Image"}
          bgVariant="primary"
          textVariant="default"
          className="mb-4"
          disabled={isUploading}
        />

        {/* Form Errors */}
        <FormErrors errors={errors} />

        {/* Submit Button */}
        <CustomButton
          onPress={handleSubmit(onSubmit)}
          title={createGroupMutation.isPending ? "Creating Group..." : "Create Group"}
          bgVariant="primary"
          textVariant="default"
          disabled={createGroupMutation.isPending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
