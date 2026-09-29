export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {

  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= options.maxAttempts;
    attempt++
  ) {

    try {
      return await operation();

    } catch (error) {

      lastError = error;

      const shouldRetry =
        isRetryableError(error);

      const isLastAttempt =
        attempt === options.maxAttempts;

      if (!shouldRetry || isLastAttempt) {
        throw error;
      }

      const delay =
        calculateBackoffWithJitter(
          attempt,
          options
        );

      console.log(
        `Retry attempt ${attempt + 1}/${options.maxAttempts} ` +
        `after ${delay}ms`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

function isRetryableError(
  error: unknown
): boolean {

  if (!error || typeof error !== "object") {
    return false;
  }

  const status =
    "status" in error
      ? (error as { status?: number }).status
      : undefined;

  if (!status) {
    return false;
  }

  return [
    429,
    500,
    502,
    503,
    504,
  ].includes(status);
}

function calculateBackoffWithJitter(
  attempt: number,
  options: RetryOptions
): number {

  const exponentialDelay =
    options.baseDelayMs *
    Math.pow(2, attempt - 1);

  const cappedDelay =
    Math.min(
      exponentialDelay,
      options.maxDelayMs
    );

  return Math.floor(
    Math.random() * (cappedDelay + 1)
  );
}

function sleep(
  milliseconds: number
): Promise<void> {

  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}