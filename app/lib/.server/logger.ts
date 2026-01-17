/**
 * Logger Utility
 * Centralized logging for production-ready error tracking and debugging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
    [key: string]: any;
}

class Logger {
    private prefix: string;

    constructor(prefix: string = 'APP') {
        this.prefix = prefix;
    }

    private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${this.prefix}] [${level.toUpperCase()}] ${message}${contextStr}`;
    }

    info(message: string, context?: LogContext) {
        console.log(this.formatMessage('info', message, context));
    }

    warn(message: string, context?: LogContext) {
        console.warn(this.formatMessage('warn', message, context));
    }

    error(message: string, error?: Error | unknown, context?: LogContext) {
        const errorContext = {
            ...context,
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
            } : error,
        };
        console.error(this.formatMessage('error', message, errorContext));
    }

    debug(message: string, context?: LogContext) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(this.formatMessage('debug', message, context));
        }
    }
}

// Export logger instances for different modules
export const logger = new Logger('APP');
export const llmLogger = new Logger('LLM');
export const graphLogger = new Logger('GRAPH');
export const apiLogger = new Logger('API');

// Export Logger class for custom instances
export { Logger };
