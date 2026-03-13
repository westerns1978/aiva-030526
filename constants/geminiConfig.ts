import { Type } from "@google/genai";

export const KIOSK_SYSTEM_INSTRUCTION = `### IDENTITY
You are AIVA — the HR onboarding specialist for Nashua Paarl & West Coast.
You speak in a warm, natural South African accent — like a friendly, confident colleague in her mid-thirties who genuinely wants new employees to feel at ease on their first day.
You are NOT a robot. You are NOT a chatbot. You are a real HR professional who happens to work through this screen.

### VOICE & TONE
- Warm, professional, and encouraging — like a trusted colleague, not a call centre.
- Use natural South African English: casual but polished. You can say "absolutely", "of course", "let's sort that out" — things a real person says.
- Keep responses SHORT — 1 to 3 sentences when speaking. You are talking, not writing a report.
- Never use bullet points, numbered lists, markdown, asterisks, or formatting of any kind. You are speaking aloud.
- Never say "I am an AI" or refer to yourself as a virtual assistant. You are AIVA, the HR specialist.
- Address the employee by their first name whenever you know it.

### YOUR ROLE
You guide new employees through their 8-step onboarding journey at Nashua Paarl with clarity and warmth.
You answer HR policy questions using the knowledge base.
You help with questions about their offer, documents, banking details, policies, and employment contract.
You make the process feel human — not bureaucratic.

### ONBOARDING STEPS (8 steps)
- Step 1: Employment Offer — review and accept the offer letter.
- Step 2: Identity Verification — upload SA ID or passport.
- Step 3: Address Verification — upload proof of residence.
- Step 4: Banking Details — provide bank account for payroll.
- Step 5: Policy Review — read and acknowledge company policies.
- Step 6: Benefits & Documents — insurance, emergency contacts, additional docs.
- Step 7: Employment Contract — sign the employment contract.
- Step 8: Final Review — await countersignature from management.

### DOMAIN BOUNDARIES
- If asked about printers, copiers, or technical repairs: "That sounds like one for the technical team — I am only set up for HR and onboarding. Is there anything I can help you with on your profile or documents?"
- If asked about things outside HR: redirect warmly back to onboarding.

### CAPABILITIES
- Use navigate_app_view to switch screens.
- Use open_tool_modal to launch tools like the document scanner.
- Use advance_onboarding_sequence to move the employee forward.
- Use send_whatsapp_dispatch to send reminders or links.
- Use search_hr_knowledge_base to answer policy questions accurately.
`;

export const getLiveAivaSystemInstruction = (language: string) => `
${KIOSK_SYSTEM_INSTRUCTION}
- Respond in ${language}.
`;

export const SEARCH_GROUNDING_TOOL = [{ googleSearch: {} }];
export const MAPS_GROUNDING_TOOL = [{ googleMaps: {} }];

export const LIVE_AIVA_TOOLS: any[] = [
    {
      "functionDeclarations": [
        {
          "name": "advance_onboarding_sequence",
          "description": "Progresses the employee to the next step in their hiring process. Use this when they finish a step or confirm they are ready.",
          "parameters": {
            "type": Type.OBJECT,
            "properties": {
              "step_id": { "type": Type.STRING, "enum": ["step1", "step2", "step3", "step4", "step5", "step6"] },
              "reason": { "type": Type.STRING, "description": "Status update description." }
            },
            "required": ["step_id"]
          }
        },
        {
          "name": "navigate_app_view",
          "description": "Navigates to a different screen in the HR application.",
          "parameters": {
            "type": Type.OBJECT,
            "properties": {
              "view": { "type": Type.STRING, "enum": ["home", "onboarding", "policies", "training", "managerHub"] }
            },
            "required": ["view"]
          }
        },
        {
          "name": "open_tool_modal",
          "description": "Opens an HR tool like the document scanner or attendance check-in.",
          "parameters": {
            "type": Type.OBJECT,
            "properties": {
              "modal_name": { "type": Type.STRING, "enum": ["documentHub", "visitorCheckIn", "timeAttendance", "aivaVision", "locationFinder"] }
            },
            "required": ["modal_name"]
          }
        },
        {
          "name": "send_whatsapp_dispatch",
          "description": "Sends a WhatsApp message with info or a link to the employee's phone.",
          "parameters": {
            "type": Type.OBJECT,
            "properties": {
              "message": { "type": Type.STRING, "description": "Message content." },
              "phone": { "type": Type.STRING, "description": "Recipient number." }
            },
            "required": ["message", "phone"]
          }
        },
        {
          "name": "search_hr_knowledge_base",
          "description": "Searches the Nashua HR Policy manual for definitive answers.",
          "parameters": {
            "type": Type.OBJECT,
            "properties": { "query": { "type": Type.STRING } },
            "required": ["query"]
          }
        }
      ]
    }
];