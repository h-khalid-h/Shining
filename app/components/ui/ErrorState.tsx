import { Button } from './Button';
import { classNames } from '~/utils/classNames';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  details?: string;
  icon?: string;
  suggestion?: string; // Helpful next step for the user
}

/**
 * Error state component with optional retry button.
 * Displays error information and allows users to retry failed operations.
 */
export function ErrorState({ title, message, onRetry, details, icon = 'i-ph:warning-circle', suggestion }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className={classNames(icon, 'text-5xl text-bolt-elements-textTertiary mb-4')} />
      <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-2">{title}</h3>
      <p className="text-bolt-elements-textSecondary mb-4 max-w-md">{message}</p>
      {suggestion && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg max-w-md">
          <div className="flex items-start gap-2">
            <div className="i-ph:lightbulb-duotone text-blue-500 text-xl flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300 text-left">{suggestion}</p>
          </div>
        </div>
      )}
      {details && (
        <details className="mb-4 text-left w-full max-w-md">
          <summary className="cursor-pointer text-sm text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary">
            Show details
          </summary>
          <pre className="mt-2 p-3 bg-bolt-elements-code-background text-bolt-elements-code-text text-xs rounded overflow-auto max-h-40">
            {details}
          </pre>
        </details>
      )}
      {onRetry && (
        <Button onClick={onRetry} variant="primary">
          Try Again
        </Button>
      )}
    </div>
  );
}
