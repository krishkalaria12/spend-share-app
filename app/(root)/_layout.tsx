import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

const RootLayout = () => {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="add-expense"
        options={{
          title: 'AddExpense',
          headerBackTitle: '',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F5F5F5' }, 
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={34} color={'#141518'} />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
};

export default RootLayout;