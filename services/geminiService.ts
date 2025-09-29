import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { EditedImageResult } from '../types';

 

export const editImageWithNanoBanana = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  mask?: { base64Data: string; mimeType: string }
): Promise<EditedImageResult> => {
  try {
    const imagePart = {
      inlineData: {
        data: base64ImageData,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: prompt,
    };

    const parts: (typeof imagePart | typeof textPart)[] = [imagePart];

    if (mask) {
      const maskPart = {
        inlineData: {
          data: mask.base64Data,
          mimeType: mask.mimeType,
        },
      };
      parts.push(maskPart);
    }

    parts.push(textPart);

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    console.log(`Using API Key: ${apiKey?.substring(0, 4)}...${apiKey?.slice(-4)}`); // Debug log
    if (!apiKey) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: parts,
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const result: EditedImageResult = { image: null, text: null };

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        result.text = (result.text || "") + part.text;
      } else if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        result.image = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    
    if (!result.image && !result.text) {
        throw new Error("The model did not return an image or text. Please try a different prompt.");
    }

    return result;

  } catch (error) {
    console.error("Error editing image with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to edit image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while editing the image.");
  }
};

export const generateImageFromText = async (
  prompt: string
): Promise<EditedImageResult> => {
  try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const result: EditedImageResult = { image: null, text: null };

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        result.text = (result.text || "") + part.text;
      } else if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        result.image = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }

    if (!result.image && !result.text) {
      throw new Error("The model did not return an image or text. Please try a different prompt.");
    }

    return result;

  } catch (error) {
    console.error("Error generating image with Gemini API:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the image.");
  }
};