import { Tabs } from "expo-router";
import { Image, ImageSourcePropType, View } from "react-native";

import { icons } from "@/constants";

const TabIcon = ({
  source,
  focused,
  name
}: {
  source: ImageSourcePropType;
  focused: boolean;
  name: string;
}) => (
  <View
    className={`flex flex-row justify-center items-center rounded-full ${
      focused ? "bg-general-300" : ""
    }`}
  >
    <View
      className={`rounded-full w-12 h-12 items-center justify-center ${
        focused ? "bg-general-400" : ""
      }`}
    >
      <Image
        source={source}
        tintColor="white"
        resizeMode="contain"
        className={`${name === "expense" ? "w-7 h-7" : "w-9 h-9"}`}
      />
    </View>
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
        initialRouteName="index"
        screenOptions={{
            tabBarActiveTintColor: "white",
            tabBarInactiveTintColor: "white",
            tabBarShowLabel: false,
            tabBarStyle: {
            backgroundColor: "#333333",
            borderRadius: 50,
            paddingBottom: 0, // ios only
            overflow: "hidden",
            marginHorizontal: 20,
            marginBottom: 20,
            height: 78,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            position: "absolute",
        },
      }}
    >
      <Tabs.Screen
        name="expense"
        options={{
          title: "Expense",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="expense" source={icons.expense} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          title: "Group",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="group" source={icons.group} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friend",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="friends" source={icons.friend} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ask-friend-money"
        options={{
          title: "Ask Friend",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="ask-friend-money" source={icons.askFriend} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          title: "Feedback",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="feedback" source={icons.feedback} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
