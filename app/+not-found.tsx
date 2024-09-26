import React from 'react';
import { Link, Stack } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

export default function NotFoundScreen() {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { 
        duration: 2000, 
        easing: Easing.linear 
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateY: `${rotation.value}deg` }],
    };
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView className="flex-1 items-center justify-center bg-primary-100 p-8">
        <Animated.View 
          entering={FadeIn.duration(1000)}
          style={[animatedStyle, { marginBottom: 20 }]}
        >
          <Feather name="alert-circle" size={100} color="#0286FF" />
        </Animated.View>
        
        <Animated.Text 
          entering={FadeInDown.duration(800).delay(300)}
          className="text-3xl font-JakartaExtraBold text-primary-800 text-center mb-4"
        >
          Oops! Page Not Found
        </Animated.Text>
        
        <Animated.Text 
          entering={FadeInDown.duration(800).delay(600)}
          className="text-lg font-JakartaMedium text-primary-600 text-center mb-8"
        >
          The page you're looking for doesn't exist or has been moved.
        </Animated.Text>
        
        <Animated.View entering={FadeInDown.duration(800).delay(900)}>
          <Link href="/" asChild>
            <TouchableOpacity 
              className="bg-primary-500 px-8 py-4 rounded-full shadow-lg active:scale-95 transition-transform"
            >
              <Text className="text-white font-JakartaBold text-lg">
                Go to Home Screen
              </Text>
            </TouchableOpacity>
          </Link>
        </Animated.View>
      </ThemedView>
    </>
  );
}