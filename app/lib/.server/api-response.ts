/**
 * Standardized API Error Response Types
 * Ensures consistent error handling across all API endpoints
 */

export interface APIError {
    error: string;
    message: string;
    code?: string;
    details?: any;
    timestamp?: string;
}

export interface APISuccess<T = any> {
    success: true;
    data: T;
    timestamp?: string;
}

export type APIResponse<T = any> = APISuccess<T> | { success: false } & APIError;

/**
 * Create standardized error response
 */
export function createErrorResponse(
    error: string,
    message: string,
    options?: {
        code?: string;
        details?: any;
        status?: number;
    }
): Response {
    const errorResponse: APIError = {
        error,
        message,
        code: options?.code,
        details: options?.details,
        timestamp: new Date().toISOString(),
    };

    return Response.json(errorResponse, {
        status: options?.status || 500,
    });
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
    data: T,
    options?: {
        status?: number;
    }
): Response {
    const successResponse: APISuccess<T> = {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };

    return Response.json(successResponse, {
        status: options?.status || 200,
    });
}

/**
 * Common error codes
 */
export const ErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    PROVIDER_ERROR: 'PROVIDER_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;
