/**
 * AI Service Type Definitions
 * Types used across main and renderer processes for AI communication
 */

/**
 * AI service initialization status
 */
export interface AIStatus {
  initialized: boolean;
  provider: string | null;
  model: string | null;
  error: string | null;
}

/**
 * AI configuration in application settings
 */
export interface AIConfig {
  provider: string;
  model: string;
  hasApiKey: boolean;
}

/**
 * SOC (System of Compliance) logging configuration
 */
export interface SOCConfig {
  enabled: boolean;
  endpoint: string;
}

/**
 * Application settings structure
 */
export interface AppSettings {
  ai: AIConfig;
  soc: SOCConfig;
}

/**
 * Options for streaming AI messages
 */
export interface StreamOptions {
  conversationId?: string;
  systemPrompt?: string;
}

/**
 * AI service response wrapper
 * Generic type for wrapping AI service responses
 */
export interface AIServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
