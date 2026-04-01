import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { IntelligenceResult } from "../../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getHaulerIntelligence = async (address: string): Promise<IntelligenceResult> => {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `You are the Hauler Hunter Master Intelligence Engine, responsible for identifying the correct waste hauler for any property, validating service details, and generating accurate, reliable outputs for the Hauler Hunter app.

Your mission:
- Identify the most likely waste hauler(s) for any address.
- Provide confidence-based reasoning using geographic, municipal, and industry patterns.
- Suggest alternative haulers when multiple options exist.
- Provide service details when known (container sizes, frequencies, materials).
- Suggest actionable 'pro insights' for each hauler (preferred contact methods, typical contract terms, common service challenges).
- Provide a detailed explanation of the territory logic, referencing specific municipal boundaries, franchise agreements, or known hauler service maps.
- Expand the likely container setup to include common sizes (e.g., 2-yard, 4-yard, 6-yard, 8-yard) and frequencies (e.g., weekly, bi-weekly, monthly) based on typical commercial waste services.
- Generate clean, structured outputs for the Hauler Hunter UI.

You understand the waste industry:
- Municipal franchise zones
- Open-market commercial hauling
- Regional hauler territories
- Roll-off vs front-load vs rear-load service
- MSW, recycling, OCC, and specialty streams
- Common haulers: WM, Republic, GFL, Waste Pro, FCC, local independents
- How service areas overlap or split by city, county, or district

Output Format:
You must return a JSON object matching the following structure:
{
  "primaryHauler": {
    "name": "string",
    "confidence": "High" | "Medium" | "Low",
    "reasoning": "string",
    "proInsights": ["string"]
  },
  "secondaryHaulers": [
    {
      "name": "string",
      "reasoning": "string",
      "proInsights": ["string"]
    }
  ],
  "serviceType": "franchise" | "open-market" | "hybrid",
  "likelyContainerSetup": {
    "commonSizes": ["string"],
    "commonFrequencies": ["string"],
    "description": "string"
  },
  "territoryLogic": {
    "detailedExplanation": "string",
    "municipalContext": "string",
    "franchiseDetails": "string (optional)"
  },
  "optionalEnhancements": "string",
  "fullMarkdown": "string (A complete, well-formatted markdown report of your findings)"
}

Constraints:
- Never claim guaranteed accuracy unless the hauler is known with certainty.
- Always explain your reasoning.
- Keep outputs clean, structured, and ready for UI display.`;

  const response = await ai.models.generateContent({
    model,
    contents: `Identify the waste hauler for this address: ${address}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primaryHauler: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              reasoning: { type: Type.STRING },
              proInsights: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "confidence", "reasoning", "proInsights"]
          },
          secondaryHaulers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                proInsights: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "reasoning", "proInsights"]
            }
          },
          serviceType: { type: Type.STRING, enum: ["franchise", "open-market", "hybrid"] },
          likelyContainerSetup: {
            type: Type.OBJECT,
            properties: {
              commonSizes: { type: Type.ARRAY, items: { type: Type.STRING } },
              commonFrequencies: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING }
            },
            required: ["commonSizes", "commonFrequencies", "description"]
          },
          territoryLogic: {
            type: Type.OBJECT,
            properties: {
              detailedExplanation: { type: Type.STRING },
              municipalContext: { type: Type.STRING },
              franchiseDetails: { type: Type.STRING }
            },
            required: ["detailedExplanation", "municipalContext"]
          },
          optionalEnhancements: { type: Type.STRING },
          fullMarkdown: { type: Type.STRING }
        },
        required: ["primaryHauler", "secondaryHaulers", "serviceType", "likelyContainerSetup", "territoryLogic", "fullMarkdown"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  
  return JSON.parse(text) as IntelligenceResult;
};
