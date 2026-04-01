const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
];

const isQuotaError = (error) => {
  const message = (error instanceof Error ? error.message : typeof error === 'string' ? error : '').toLowerCase();
  const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;

  return status === 429
    || message.includes('429')
    || message.includes('quota')
    || message.includes('rate limit')
    || message.includes('too many requests');
};

export const executeWithFallback = async (operation) => {
  for (const model of FALLBACK_MODELS) {
    try {
      return await operation(model);
    } catch (error) {
      if (!isQuotaError(error)) {
        throw error;
      }

      console.warn(`Model ${model} failed with quota error, falling back to next model...`);
    }
  }

  throw new Error('Service is currently unavailable due to high demand. Please try again later.');
};
