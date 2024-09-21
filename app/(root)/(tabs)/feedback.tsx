import React, { useState, useCallback } from 'react';
import { Text, View, ScrollView, RefreshControl, Alert, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFeedback, getFeedback, deleteFeedback } from '@/actions/feedback.actions';
import { format } from 'date-fns';
import { TrashIcon } from 'react-native-heroicons/outline';
import ServerError from '@/components/ServerError';
import { InputField } from '@/components/InputField'; 
import { CustomButton } from '@/components/CustomButton';
import ToastManager, { Toast } from 'toastify-react-native'

const Feedback = () => {
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [refreshing, setRefreshing] = useState(false);

  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch feedback
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['feedbacks', page],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) {
        throw new Error("Authentication required");
      }
      return getFeedback(page, limit, token, userId);
    },
    retry: false,
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  // Create feedback mutation
  const createFeedbackMutation = useMutation({
    mutationFn: async (message: string) => {
      const token = await getToken();
      return createFeedback(message, token, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      setMessage('');
      Toast.success("Feedback submitted successfully!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Uh oh! Something went wrong.");
      Toast.error("Error submitting feedback!", "top");
    },
  });

  // Delete feedback mutation
  const deleteFeedbackMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return deleteFeedback(id, token, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      Toast.success("Feedback deleted successfully!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Uh oh! Something went wrong.");
      Toast.error("Error deleting feedback!", "top");
    },
  });

  const handleSubmit = () => {
    if (message.trim() === '') {
      Alert.alert('Error', 'Feedback message cannot be empty.');
      return;
    }
    createFeedbackMutation.mutate(message);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (data?.totalPages || 1)) {
      setPage(newPage);
    }
  };

  const toggleDelete = (id: string) => {
    deleteFeedbackMutation.mutate(id);
  };

  if (isError) {
    return <ServerError />;
  }

  if (isLoading || refreshing) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <View className="flex items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-lg font-semibold text-gray-600">Loading amazing feedback...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 pt-4">
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ToastManager height={100} width={350} />
        <Text className="text-3xl font-bold mb-6 text-gray-800">Feedbacks</Text>

        {/* Feedback Form */}
        <View className="mb-6">
          <InputField
            label="Submit Your Feedback"
            value={message}
            onChangeText={setMessage}
            containerStyle="mb-4"
            inputStyle="text-left"
            placeholder="Enter your feedback"
            multiline
          />
          <CustomButton
            title="Submit Feedback"
            onPress={handleSubmit}
            className="mt-2"
          />
        </View>

        {/* Feedback List */}
        {data?.feedbacks.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className='my-4 font-bold text-center text-3xl'>Feel Free to leave a feedback</Text>
          </View>
          
        ) : (
          data?.feedbacks.map((feedback) => (
            <View key={feedback._id} className="bg-white rounded-lg p-4 mb-4" style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 4,
            }}>
              <View className="flex-row items-center mb-2">
                <Image
                  source={{ uri: feedback.owner.avatar || 'https://utfs.io/f/zDChzk2sNFdiA7tAXerYrEUV5sR61fmF9eAzIQNdoPjbinw0' }}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <View>
                  <Text className="font-semibold text-gray-800">{feedback.owner.fullName}</Text>
                  <Text className="text-xs text-gray-500">
                    {format(new Date(feedback.createdAt), 'dd MMM yyyy')}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-700 mb-3">{feedback.message}</Text>
              <View className="flex-row justify-between items-center">
                {feedback.owner.clerkId === userId && (
                  <TouchableOpacity
                    onPress={() => toggleDelete(feedback._id)}
                    className="bg-red-100 p-2 rounded-full"
                  >
                    <TrashIcon color="#ef4444" size={20} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Feedback;
