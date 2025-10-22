import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function generateCompletion(prompt: string): Promise<string> {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate AI response");
  }
}

export async function generateStructuredResponse<T>(
  prompt: string,
  schema: string
): Promise<T> {
  try {
    const fullPrompt = `${prompt}\n\nRespond with valid JSON matching this schema:\n${schema}\n\nReturn ONLY the JSON, no additional text.`;
    const result = await geminiModel.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (handle cases where model adds markdown)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini Structured Response Error:", error);
    throw new Error("Failed to generate structured AI response");
  }
}

