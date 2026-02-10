
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Utility function to handle retries with exponential backoff.
 */
const withRetry = async <T>(fn: () => Promise<T>, retries = 2, delay = 5000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorString = JSON.stringify(error);
    const isQuotaError = 
      error?.message?.includes("429") || 
      error?.status === 429 || 
      error?.error?.code === 429 ||
      errorString.includes("429") ||
      errorString.includes("RESOURCE_EXHAUSTED");
    
    if (retries > 0 && isQuotaError) {
      console.warn(`Gemini Quota exceeded. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const analyzeAirspaceSafety = async (drones: any[], alerts: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    return await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the current drone traffic state. Drones: ${JSON.stringify(drones)}. Alerts: ${JSON.stringify(alerts)}. Provide a 2-sentence safety recommendation.`,
        config: {
          systemInstruction: "You are a professional Air Traffic Controller for autonomous drone systems.",
          temperature: 0.7,
        }
      });
      return response.text;
    });
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    return "Error generating safety analysis.";
  }
};

/**
 * Uses Google Maps Grounding to find landmarks near the user.
 */
export const searchNearbyPlaces = async (lat: number, lng: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    return await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Identify the top 5 key landmarks or infrastructure hubs near this location for drone logistics mapping.",
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: lat,
                longitude: lng
              }
            }
          }
        },
      });
      
      // Extract grounding chunks for rendering links and mapping
      const text = response.text;
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      return { text, chunks };
    });
  } catch (error: any) {
    console.error("Maps Grounding Error:", error);
    return { text: "Failed to scan local infrastructure sector.", chunks: [] };
  }
};

export const editImage = async (base64Image: string, prompt: string, mimeType: string = 'image/png') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return await withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  });
};
