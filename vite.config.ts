import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// AI Studio injects secrets as process.env.SECRET_NAME at build time.
// Vite strips process.env at bundle time unless explicitly defined here.
// This define block re-exposes them so GoogleGenAI({ apiKey: process.env.API_KEY })
// works correctly in the deployed browser bundle.
export default defineConfig({
  plugins: [react()],
  define: {
    // Primary key used by GoogleGenAI and useLiveApi
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    // Alias — some files reference GEMINI_API_KEY directly
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
  },
});
