/**
 * Message type alias for AI SDK compatibility
 * 
 * The AI SDK v6 doesn't export a 'Message' type directly from 'ai'.
 * We create a compatible type based on the useChat hook's message structure.
 */

// Message type compatible with AI SDK v6 useChat hook
export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt?: Date;
    [key: string]: any; // Allow additional properties from AI SDK
}
