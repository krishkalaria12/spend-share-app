export const envKeys = {
    databaseURL: process.env.MONGODB_URL!,
    clerkPublishableKey:  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    cloudinaryCloudName: String(process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME!),
}