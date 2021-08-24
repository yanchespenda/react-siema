const transformProperty = (): string => {
  if (typeof window !== "undefined") {
    const { transform } = window.document.documentElement.style
    if (typeof transform === 'string') {
      return 'transform';
    }
  }
  return 'WebkitTransform'
}

export default transformProperty()
