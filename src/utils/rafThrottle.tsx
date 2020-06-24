const rafThrottle: Function = (callback: Function) => {
  let requestId: number | null = null;
  let lastArgs: any[];

  const throttled = function (...args: any[]) {
    lastArgs = args;
    if (requestId === null) {
      requestId = requestAnimationFrame(() => {
        requestId = null;
        callback(...lastArgs);
      });
    }
  };

  throttled.cancel = () => {
    cancelAnimationFrame(requestId!);
    requestId = null;
  };
  return throttled;
};

export { rafThrottle };
