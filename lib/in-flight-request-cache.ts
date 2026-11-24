type InFlightRequest<T> = {
  controller: AbortController;
  promise: Promise<T>;
  subscribers: number;
  settled: boolean;
  abortTimer: ReturnType<typeof setTimeout> | null;
};

function createAbortError(): DOMException {
  return new DOMException("The request was cancelled.", "AbortError");
}

export function createInFlightRequestCache(abortGraceMs = 50) {
  const requests = new Map<string, InFlightRequest<unknown>>();
  const settle = (key: string, request: InFlightRequest<unknown>) => {
    request.settled = true;
    if (request.abortTimer !== null) {
      clearTimeout(request.abortTimer);
      request.abortTimer = null;
    }
    if (requests.get(key) === request) requests.delete(key);
  };

  return {
    request<T>(
      key: string,
      signal: AbortSignal | undefined,
      start: (signal: AbortSignal) => Promise<T>,
    ): Promise<T> {
      if (signal?.aborted) return Promise.reject(createAbortError());

      let request = requests.get(key) as InFlightRequest<T> | undefined;
      if (!request || request.controller.signal.aborted) {
        const controller = new AbortController();
        request = {
          controller,
          promise: Promise.resolve().then(() => start(controller.signal)),
          subscribers: 0,
          settled: false,
          abortTimer: null,
        };
        requests.set(key, request);
        const current = request;
        void current.promise.then(
          () => settle(key, current),
          () => settle(key, current),
        );
      }

      if (request.abortTimer !== null) {
        clearTimeout(request.abortTimer);
        request.abortTimer = null;
      }
      request.subscribers += 1;

      return new Promise<T>((resolve, reject) => {
        let released = false;
        const release = () => {
          if (released) return;
          released = true;
          signal?.removeEventListener("abort", onAbort);
          request!.subscribers -= 1;
          if (request!.subscribers === 0 && !request!.settled) {
            request!.abortTimer = setTimeout(() => {
              request!.abortTimer = null;
              if (request!.subscribers !== 0 || request!.settled) return;
              if (requests.get(key) === request) requests.delete(key);
              request!.controller.abort();
            }, abortGraceMs);
          }
        };
        const onAbort = () => {
          release();
          reject(createAbortError());
        };

        signal?.addEventListener("abort", onAbort, { once: true });
        if (signal?.aborted) {
          onAbort();
          return;
        }

        request!.promise.then(
          (value) => {
            if (released) return;
            release();
            resolve(value);
          },
          (error: unknown) => {
            if (released) return;
            release();
            reject(error);
          },
        );
      });
    },
  };
}
