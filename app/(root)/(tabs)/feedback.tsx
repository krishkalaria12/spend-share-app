import React, { useState, useCallback, useMemo } from 'react';
import { Text, View, FlatList, RefreshControl, Alert, ActivityIndicator, Image, TouchableOpacity, ListRenderItem, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFeedback, getFeedback, deleteFeedback } from '@/actions/feedback.actions';
import { format } from 'date-fns';
import { TrashIcon } from 'react-native-heroicons/outline';
import ServerError from '@/components/ServerError';
import { InputField } from '@/components/InputField'; 
import { CustomButton } from '@/components/CustomButton';
import ToastManager, { Toast } from 'toastify-react-native'
import { FeedbackType } from "@/types/types";

const ITEMS_PER_PAGE = 10;

interface FeedbackItemProps {
  feedback: FeedbackType;
  onDelete: (id: string) => void;
  isCurrentUser: boolean;
}

const FeedbackItem: React.FC<FeedbackItemProps> = React.memo(({ feedback, onDelete, isCurrentUser }) => {
  const handleDelete = useCallback(() => onDelete(feedback._id), [feedback._id, onDelete]);

  return (
    <View className="bg-white rounded-lg p-4 mb-4 shadow-md">
      <View className="flex-row items-center mb-2">
        <Image
          source={{ uri: feedback.owner.avatar.url || 'https://utfs.io/f/zDChzk2sNFdiA7tAXerYrEUV5sR61fmF9eAzIQNdoPjbinw0' }}
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
      {isCurrentUser && (
        <TouchableOpacity
          onPress={handleDelete}
          className="bg-red-100 p-2 rounded-full self-start"
        >
          <TrashIcon color="#ef4444" size={20} />
        </TouchableOpacity>
      )}
    </View>
  );
});

const Feedback: React.FC = () => {
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);

  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['feedbacks', page],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return getFeedback(page, ITEMS_PER_PAGE, token, userId);
    },
    retry: false,
    placeholderData: keepPreviousData,
  });

  const createFeedbackMutation = useMutation({
    mutationFn: async (message: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return createFeedback(message, token, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      setMessage('');
      Toast.success("Feedback submitted successfully!");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Uh oh! Something went wrong.");
      Toast.error("Error submitting feedback!", 'top');
    },
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Authentication required");
      return deleteFeedback(id, token, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      Toast.success("Feedback deleted successfully!");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Uh oh! Something went wrong.");
      Toast.error("Error deleting feedback!", 'top');
    },
  });

  const handleSubmit = useCallback(() => {
    if (message.trim() === '') {
      Alert.alert('Error', 'Feedback message cannot be empty.');
      return;
    }
    createFeedbackMutation.mutate(message);
  }, [message, createFeedbackMutation]);

  const handleDelete = useCallback((id: string) => {
    deleteFeedbackMutation.mutate(id);
  }, [deleteFeedbackMutation]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderItem: ListRenderItem<FeedbackType> = useCallback(({ item }) => (
    <FeedbackItem 
      feedback={item} 
      onDelete={handleDelete} 
      isCurrentUser={item.owner.clerkId === userId}
    />
  ), [handleDelete, userId]);

  const keyExtractor = useCallback((item: FeedbackType) => item._id, []);

  const listEmptyComponent = useMemo(() => (
    <View className="flex-1 items-center justify-center">
      <Text className='my-4 font-bold text-center text-3xl'>Feel free to leave feedback</Text>
    </View>
  ), []);

  const onEndReached = useCallback(() => {
    if (data && !isFetching && page < data.totalPages) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [data, isFetching, page]);

  if (isError) return <ServerError />;

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={data?.feedbacks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={listEmptyComponent}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            <ToastManager height={100} width={350} />
            <Text className="text-3xl font-bold mb-6 text-gray-800 px-4 pt-4">Feedbacks</Text>
            <View className="mb-6 px-4">
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
          </>
        }
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
      {isFetching && (
        <View className="absolute bottom-4 left-0 right-0 items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default React.memo(Feedback);