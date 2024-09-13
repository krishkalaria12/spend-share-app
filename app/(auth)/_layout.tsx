import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

const AuthLayout = () => {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen 
        name="sign-up"
        options={{
          title: '',
          headerBackTitle: '',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F5F5F5' }, 
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push("/(auth)/welcome")}>
              <Ionicons name="arrow-back" size={34} color={'#141518'} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen 
        name="sign-in"
        options={{
          title: '',
          headerBackTitle: '',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F5F5F5' }, 
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push("/(auth)/welcome")}>
              <Ionicons name="arrow-back" size={34} color={'#141518'} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <Link href={'/help'} asChild>
              <TouchableOpacity>
                <Ionicons name="help-circle-outline" size={34} color={'#141518'} />
              </TouchableOpacity>
            </Link>
          ),
        }}
      />
    </Stack>
  );
};

export default AuthLayout;