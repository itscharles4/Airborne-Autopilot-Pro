
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
  try {
    // For now, return a processed version with visual feedback
    // In production, this would call the actual Gemini image API
    
    // Create a mock processing by applying canvas filters based on prompt
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    
    // Create image element
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Apply filters based on prompt content
      if (prompt.toLowerCase().includes('night vision') || prompt.toLowerCase().includes('thermal')) {
        // Night vision effect
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Convert to greenish tone for night vision
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray * 0.5;      // Red
          data[i + 1] = gray * 1.2;  // Green (enhanced)
          data[i + 2] = gray * 0.3;  // Blue
        }
        ctx.putImageData(imageData, 0, 0);
      } 
      else if (prompt.toLowerCase().includes('cinematic') || prompt.toLowerCase().includes('retro')) {
        // Increase contrast
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const contrast = 1.5;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, (data[i] - 128) * contrast + 128);
          data[i + 1] = Math.min(255, (data[i + 1] - 128) * contrast + 128);
          data[i + 2] = Math.min(255, (data[i + 2] - 128) * contrast + 128);
        }
        ctx.putImageData(imageData, 0, 0);
      } 
      else if (prompt.toLowerCase().includes('fog') || prompt.toLowerCase().includes('haze')) {
        // Increase brightness to simulate fog removal
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.2);
          data[i + 1] = Math.min(255, data[i + 1] * 1.2);
          data[i + 2] = Math.min(255, data[i + 2] * 1.2);
        }
        ctx.putImageData(imageData, 0, 0);
      } 
      else if (prompt.toLowerCase().includes('saturation') || prompt.toLowerCase().includes('boost')) {
        // Increase saturation
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const l = (max + min) / 2;
          
          if (max !== min) {
            const s = l < 128 ? (max - min) / (max + min) : (max - min) / (510 - max - min);
            const h = max === r ? ((g - b) / (max - min)) : max === g ? (2 + (b - r) / (max - min)) : (4 + (r - g) / (max - min));
            
            const ss = s * 1.5; // Increase saturation
            const ll = l / 255;
            
            const c = (1 - Math.abs(2 * ll - 1)) * ss;
            const x = c * (1 - Math.abs((h / 60) % 2 - 1));
            const m = ll - c / 2;
            
            let rr = 0, gg = 0, bb = 0;
            if (h < 60) { rr = c; gg = x; }
            else if (h < 120) { rr = x; gg = c; }
            else if (h < 180) { gg = c; bb = x; }
            else if (h < 240) { gg = x; bb = c; }
            else if (h < 300) { rr = x; bb = c; }
            else { rr = c; bb = x; }
            
            data[i] = Math.min(255, (rr + m) * 255);
            data[i + 1] = Math.min(255, (gg + m) * 255);
            data[i + 2] = Math.min(255, (bb + m) * 255);
          }
        }
        ctx.putImageData(imageData, 0, 0);
      } 
      else if (prompt.toLowerCase().includes('monochrome') || prompt.toLowerCase().includes('grayscale')) {
        // Convert to grayscale
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        ctx.putImageData(imageData, 0, 0);
      }
      
      // Return the processed image
      return canvas.toDataURL(mimeType);
    };
    
    img.src = `data:${mimeType};base64,${base64Image}`;
    
    // Return promise with the processed image
    return new Promise<string>((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Apply filters based on prompt
        if (prompt.toLowerCase().includes('night vision') || prompt.toLowerCase().includes('thermal')) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray * 0.5;
            data[i + 1] = gray * 1.2;
            data[i + 2] = gray * 0.3;
          }
          ctx.putImageData(imageData, 0, 0);
        } 
        else if (prompt.toLowerCase().includes('monochrome') || prompt.toLowerCase().includes('grayscale')) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }
          ctx.putImageData(imageData, 0, 0);
        }
        else if (prompt.toLowerCase().includes('cinematic') || prompt.toLowerCase().includes('retro')) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, (data[i] - 128) * 1.5 + 128);
            data[i + 1] = Math.min(255, (data[i + 1] - 128) * 1.5 + 128);
            data[i + 2] = Math.min(255, (data[i + 2] - 128) * 1.5 + 128);
          }
          ctx.putImageData(imageData, 0, 0);
        }
        else if (prompt.toLowerCase().includes('fog') || prompt.toLowerCase().includes('haze')) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.2);
            data[i + 1] = Math.min(255, data[i + 1] * 1.2);
            data[i + 2] = Math.min(255, data[i + 2] * 1.2);
          }
          ctx.putImageData(imageData, 0, 0);
        }
        else if (prompt.toLowerCase().includes('saturation') || prompt.toLowerCase().includes('boost')) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.3);
            data[i + 1] = Math.min(255, data[i + 1] * 1.3);
            data[i + 2] = Math.min(255, data[i + 2] * 1.3);
          }
          ctx.putImageData(imageData, 0, 0);
        }
        
        resolve(canvas.toDataURL(mimeType));
      };
    });
  } catch (error: any) {
    console.error("Image Enhancement Error:", error);
    return null;
  }
};
