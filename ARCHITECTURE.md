
# AIVA (Afridroids Intelligent Virtual Assistant) Architecture

## 1. Executive Summary
Aiva is a Progressive Web Application (PWA) designed to serve as a comprehensive HR and Operations automation platform. It leverages **Google Gemini 3.0** for agentic reasoning and multimodal analysis, and **Gemini Live API** for low-latency voice interactions. It acts as the central interface for employees, managers, and seasonal workers, bridging the gap between digital systems and physical hardware via the MCP (Model Context Protocol) Orchestrator.

## 2. Technology Stack

*   **Frontend:** React 19 (TypeScript), Vite, Tailwind CSS
*   **State Management:** React Context API (`AppContext`)
*   **AI Engine:** `@google/genai` SDK
    *   *Text/Reasoning:* `gemini-3-pro-preview` (Chain-of-Thought enabled)
    *   *Voice:* `gemini-2.5-flash-native-audio-preview-09-2025` (WebSocket)
    *   *Vision:* `gemini-3-pro-preview` (Multimodal)
    *   *TTS:* `gemini-2.5-flash-preview-tts`
*   **Hardware Interface:** WebSocket connection to `flowhub-mcp` (Python-based Orchestrator)
*   **Offline Support:** Service Worker (App Shell model)

## 3. Core Agentic Concepts

Aiva utilizes **Gemini 3.0** not just as a chatbot, but as an autonomous agent capable of reasoning and tool execution.

### 3.1 Chain-of-Thought Reasoning
We explicitly enable `thinking_config: { thinking_level: "HIGH" }` in `geminiService.ts`. This allows Aiva to "think" before responding, which is critical for:
*   **Policy Analysis:** Breaking down complex labor laws in the RAG knowledge base.
*   **Safety Audits:** Calculating risk scores from visual inputs (`AivaVision`).
*   **Data Correlation:** Identifying trends in the BI Dashboard (e.g., correlating turnover with compliance).

### 3.2 Tool Use (Function Calling)
Aiva interacts with the app via defined tools in `geminiConfig.ts`:
*   `navigate_to_view(view)`: Contextual navigation.
*   `open_modal(modal_name)`: Opening specific workflows (e.g., Onboarding).
*   `search_afridroids_knowledge_base(query)`: RAG retrieval.
*   `get_business_intelligence_context()`: Retrieving JSON data for analysis.

## 4. RAG Implementation (Retrieval-Augmented Generation)

### 4.1 Knowledge Source
The "source of truth" is `constants/ragKnowledgeBase.ts`, which contains:
*   Strategic pillars (Profitability, Ethics, Robotics Roadmap).
*   HR Policies (Leave, Probation, Remuneration).
*   Operational Guidelines (Time & Attendance).

### 4.2 Retrieval Logic
When a user asks a policy question:
1.  Gemini detects the intent and calls `search_afridroids_knowledge_base`.
2.  `ragService.ts` performs a semantic/keyword search against the knowledge base.
3.  The relevant text chunk is returned to the model context.
4.  Gemini synthesizes the answer, citing the source.

## 5. Hardware Integration (MCP)

Aiva controls physical office hardware (scanners, robots) through a unified abstraction layer.

### 5.1 Architecture
`Aiva PWA` <--> `mcpService.ts` (WebSocket) <--> `FlowHub MCP Orchestrator` <--> `TWAIN Bridges`

### 5.2 Simulation Mode
To ensure stability during demos when hardware is offline, `mcpService.ts` includes a **Simulation Mode**. If the WebSocket fails to connect, it:
1.  Sets status to `connected` (simulated).
2.  Intercepts API calls in `mcpApi.ts` and returns realistic mock objects (e.g., "HP ScanJet 7000").
3.  Prevents UI errors/toasts regarding connection failures.

## 6. Security & Compliance

*   **POPIA Compliance:** All data processing is local or transient. No PII is persisted in the frontend state beyond the session.
*   **Role-Based Access:** The UI adapts dynamically based on the `persona` (Manager, Employee, Seasonal Worker).
*   **Zero-Rated Data Strategy:** The architecture supports the "Closed-Loop" WhatsApp strategy by minimizing heavy payload transfers for seasonal workers.

## 7. Production Backend Strategy

To move from this Demo/Prototype to a deployable Enterprise Product, the backend will evolve as follows:

### Phase 1: Serverless Orchestration (Google Cloud Functions)
*   **Goal:** Secure the API Key and centralize logic.
*   **Action:** Move `geminiService.ts` logic to a Python-based Cloud Function.
*   **Benefit:** The frontend no longer exposes the `API_KEY`. Custom logic can be updated without redeploying the frontend.

### Phase 2: Persistent Data Layer (Firestore)
*   **Goal:** User accounts, audit trails, and persistent onboarding status.
*   **Action:** Replace the in-memory `MOCK_PERMANENT_STAFF` with a Firestore database.
*   **Structure:**
    *   `users/{userId}`: Profile, Role, Avatar URL.
    *   `onboarding/{userId}`: Document status, verification results.
    *   `audit_logs/{logId}`: Timestamped record of every AI action for compliance.

### Phase 3: Hardware Relay (Cloud Run)
*   **Goal:** Reliable control of scanners/robots behind corporate firewalls.
*   **Action:** Deploy the `FlowHub MCP` server to Cloud Run.
*   **Connectivity:** Use a secure WebSocket tunnel (or MQTT) so local devices can "dial out" to the cloud, removing the need for complex VPNs or port forwarding at client sites.

### Phase 4: Enterprise Vision API
*   **Goal:** 99.9% OCR accuracy for ID documents.
*   **Action:** Upgrade from `gemini-3-pro-preview` (visual reasoning) to Google's specialized **Document AI** for form parsing.
