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
 * Logging configuration
 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
}

/**
 * Log configuration details for runtime display
 */
export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  filePath: string;
  fileSize: number;
  availableDiskSpace: number;
}

/**
 * Application settings structure
 */
export interface AppSettings {
  ai: AIConfig;
  soc: SOCConfig;
  logging: LoggingConfig;
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
