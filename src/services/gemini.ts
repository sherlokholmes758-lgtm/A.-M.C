import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface VisionResult {
  objects: {
    label: string;
    confidence: number;
    box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  }[];
  description: string;
  text_ocr?: string;
}

export async function analyzeFrame(base64Image: string): Promise<VisionResult> {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        {
          text: "Analyse cette image. Retourne un objet JSON avec 'objects' (liste d'objets détectés avec label, confidence entre 0 et 1, et box_2d [ymin, xmin, ymax, xmax] normalisé de 0 à 1000), 'description' (une phrase courte) et 'text_ocr' (si du texte est visible).",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          objects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                box_2d: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                },
              },
              required: ["label", "confidence", "box_2d"],
            },
          },
          description: { type: Type.STRING },
          text_ocr: { type: Type.STRING },
        },
        required: ["objects", "description"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return { objects: [], description: "Erreur d'analyse" };
  }
}
