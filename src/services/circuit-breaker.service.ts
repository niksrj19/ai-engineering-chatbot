export type CircuitState =
  | "CLOSED"
  | "OPEN"
  | "HALF_OPEN";

export interface CircuitBreakerOptions {
  /**
   * Number of consecutive transient failures
   * required to open the circuit.
   */
  failureThreshold: number;

  /**
   * How long the circuit remains OPEN before
   * allowing a recovery probe.
   */
  resetTimeoutMs: number;

  /**
   * Determines whether an error should count
   * toward opening the circuit.
   *
   * Only transient infrastructure/provider
   * failures should normally return true.
   */
  shouldTrip?: (error: unknown) => boolean;

  /**
   * Optional observability hook.
   */
  onStateChange?: (
    previousState: CircuitState,
    nextState: CircuitState
  ) => void;
}

export class CircuitOpenError extends Error {
  constructor() {
    super(
      "LLM provider circuit breaker is open"
    );

    this.name = "CircuitOpenError";
  }
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";

  private failureCount = 0;

  private openedAt = 0;

  /**
   * Prevents multiple concurrent HALF_OPEN
   * requests from becoming recovery probes.
   */
  private halfOpenProbeInFlight = false;

  constructor(
    private readonly options: CircuitBreakerOptions
  ) {
    if (
      options.failureThreshold <= 0
    ) {
      throw new Error(
        "failureThreshold must be greater than 0"
      );
    }

    if (
      options.resetTimeoutMs <= 0
    ) {
      throw new Error(
        "resetTimeoutMs must be greater than 0"
      );
    }
  }

  async execute<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    const isProbe =
      this.beforeRequest();

    try {
      const result =
        await operation();

      this.onSuccess();

      return result;
    } catch (error) {
      this.onFailure(error);

      throw error;
    } finally {
      if (isProbe) {
        this.halfOpenProbeInFlight =
          false;
      }
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  private beforeRequest(): boolean {
    if (this.state === "CLOSED") {
      return false;
    }

    if (this.state === "OPEN") {
      const elapsed =
        Date.now() - this.openedAt;

      if (
        elapsed <
        this.options.resetTimeoutMs
      ) {
        throw new CircuitOpenError();
      }

      this.transition(
        "HALF_OPEN"
      );
    }

    /**
     * HALF_OPEN:
     * Only one request is allowed to
     * test provider recovery.
     */
    if (this.state === "HALF_OPEN") {
      if (
        this.halfOpenProbeInFlight
      ) {
        throw new CircuitOpenError();
      }

      this.halfOpenProbeInFlight =
        true;

      return true;
    }

    return false;
  }

  private onSuccess(): void {
    if (this.state !== "CLOSED") {
      this.transition("CLOSED");
    }

    this.failureCount = 0;
    this.openedAt = 0;
  }

  private onFailure(
    error: unknown
  ): void {
    /**
     * Do not trip the circuit for:
     *
     * 400
     * 401
     * 403
     * validation errors
     * business errors
     * malformed requests
     *
     * Only infrastructure/provider failures
     * should normally affect the circuit.
     */
    const shouldTrip =
      this.options.shouldTrip
        ? this.options.shouldTrip(error)
        : this.isTransientError(error);

    if (!shouldTrip) {
      /**
       * If the HALF_OPEN probe failed because
       * of a non-transient/application error,
       * the provider itself is still considered
       * healthy.
       */
      if (
        this.state === "HALF_OPEN"
      ) {
        this.transition("CLOSED");
        this.failureCount = 0;
      }

      return;
    }

    this.failureCount += 1;

    if (
      this.failureCount >=
      this.options.failureThreshold
    ) {
      this.open();
    }
  }

  private open(): void {
    this.openedAt = Date.now();

    this.transition("OPEN");
  }

  private transition(
    nextState: CircuitState
  ): void {
    const previousState =
      this.state;

    if (
      previousState === nextState
    ) {
      return;
    }

    this.state = nextState;

    this.options.onStateChange?.(
      previousState,
      nextState
    );
  }

  private isTransientError(
    error: unknown
  ): boolean {
    if (
      !error ||
      typeof error !== "object"
    ) {
      return false;
    }

    const candidate =
      error as {
        retryable?: boolean;
        statusCode?: number;
        status?: number;
      };

    if (
      candidate.retryable === true
    ) {
      return true;
    }

    const status =
      candidate.statusCode ??
      candidate.status;

    return [
      429,
      500,
      502,
      503,
      504,
    ].includes(status ?? 0);
  }
}