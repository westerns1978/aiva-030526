import { type ChatMessage, MessageRole } from '../types';

/**
 * Serializes a chat history into a URL-safe Base64 string.
 * @param messages The array of chat messages.
 * @returns A Base64 encoded string representing the chat history.
 */
export const serializeChatHistory = (messages: ChatMessage[]): string => {
  try {
    // Filter out any non-final messages and simplify the object
    const simplifiedHistory = messages
      .filter(msg => msg.status !== 'streaming' && msg.status !== 'transcribing')
      .map(({ role, content }) => ({ role, content }));

    const jsonString = JSON.stringify(simplifiedHistory);
    // Use btoa for Base64 encoding
    return btoa(jsonString);
  } catch (error) {
    console.error('Failed to serialize chat history:', error);
    return '';
  }
};

/**
 * Deserializes a URL-safe Base64 string back into a chat history.
 * @param hash The Base64 encoded string from the URL hash.
 * @returns An array of ChatMessage objects or null if parsing fails.
 */
export const deserializeChatHistory = (hash: string): ChatMessage[] | null => {
  try {
    // Use atob for Base64 decoding
    const jsonString = atob(hash);
    const simplifiedHistory: { role: 'user' | 'model'; content: string }[] = JSON.parse(jsonString);

    if (!Array.isArray(simplifiedHistory)) {
        return null;
    }

    // Reconstruct the full ChatMessage objects
    return simplifiedHistory.map((msg, index): ChatMessage => ({
      id: `shared-${index}-${Date.now()}`,
      role: msg.role === 'user' ? MessageRole.USER : MessageRole.MODEL,
      content: msg.content,
      status: 'final',
    }));
  } catch (error) {
    console.error('Failed to deserialize chat history:', error);
    return null;
  }
};