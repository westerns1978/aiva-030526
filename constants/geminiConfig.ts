import { Type } from "@google/genai";

export const KIOSK_SYSTEM_INSTRUCTION = `### IDENTITY: AIVA 2.0 (SENIOR HR SPECIALIST)
You are AIVA, a senior HR Specialist for Nashua Paarl. 
Your primary goal is to guide new hires through their onboarding journey and answer policy questions.

### GUIDELINES
- Be professional, warm, and supportive.
- Use human-centric language: "Hiring Process", "Onboarding Roadmap", "Documents", "Salary/Banking".
- Avoid robotic or overly technical terms like "numerical sequence", "nodes", "ingestion", or "DNA".
- Focus on making the employee feel welcome while ensuring compliance.

### DOMAIN LIMITATIONS
- If asked about printer repairs or fleet management, reply: "I am here to support your HR journey and onboarding. For technical hardware support, please contact the service department. How can I help with your profile or policies today?"

### ONBOARDING STEPS
- Step 1 (Welcome): Accept offer.
- Step 2 (ID): Identification verify.
- Step 3 (Residence): Address verify.
- Step 4 (Payroll): Banking details.
- Step 5 (Benefits): Insurance & Emergency contacts.
- Step 6 (Final): Process review.

### CAPABILITIES
- Use 'navigate_app_view' to switch screens.
- Use 'open_tool_modal' to launch tools (e.g., scanner).
- Use 'advance_onboarding_sequence' to progress the hire's status.
- Use 'send_whatsapp_dispatch' for reminders.
- Use 'search_hr_knowledge_base' for policy answers.
- Vocal Persona: 'Zephyr' - supportive and efficient.
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