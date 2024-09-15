import { useSignUp } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { ReactNativeModal } from "react-native-modal";
import { useMutation } from "@tanstack/react-query";

import { CustomButton } from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { OAuth } from "@/components/OAuth";
import { icons, images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";

// Add these constants for regex patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,}$/;

interface UserData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  clerkId: string | null;
  avatar: string;
}

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  const createUserMutation = useMutation<void, Error, UserData>({
    mutationFn: async (userData: UserData) => {
      const response = await fetch("/(api)/user/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      console.log(response);
      
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setVerification({ ...verification, state: "success" });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "An error occurred");
    },
  });

  const validateForm = () => {
    if (!EMAIL_REGEX.test(form.email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return false;
    }
    if (!USERNAME_REGEX.test(form.username)) {
      Alert.alert("Invalid Username", "Username must be at least 4 characters long and can only contain letters, numbers, and underscores.");
      return false;
    }
    if (form.firstName.trim() === "" || form.lastName.trim() === "") {
      Alert.alert("Missing Information", "Please enter both first name and last name.");
      return false;
    }
    if (form.password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters long.");
      return false;
    }
    return true;
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    if (!validateForm()) return;
    
    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerification({
        ...verification,
        state: "pending",
      });
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Error", err.errors[0].longMessage);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });
      if (completeSignUp.status === "complete") {
        createUserMutation.mutate({
          username: form.username,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          clerkId: completeSignUp.createdUserId,
          avatar: "https://utfs.io/f/zDChzk2sNFdiA7tAXerYrEUV5sR61fmF9eAzIQNdoPjbinw0"
        });
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace("/(tabs)/expense");
      } else {
        setVerification({
          ...verification,
          error: "Verification failed. Please try again.",
          state: "failed",
        });
      }
    } catch (err: any) {
      setVerification({
        ...verification,
        error: err.errors[0].longMessage,
        state: "failed",
      });
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="w-full h-[250px] mb-6">
          <Image source={images.signUpImage} className="w-full h-full" />
        </View>
        <Text className="text-2xl text-black font-JakartaSemiBold mx-5 mb-6">
          Create Your Account
        </Text>
        <View className="px-5 pb-10">
          <InputField
            label="Username"
            placeholder="john_doe"
            icon={icons.person}
            value={form.username}
            onChangeText={(value: string) => setForm({ ...form, username: value })}
          />
          <InputField
            label="First Name"
            placeholder="John"
            icon={icons.person}
            value={form.firstName}
            onChangeText={(value: string) => setForm({ ...form, firstName: value })}
          />
          <InputField
            label="Last Name"
            placeholder="Doe"
            icon={icons.person}
            value={form.lastName}
            onChangeText={(value: string) => setForm({ ...form, lastName: value })}
          />
          <InputField
            label="Email"
            placeholder="johndoe@example.com"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value: string) => setForm({ ...form, email: value })}
          />
          <InputField
            label="Password"
            placeholder="12345678"
            icon={icons.lock}
            secureTextEntry={true}
            textContentType="password"
            value={form.password}
            onChangeText={(value: string) => setForm({ ...form, password: value })}
          />
          <CustomButton
            title="Sign Up"
            onPress={onSignUpPress}
            className="mt-6"
          />
          <OAuth />
          <Link
            href="/sign-in"
            className="text-lg text-center text-general-200 mt-10"
          >
            Already have an account?{" "}
            <Text className="text-primary-500">Log In</Text>
          </Link>
        </View>
        <ReactNativeModal
          isVisible={verification.state === "pending"}
          onModalHide={() => {
            if (verification.state === "success") {
              setShowSuccessModal(true);
            }
          }}
        >
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Text className="font-JakartaExtraBold text-2xl mb-2">
              Verification
            </Text>
            <Text className="font-Jakarta mb-5">
              We've sent a verification code to {form.email}.
            </Text>
            <InputField
              label={"Code"}
              icon={icons.lock}
              placeholder={"12345"}
              value={verification.code}
              keyboardType="numeric"
              onChangeText={(code: string) =>
                setVerification({ ...verification, code })
              }
            />
            {verification.error && (
              <Text className="text-red-500 text-sm mt-1">
                {verification.error}
              </Text>
            )}
            <CustomButton
              title="Verify Email"
              onPress={onPressVerify}
              className="mt-5 bg-success-500"
            />
          </View>
        </ReactNativeModal>
        <ReactNativeModal isVisible={showSuccessModal}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Image
              source={icons.check}
              className="w-[110px] h-[110px] mx-auto my-5"
            />
            <Text className="text-3xl font-JakartaBold text-center">
              Verified
            </Text>
            <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
              You have successfully verified your account.
            </Text>
            <CustomButton
              title="Browse Home"
              onPress={() => router.push("/(tabs)/expense")}
              className="mt-5"
            />
          </View>
        </ReactNativeModal>
      </View>
    </ScrollView>
  );
};

export default SignUp;