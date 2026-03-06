import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import type { ExtractedDocumentData, InterviewFeedback } from '../types';
import { GCS_REGISTRY } from '../constants';
import { SEARCH_GROUNDING_TOOL, MAPS_GROUNDING_TOOL } from '../constants/geminiConfig';

// Single Gemini client instance — lazy initialized
let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
    if (!aiInstance) {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            throw new Error("Gemini API Key is not configured. Please set GEMINI_API_KEY in your environment.");
        }
        aiInstance = new GoogleGenAI({ apiKey });
    }
    return aiInstance;
};

/**
 * Analyzes a document using Gemini Vision and returns structured data.
 * Optimized for South African ID, Proof of Residence, and Banking letters.
 */
export const analyzeDocument = async (
    blob: Blob,
    expectedType: 'id' | 'residence' | 'banking' | 'general'
): Promise<any> => {
    const ai = getAi();
    const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
    });

    const prompts: Record<string, string> = {
        id: `Analyze this South African ID document or passport. 
             Extract and return ONLY valid JSON with these fields:
             {
                "document_type": "SA ID" or "Passport",
                "full_name": "...",
                "id_number": "...",
                "date_of_birth": "...",
                "gender": "...",
                "nationality": "...",
                "confidence": 0.0 to 1.0
             }
             If you cannot read a field, set it to null.
             Return ONLY the JSON, no other text.`,
             
        residence: `Analyze this proof of residence document (utility bill, 
                    bank statement, or municipal account). 
                    Extract and return ONLY valid JSON:
                    {
                        "document_type": "Utility Bill" or "Bank Statement" or "Municipal Account",
                        "account_holder": "...",
                        "address": "...",
                        "date_issued": "...",
                        "provider": "...",
                        "confidence": 0.0 to 1.0
                    }
                    If you cannot read a field, set it to null.
                    Return ONLY the JSON, no other text.`,
                    
        banking: `Analyze this banking confirmation letter.
                  Extract and return ONLY valid JSON:
                  {
                      "document_type": "Bank Confirmation",
                      "account_holder": "...",
                      "bank_name": "...",
                      "branch_code": "...",
                      "account_number": "...",
                      "account_type": "Savings" or "Current" or "...",
                      "confidence": 0.0 to 1.0
                  }
                  If you cannot read a field, set it to null.
                  Return ONLY the JSON, no other text.`,
                  
        general: `Analyze this document. Identify what type it is and 
                  extract key information. Return ONLY valid JSON:
                  {
                      "document_type": "...",
                      "summary": "Brief one-line summary",
                      "key_fields": { ... any relevant fields },
                      "confidence": 0.0 to 1.0
                  }
                  Return ONLY the JSON, no other text.`
    };

    const prompt = prompts[expectedType] || prompts.general;

    try {

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: blob.type || 'image/jpeg', data: base64Data } }
                ]
            },
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const text = response.text || '{}';
        const clean = text.replace(/```json\n?|```\n?/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        console.error("[geminiService] analyzeDocument failed:", e);
        return { document_type: 'Unknown', confidence: 0 };
    }
};

export const queryCorporateRegistry = async (userQuery: string, templateKey: keyof typeof GCS_REGISTRY.TEMPLATES): Promise<string> => {
    const templateName = GCS_REGISTRY.TEMPLATES[templateKey];
    const templateUri = `${GCS_REGISTRY.BASE_URL}${templateName}`;

    const response = await getAi().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `You are an HR expert at Nashua Paarl. Analyze the document at this location: ${templateUri}. Query: ${userQuery}`,
        config: { thinkingConfig: { thinkingBudget: 1024 } }
    });
    return response.text || "Intelligence extraction timeout.";
}

export const generateSearchGroundedContent = async (prompt: string): Promise<GenerateContentResponse> => {

    return await getAi().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            tools: SEARCH_GROUNDING_TOOL,
            thinkingConfig: { thinkingBudget: 0 }
        },
    });
};

export const generateGroundedContent = async (prompt: string, location: { latitude: number, longitude: number }): Promise<GenerateContentResponse> => {

    return await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: MAPS_GROUNDING_TOOL,
            toolConfig: {
                retrievalConfig: {
                    latLng: {
                        latitude: location.latitude,
                        longitude: location.longitude
                    }
                }
            },
            thinkingConfig: { thinkingBudget: 0 }
        },
    });
};

export const extractDocumentDna = async (blob: Blob): Promise<{ title: string; summary: string; tags: string[] }> => {
    const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
    });

    try {

        const response = await getAi().models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: {
                parts: [
                    { inlineData: { mimeType: blob.type, data: base64Data } },
                    { text: "Extract document details. Return strict JSON: { 'title': string, 'summary': string, 'tags': string[] }" }
                ]
            },
            config: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        return { title: 'Document Captured', summary: 'Document saved for review.', tags: ['manual_audit'] };
    }
};

/**
 * Specialized identity extraction for the WhatsApp mirror flow.
 * Returns structured data for immediate confirmation in chat.
 */
export const analyzeIdForWhatsApp = async (imageBytes: string, mimeType: string): Promise<ExtractedDocumentData> => {

    const response = await getAi().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { mimeType, data: imageBytes } },
                { text: "Extract identity details from this WhatsApp photo. Focus on 'fullName' and 'idNumber'. Return strict JSON. If unreadable, return { 'error': 'UNREADABLE', 'message': 'Please resend a clearer photo' }." }
            ]
        },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const processDocumentWithGemini = async (documentBlob: Blob, documentType: string): Promise<ExtractedDocumentData> => {
    // Determine the most appropriate mapping
    let expectedType: 'id' | 'residence' | 'banking' | 'general' = 'general';
    const low = documentType.toLowerCase();
    if (low.includes('id') || low.includes('passport')) expectedType = 'id';
    else if (low.includes('residence') || low.includes('address') || low.includes('utility')) expectedType = 'residence';
    else if (low.includes('bank') || low.includes('remuneration')) expectedType = 'banking';

    const analysis = await analyzeDocument(documentBlob, expectedType);
    return {
        fullName: analysis.full_name || analysis.account_holder,
        idNumber: analysis.id_number,
        dateOfBirth: analysis.date_of_birth,
        address: analysis.address,
        bankName: analysis.bank_name,
        accountNumber: analysis.account_number,
        branchCode: analysis.branch_code,
        confidence: analysis.confidence,
        documentType: analysis.document_type
    };
};

export const generateComprehensiveBiAnalysis = async (data: any) => {

    const response = await getAi().models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: `Provide a senior executive audit and insights for this Nashua franchise: ${JSON.stringify(data)}. Identify growth opportunities and workforce deltas.`,
        config: { thinkingConfig: { thinkingBudget: 1024 } }
    });
    return { summary: response.text };
}

export const createAivaChat = (systemInstruction: string) => {

    return getAi().chats.create({
        model: 'gemini-3-flash-preview', 
        config: { systemInstruction, thinkingConfig: { thinkingBudget: 0 } }
    });
};

export const generateContent = async (prompt: string): Promise<string> => {

    const response = await getAi().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text || '';
};

export const analyzeOnSiteImage = async (imageBlob: Blob, language: string): Promise<string> => {
    const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(imageBlob);
    });
    try {

        const response = await getAi().models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: {
                parts: [
                    { inlineData: { mimeType: imageBlob.type, data: base64Data } },
                    { text: `Analyze this image in ${language}. Describe what you see, focusing on any relevant business or operational context.` }
                ]
            },
            config: { thinkingConfig: { thinkingBudget: 0 } }
        });
        return response.text || '';
    } catch (e) {
        console.error("Analysis error:", e);
        return "Analysis unavailable.";
    }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {

    const response = await getAi().models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

export const transcribeAudioWithGemini = async (audioBlob: Blob): Promise<string> => {
    const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(audioBlob);
    });

    const response = await getAi().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: audioBlob.type, data: base64Data } },
                { text: "Transcribe the following audio precisely." }
            ]
        },
        config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text || '';
};

export const getInterviewFeedbackFromGemini = async (transcript: string, question: string): Promise<InterviewFeedback> => {

    const response = await getAi().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Evaluate this interview answer for the question: "${question}". Answer: "${transcript}". Provide feedback in strict JSON format matching the InterviewFeedback interface: { starAnalysis: string, clarity: string, strengths: string, improvements: string }. Use markdown for descriptions.`,
        config: { 
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    starAnalysis: { type: Type.STRING },
                    clarity: { type: Type.STRING },
                    strengths: { type: Type.STRING },
                    improvements: { type: Type.STRING }
                },
                required: ['starAnalysis', 'clarity', 'strengths', 'improvements']
            },
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    const resultText = response.text || '{}';
    return JSON.parse(resultText);
};