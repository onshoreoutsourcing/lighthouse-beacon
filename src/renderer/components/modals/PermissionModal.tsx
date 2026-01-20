/**
 * PermissionModal
 *
 * Modal dialog for AI tool permission requests.
 * Displays operation details with risk indicators and allows user to approve/deny.
 *
 * Features:
 * - Risk-level color coding (green/yellow/red)
 * - Operation details display
 * - Session trust checkbox (for eligible operations)
 * - Keyboard shortcuts (Enter=approve, Escape=deny)
 * - Cannot be dismissed without decision
 *
 * Usage:
 * <PermissionModal /> - Automatically shows when permission requests arrive
 */

import { useEffect, useState, useRef } from 'react';
import { usePermissionStore } from '@renderer/stores/permission.store';
import type { ToolRiskLevel } from '@shared/types';

/**
 * Risk level indicator component
 */
const RiskIndicator = ({ level }: { level: ToolRiskLevel }) => {
  const colors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
  };

  const labels = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
  };

  const icons = {
    low: '✓',
    medium: '⚠',
    high: '⚠',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-white ${colors[level]}`}>
      <span className="font-bold">{icons[level]}</span>
      <span className="text-sm font-medium">{labels[level]}</span>
    </div>
  );
};

/**
 * Format parameter value for display
 */
const formatParameterValue = (value: unknown): string => {
  if (typeof value === 'string') {
    // Truncate long strings
    return value.length > 100 ? value.substring(0, 100) + '...' : value;
  }
  return JSON.stringify(value, null, 2);
};

/**
 * Permission modal component
 */
export const PermissionModal = () => {
  const { pendingRequest, approvePermission, denyPermission } = usePermissionStore();
  const [trustForSession, setTrustForSession] = useState(false);
  const approveButtonRef = useRef<HTMLButtonElement>(null);
  const previousRequestIdRef = useRef<string | null>(null);

  // Reset trust checkbox when request changes
  if (pendingRequest?.id !== previousRequestIdRef.current) {
    previousRequestIdRef.current = pendingRequest?.id ?? null;
    if (trustForSession) {
      setTrustForSession(false);
    }
  }

  // Auto-focus approve button when modal opens
  useEffect(() => {
    if (pendingRequest && approveButtonRef.current) {
      approveButtonRef.current.focus();
    }
  }, [pendingRequest]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!pendingRequest) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void approvePermission(trustForSession);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        void denyPermission();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingRequest, trustForSession, approvePermission, denyPermission]);

  // Don't render if no pending request
  if (!pendingRequest) {
    return null;
  }

  const handleApprove = () => {
    void approvePermission(trustForSession);
  };

  const handleDeny = () => {
    void denyPermission();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="permission-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            id="permission-modal-title"
            className="text-xl font-bold text-gray-900 dark:text-gray-100"
          >
            Permission Required
          </h2>
          <RiskIndicator level={pendingRequest.riskLevel} />
        </div>

        {/* Operation Details */}
        <div className="mb-6">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI is requesting permission to execute:
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {pendingRequest.toolName}
            </p>

            {/* Parameters */}
            {Object.keys(pendingRequest.parameters).length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase">
                  Parameters:
                </p>
                <div className="bg-white dark:bg-gray-800 rounded p-3 font-mono text-xs space-y-2">
                  {Object.entries(pendingRequest.parameters).map(([key, value]) => (
                    <div
                      key={key}
                      className="border-b border-gray-200 dark:border-gray-600 pb-2 last:border-0"
                    >
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">{key}:</span>{' '}
                      <span className="text-gray-800 dark:text-gray-200">
                        {formatParameterValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* High-risk warning */}
          {pendingRequest.riskLevel === 'high' && (
            <div className="mt-4 bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Warning:</strong> This is a high-risk operation that could modify or delete
                data. Please review carefully before approving.
              </p>
            </div>
          )}
        </div>

        {/* Session Trust Option */}
        {pendingRequest.allowSessionTrust && (
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={trustForSession}
                onChange={(e) => setTrustForSession(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Trust this operation type for this session (no further prompts)
              </span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleDeny}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Deny permission"
          >
            Deny (Esc)
          </button>
          <button
            ref={approveButtonRef}
            onClick={handleApprove}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Approve permission"
          >
            Approve (Enter)
          </button>
        </div>
      </div>
    </div>
  );
};
