import { GoogleGenAI } from "@google/genai";
import { DiseaseInfo } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getGeminiSDK(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || "";
    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY is not defined in the environment. Please add it to your .env file or Render settings.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

async function generateContentWithRetry(client: GoogleGenAI, options: any, maxRetries = 3) {
  let delay = 1200;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await client.models.generateContent(options);
    } catch (err: any) {
      const errStr = JSON.stringify(err) || "";
      const errMsg = err.message || "";
      
      const isRateLimit = err.status === 429 || 
                          err.code === 429 ||
                          errMsg.includes("429") || 
                          errMsg.includes("quota") || 
                          errMsg.includes("RESOURCE_EXHAUSTED") ||
                          errStr.includes("429") ||
                          errStr.includes("quota");
                          
      const isUnavailable = err.status === 503 || 
                            err.code === 503 ||
                            errMsg.includes("503") || 
                            errMsg.includes("UNAVAILABLE") || 
                            errMsg.includes("high demand") ||
                            errStr.includes("503") ||
                            errStr.includes("UNAVAILABLE");
      
      if ((isRateLimit || isUnavailable) && attempt < maxRetries - 1) {
        console.warn(`[Gemini Retry] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw err;
      }
    }
  }
  throw new Error("Failed to generate content after retries.");
}

export async function analyzeSkinImage(imageData: string, mimeType: string, customDiseases: DiseaseInfo[]): Promise<any> {
  const client = getGeminiSDK();
  const cleanBase64 = imageData.replace(/^data:image\/\w+;base64,/, "");

  let customDiseasePrompt = "";
  if (customDiseases && customDiseases.length > 0) {
    customDiseasePrompt = `
Additional custom diseases registered in the system's database to consider or classify against if they match:
${customDiseases.map((d) => `- ${d.name}: ${d.description}. Specialist: ${d.specialist}. Severity: ${d.severity}. Symptoms: ${d.symptoms.join(", ")}. Precautions: ${d.precautions.join(", ")}`).join("\n")}
`;
  }

  const systemPrompt = `
You are an expert dermatological artificial intelligence diagnostic tool.
Your job is to first analyze if the provided image is a clear, decently-lit clinical photograph showing a skin condition, a human skin patch, or a dermatological issue.
If the image is blurry, out-of-focus, contains extremely poor lighting, has zero visible skin/dermatological area, or is an entirely unrelated subject (such as a document, landscape, text, a pet, or household item), you MUST mark "is_valid_image" as false and explain the issue in "rejection_reason".

Otherwise, if it is a valid skin image, mark "is_valid_image" as true, set "rejection_reason" to empty or N/A, and provide a full structured diagnostic report.
${customDiseasePrompt}

Please provide a structured, detailed medical diagnostic report.
You must return your response STRICTLY as a JSON object matching the requested schema.

DISCLAIMER: Always emphasize that this is for informational support only, but analyze the image as accurately as possible based on visual indicators.
`;

  const userPrompt = "Analyze this image. Assess its quality and determine if it is a suitable skin image. If so, detect the potential skin condition/disease. Provide confidence score, symptoms, causes, severity level, treatment suggestions, precautions, medicines (for informational support only), and recommended medical specialist.";

  const schema = {
    type: "OBJECT",
    properties: {
      is_valid_image: { 
        type: "BOOLEAN",
        description: "True if the image is a clear, well-lit human skin condition photo suitable for clinical dermatological analysis. False if it is blurry, extremely low quality, or completely unrelated to skin diseases."
      },
      rejection_reason: { 
        type: "STRING",
        description: "A polite, friendly error message explaining why the image cannot be analyzed (e.g. too blurry, poor light, or unrelated) and asking the user to upload a neat and quality skin image."
      },
      disease_name: { type: "STRING", description: "The name of the detected skin disease or condition. Use 'N/A' if is_valid_image is false." },
      confidence: { type: "NUMBER", description: "A confidence score between 0.0 and 1.0 representing classification probability. Set to 0.0 if is_valid_image is false." },
      description: { type: "STRING", description: "A comprehensive description of the skin condition. Set to 'N/A' if is_valid_image is false." },
      symptoms: { 
        type: "ARRAY", 
        items: { type: "STRING" },
        description: "List of common symptoms shown in the image or typical of this condition. Return empty array if is_valid_image is false."
      },
      causes: { 
        type: "ARRAY", 
        items: { type: "STRING" },
        description: "Common causes or triggers for this condition. Return empty array if is_valid_image is false."
      },
      severity: { 
        type: "STRING", 
        enum: ["Low", "Medium", "High", "Critical"],
        description: "The general severity category of this condition. Set to 'Low' if is_valid_image is false."
      },
      treatment: { 
        type: "ARRAY", 
        items: { type: "STRING" },
        description: "General clinical or home care treatment information. Return empty array if is_valid_image is false."
      },
      precautions: { 
        type: "ARRAY", 
        items: { type: "STRING" },
        description: "Immediate precautions the user should take. Return empty array if is_valid_image is false."
      },
      medicines: { 
        type: "ARRAY", 
        items: { type: "STRING" },
        description: "Representative medicines or active ingredients (over-the-counter or prescription), explicitly labeled as informational only. Return empty array if is_valid_image is false."
      },
      specialist: { 
        type: "STRING", 
        description: "The precise type of medical specialist to consult (e.g. Dermatologist, Allergist, Oncologist). Set to 'N/A' if is_valid_image is false."
      },
      emergencySigns: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Critical red flag warning signs that require immediate emergency medical attention. Return empty array if is_valid_image is false."
      }
    },
    required: [
      "is_valid_image",
      "rejection_reason",
      "disease_name",
      "confidence",
      "description",
      "symptoms",
      "causes",
      "severity",
      "treatment",
      "precautions",
      "medicines",
      "specialist"
    ]
  };

  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let response: any = null;
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      response = await generateContentWithRetry(client, {
        model: modelName,
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "image/jpeg"
            }
          },
          { text: systemPrompt },
          { text: userPrompt }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.2
        }
      });
      if (response) break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!response) {
    throw lastError || new Error("All backup diagnostic models are currently unavailable.");
  }

  const textResponse = response.text;
  if (!textResponse) {
    throw new Error("Empty response received from Gemini AI.");
  }

  return JSON.parse(textResponse);
}

export async function chatWithGemini(message: string, history: any[], language: string): Promise<string> {
  const client = getGeminiSDK();

  let systemInstruction = `
You are 'DermAI Medical Assistant', a highly trained, professional, and compassionate virtual medical advisor specializing in dermatology and general medicine.
Your goal is to answer medical, pathological, healthy-living, and dermatological questions accurately, clearly, and supportively.

Medications, Tablets & Symptoms Guidelines:
1. When asked about symptoms of ANY disease, condition, skin rash, or illness, provide a comprehensive breakdown of:
   - Early stage symptoms vs advanced symptoms.
   - Associated physical signs (appearance, sensation, timeline).
   - Critical red-flag warning signs that require urgent emergency medical attention.
2. When asked about medications or tablets for any condition:
   - Detail the standard classes of drugs (e.g., antihistamines, topical corticosteroids, systemic retinoids, antibiotics, anti-inflammatory medications).
   - Give examples of common generic tablet/drug names (and optionally popular brand names for clarity).
   - Explain the mechanism of action (how the tablet or ointment works inside the body or on the skin).
   - Highlight important usage directions, precautions (e.g., food interactions, pregnancy safety), and potential common/severe side-effects.
   - Crucially emphasize: Always consult with a licensed physician or dermatologist before starting, stopping, or altering any medication or tablet dosage. Never self-prescribe.

General Guidelines:
1. Provide detailed, well-structured, easy-to-understand explanations.
2. Maintain a compassionate, objective, and professional tone. Always prioritize user safety.
3. Include appropriate clinical disclaimers explaining that this is for educational and informational support, and should not replace a face-to-face consultation with a certified doctor or healthcare specialist.
4. Use formatting (bullet points, bold text) to make information scannable and clear.
5. If the question is completely unrelated to medical, biological, health, or skin concerns, politely redirect the user to keep the topic on health, medicine, or wellness.
6. FORMAT REQUIREMENT: You MUST ALWAYS split your response into a brief summary and full details:
   - Wrap a short 1-to-2 sentence high-level summary/conclusion inside [SUMMARY]...[/SUMMARY] tags.
   - Wrap the full detailed response (including formatting, bullet points, recommendations, and disclaimers) inside [DETAILS]...[/DETAILS] tags.
   - Example:
     [SUMMARY]A summary of the condition and immediate advice.[/SUMMARY]
     [DETAILS]Detailed symptoms, causes, remedies, and clinical disclaimers...[/DETAILS]
`;

  if (language) {
    systemInstruction += `\n7. LANGUAGE & BILINGUAL DIRECTION:
- The user's currently selected language is '${language}'.
- You must perfectly support simultaneous multilingual/bilingual inputs (e.g. users writing in a mix of English and Telugu words at the same time).
- If the user uses a mix of English and Telugu simultaneously, understand both perfectly and respond in the most helpful and recommendable language for their context (or a clear code-switched mix of Telugu and English if that is the most natural and recommendable way to explain medical terms).
- If the user explicitly asks you to change the language or requests you to talk in a specific language (e.g., "you can talk in english", "talk in telugu", "తెలుగులో మాట్లాడు", "ఇంగ్లీషులో మాట్లాడు", etc.), you MUST:
  1. Instantly switch your output response to that language.
  2. Append a special control instruction at the very end of your response, wrapped in a [SET_LANGUAGE]...[/SET_LANGUAGE] tag.
  Valid codes for the tags are:
  - 'en-US' for English
  - 'te-IN' for Telugu
  - 'hi-IN' for Hindi
  - 'es-ES' for Spanish
  - 'fr-FR' for French
  - 'zh-CN' for Chinese
  - 'de-DE' for German
  Example: If they ask to speak in English, append [SET_LANGUAGE]en-US[/SET_LANGUAGE] at the end. If they ask to speak in Telugu, append [SET_LANGUAGE]te-IN[/SET_LANGUAGE] at the end.`;
  }

  const contents: any[] = [];
  if (history && Array.isArray(history)) {
    history.forEach((turn: any) => {
      contents.push({
        role: turn.role === "user" ? "user" : "model",
        parts: [{ text: turn.text || "" }]
      });
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: message }]
  });

  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let response: any = null;
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      response = await generateContentWithRetry(client, {
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7
        }
      });
      if (response) break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!response) {
    throw lastError || new Error("All backup medical models are currently unavailable.");
  }

  return response.text || "I apologize, but I could not formulate a response at the moment.";
}
