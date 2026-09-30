export async function withTimeout<T>(
  operation: Promise<T>,

  timeoutMs: number
): Promise<T> {

  let timeoutId:
    ReturnType<typeof setTimeout>;

  const timeout =
    new Promise<never>(
      (_, reject) => {

        timeoutId =
          setTimeout(() => {
            reject(
              new Error(
                "Operation timed out"
              )
            );
          }, timeoutMs);
      }
    );

  try {
    return await Promise.race([
      operation,
      timeout,
    ]);

  } finally {
    clearTimeout(timeoutId!);
  }
}