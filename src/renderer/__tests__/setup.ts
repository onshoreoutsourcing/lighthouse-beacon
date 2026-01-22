/**
 * Vitest Setup for Renderer Tests
 *
 * Sets up the test environment for React renderer components and hooks.
 * Mocks window.electronAPI to prevent IPC errors in tests.
 */

// Import jest-dom matchers for DOM assertions
import '@testing-library/jest-dom/vitest';

// NOTE: Individual tests should set up their own electronAPI mocks
// This file only provides the base setup for React Testing Library
