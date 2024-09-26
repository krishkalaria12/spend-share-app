import { envKeys } from "@/lib/env";
import { Cloudinary } from "@cloudinary/url-gen";

export const cld = new Cloudinary({
    cloud: {
        cloudName: envKeys.cloudinaryCloudName,
    },
    url: {
        secure: true
    }
})