/**
 * Fetch with timeout wrapper.
 * Rejects if the request takes longer than the specified timeout.
 */
export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout = 30000
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

/**
 * Fetch with retry logic.
 * Retries failed requests with exponential backoff.
 */
export async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries = 2,
    timeout = 30000
): Promise<Response> {
    for (let i = 0; i <= retries; i++) {
        try {
            return await fetchWithTimeout(url, options, timeout);
        } catch (error) {
            const isLastAttempt = i === retries;

            if (isLastAttempt) {
                throw error;
            }

            // Exponential backoff: 1s, 2s, 4s...
            const delay = 1000 * Math.pow(2, i);
            console.log(`Request failed, retrying in ${delay}ms... (attempt ${i + 1}/${retries})`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw new Error('Max retries exceeded');
}
