import React from 'react';
import { View, Text } from 'react-native';
import { FieldErrors, FieldError } from 'react-hook-form'; // Import FieldErrors and FieldError types from react-hook-form

interface FormErrorsProps {
  errors: FieldErrors; // Use FieldErrors type for the errors prop
}

export const FormErrors: React.FC<FormErrorsProps> = ({ errors }) => {
  if (Object.keys(errors).length === 0) return null;

  return (
    <View className="mb-4 p-3 bg-red-100 rounded-md">
      {Object.entries(errors).map(([key, value]) => {
        // Safely access the message if it's available
        const errorMessage = (value as FieldError)?.message;

        return errorMessage ? (
          <Text key={key} className="text-red-600 mb-1">
            {errorMessage}
          </Text>
        ) : null;
      })}
    </View>
  );
};
