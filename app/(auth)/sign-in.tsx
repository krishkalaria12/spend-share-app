import { useSignIn } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";

import { CustomButton } from "@/components/CustomButton";
import { InputField } from "@/components/InputField";
import { OAuth } from "@/components/OAuth";
import { icons, images } from "@/constants";

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(tabs)/expense");
      } else {
        // See https://clerk.com/docs/custom-flows/error-handling for more info on error handling
        console.log(JSON.stringify(signInAttempt, null, 2));
        Alert.alert("Error", "Log in failed. Please try again.");
      }
    } catch (err: any) {
      console.log(JSON.stringify(err, null, 2));
      Alert.alert("Error", err.errors[0].longMessage);
    }
  }, [isLoaded, form]);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white p-5">
        <Image source={images.signUpImage} className="w-full h-[250px] rounded-lg" />
        
        <Text className="text-2xl text-black font-JakartaSemiBold mt-6 mb-8">
          Welcome 👋
        </Text>

        <InputField
          label="Email"
          placeholder="johndoe@gmail.com"
          icon={icons.email}
          textContentType="emailAddress"
          value={form.email}
          onChangeText={(value) => setForm({ ...form, email: value })}
        />

        <InputField
          label="Password"
          placeholder="12345678"
          icon={icons.lock}
          secureTextEntry={true}
          textContentType="password"
          value={form.password}
          onChangeText={(value) => setForm({ ...form, password: value })}
        />

        <CustomButton
          title="Sign In"
          onPress={onSignInPress}
          className="mt-6"
        />

        <OAuth />

        <Link
          href="/sign-up"
          className="text-lg text-center text-general-200 mt-10"
        >
          Don't have an account?{" "}
          <Text className="text-primary-500">Sign Up</Text>
        </Link>
      </View>
    </ScrollView>
  );
};

export default SignIn;