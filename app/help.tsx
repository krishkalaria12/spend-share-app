import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

interface HelpItemProps {
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
    title: string;
    description: string;
}

const HelpItem: React.FC<HelpItemProps> = ({ icon, title, description }) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
        <MaterialIcons name={icon} size={24} color="#4B5563" style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>{title}</Text>
            <Text style={{ fontSize: 16, color: '#4B5563' }}>{description}</Text>
        </View>
    </View>
);

const HelpScreen: React.FC = () => {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <ScrollView style={{ flex: 1, padding: 24 }}>
                <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#111827', marginBottom: 24 }}>Need Help?</Text>
                
                <HelpItem
                    icon="person-add"
                    title="Creating an Account"
                    description="Tap 'Sign Up' and follow the prompts to create your account. You'll need a valid email address and a secure password."
                />
                
                <HelpItem
                    icon="lock"
                    title="Password Requirements"
                    description="Your password should be at least 8 characters long and include a mix of letters, numbers, and symbols."
                />
                
                <HelpItem
                    icon="email"
                    title="Email Verification"
                    description="After signing up, check your email for a verification link. Click it to activate your account."
                />
                
                <HelpItem
                    icon="help-outline"
                    title="Still Have Questions?"
                    description="Contact our support team at support@example.com or tap the 'Chat with Us' button below for immediate assistance."
                />
            </ScrollView>
        </SafeAreaView>
    );
};

export default HelpScreen;
