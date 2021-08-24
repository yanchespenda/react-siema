const DebounceUtils = (func: Function, wait: number, immediate: boolean = false) => {
  let timeout: ReturnType<typeof setTimeout>
  return function () {
    //@ts-ignore
    const context = this,
        args = arguments
    const later = () => {
      timeout = setTimeout(() => {})
      if (!immediate) func.apply(context, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
}

export default DebounceUtils
