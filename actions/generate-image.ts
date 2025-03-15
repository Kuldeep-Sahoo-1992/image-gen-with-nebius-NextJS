"use server";

import { OpenAI } from "openai";
import { v2 as cloudinary } from "cloudinary";
import stream from "stream";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const client = new OpenAI({
  baseURL: "https://api.studio.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY || "",
});

type GeneratedImage = {
  url: string;
  alt: string;
};

// Function to upload image buffer to Cloudinary
const uploadToCloudinary = async (imageBuffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "image", format: "webp" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          reject(new Error("Failed to upload image to Cloudinary."));
        } else {
          resolve(result?.secure_url || "");
        }
      }
    );

    const bufferStream = new stream.PassThrough();
    bufferStream.end(imageBuffer);
    bufferStream.pipe(uploadStream);
  });
};

export async function generateImage(prompt: string): Promise<GeneratedImage[]> {
  try {
    // Generate image using OpenAI API
    const response = await client.images.generate({
      model: "black-forest-labs/flux-schnell",
      response_format: "b64_json",
      response_extension: "webp",
      width: 1024,
      height: 1024,
      num_inference_steps: 4,
      negative_prompt: "",
      seed: -1,
      prompt: prompt,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("No images were generated.");
    }

    // Upload images to Cloudinary
    const uploadedImages = await Promise.all(
      response.data.map(async (img: any, index: number) => {
        const imageBuffer = Buffer.from(img.b64_json, "base64");
        const imageUrl = await uploadToCloudinary(imageBuffer);

        return {
          url: imageUrl,
          alt: `Generated image ${index + 1} for prompt: ${prompt}`,
        };
      })
    );

    return uploadedImages;
  } catch (error) {
    console.error("Error generating or uploading image:", error);
    throw new Error("Failed to generate or upload image. Please try again.");
  }
}
