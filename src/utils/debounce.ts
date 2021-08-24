const DebounceUtils = (func: VoidFunction, wait: number, immediate = false): VoidFunction => {
  let timeout: ReturnType<typeof setTimeout>;
  return function (): void {
    const context = this,
      args = arguments;
    const later = () => {
      timeout = setTimeout(() => {
        // do nothing.
      });
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

export default DebounceUtils;
