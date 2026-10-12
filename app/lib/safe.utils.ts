// safe.ts
export type SafeResult<T, E = Error> =
  | readonly [data: T, error: null]
  | readonly [data: null, error: E];

export function safe<T, E = Error>(
  promise: Promise<T>,
): Promise<SafeResult<T, E>>;
export function safe<T, E = Error>(fn: () => T): SafeResult<T, E>;
export function safe<T, E = Error>(
  promiseOrFn: Promise<T> | (() => T),
): Promise<SafeResult<T, E>> | SafeResult<T, E> {
  // Handle Async Promises
  if (promiseOrFn instanceof Promise) {
    return promiseOrFn
      .then((data) => [data, null] as const)
      .catch(
        (error) =>
          [
            null,
            error instanceof Error ? error : new Error(String(error)),
          ] as unknown as SafeResult<T, E>,
      );
  }

  // Handle Sync Functions
  try {
    const data = promiseOrFn();
    // If sync function returns a promise by mistake
    if (data instanceof Promise) {
      return data
        .then((d) => [d, null] as const)
        .catch(
          (e) =>
            [
              null,
              e instanceof Error ? e : new Error(String(e)),
            ] as unknown as SafeResult<T, E>,
        ) as any;
    }
    return [data, null] as const;
  } catch (error) {
    return [
      null,
      error instanceof Error ? error : new Error(String(error)),
    ] as unknown as SafeResult<T, E>;
  }
}
