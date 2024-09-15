import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";
import { fetchAPI } from "@/lib/fetch";

export interface TokenCache {
    getToken: (key: string) => Promise<string | undefined | null>;
    saveToken: (key: string, token: string) => Promise<void>;
    clearToken?: (key: string) => void;
}

export const tokenCache = {
    async getToken(key: string) {
        try {
            const item = await SecureStore.getItemAsync(key);
            if (item) {
                console.log(`${key} was used 🔐 \n`);
            } else {
                console.log("No values stored under key: " + key);
            }
            return item;
        } catch (error) {
            console.error("SecureStore get item error: ", error);
            await SecureStore.deleteItemAsync(key);
            return null;
        }
    },

    async saveToken(key: string, value: string) {
        try {
            return SecureStore.setItemAsync(key, value);
        } catch (err) {
            return;
        }
    },
};

export const googleOAuth = async (startOAuthFlow: any) => {
    try {
        const { createdSessionId, setActive, signUp } = await startOAuthFlow({
            redirectUrl: Linking.createURL("/(tabs)/home"),
        });

        if (createdSessionId) {
            if (setActive) {
                await setActive({ session: createdSessionId });

                if (signUp.createdUserId) {
                    await fetchAPI("/(api)/user", {
                        method: "POST",
                        body: JSON.stringify({
                            clerkId: signUp.createdUserId,
                            username: signUp.username || `user${Date.now()}`, // Generate a default username if not provided
                            email: signUp.emailAddress,
                            fullName: `${signUp.firstName} ${signUp.lastName}`,
                            avatar: signUp.imageUrl || "https://utfs.io/f/zDChzk2sNFdiA7tAXerYrEUV5sR61fmF9eAzIQNdoPjbinw0",
                        }),
                    });
                }

                return {
                    success: true,
                    code: "success",
                    message: "You have successfully signed in with Google",
                };
            }
        }

        return {
            success: false,
            message: "An error occurred while signing in with Google",
        };
    } catch (err: any) {
        console.error(err);
        return {
            success: false,
            code: err.code,
            message: err?.errors[0]?.longMessage,
        };
    }
};