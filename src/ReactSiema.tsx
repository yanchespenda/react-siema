import React, {
  Component
} from 'react'
import debounce from './utils/debounce'
import transformProperty from './utils/transformProperty'

interface Selector {
  selector: React.Ref<HTMLDivElement>
}

interface ConfigProps extends Partial<Selector> {
  resizeDebounce: number
  duration: number
  easing: string
  perPage: number | object
  startIndex: number
  draggable: boolean
  threshold: number
  loop: boolean
  timer: number
  onNext: (currentSlide: number) => void
  onPrev: (currentSlide: number) => void
  onGoTo: (currentSlide: number) => void
}

interface IProps extends Partial<ConfigProps> {
  children: React.ReactNode
}

interface PropDrag {
  start: number
  end: number
}

class ReactSiema extends Component<IProps> {
  events: string[] = [
    'onTouchStart', 'onTouchEnd', 'onTouchMove', 'onMouseDown', 'onMouseUp', 'onMouseLeave', 'onMouseMove'
  ]

  timer: ReturnType<typeof setInterval> | null
  config: ConfigProps
  selector: React.Ref<HTMLDivElement>
  sliderFrame: React.Ref<HTMLDivElement>
  currentSlide: number
  onResize: (this: Window, ev: UIEvent) => void
  pointerDown: boolean
  drag: PropDrag
  perPage: number
  selectorWidth: number
  innerElements: HTMLElement[]

  constructor(props: IProps) {
    super(props);
    this.config = Object.assign({}, {
      resizeDebounce: 250,
      duration: 200,
      easing: 'ease-out',
      perPage: 1,
      startIndex: 0,
      draggable: true,
      threshold: 20,
      loop: false,
      timer: 10000,

      onNext: () => {},
      onPrev: () => {},
      onGoTo: () => {}
    }, props)

    this.events.forEach((handler) => {
      this[handler] = this[handler].bind(this);
    })

    this.currentSlide = 0
    this.timer = null

    this.selector = React.createRef()
    this.sliderFrame = React.createRef()

    this.onResize = () => {}

    this.pointerDown = false
    this.drag = {
      start: 0,
      end: 0
    }
    this.perPage = 0
    this.selectorWidth = 0
    this.innerElements = []
  }

  get selectorRef() {
    return this.selector as React.MutableRefObject<HTMLDivElement>
  }

  get sliderFrameRef() {
    return this.sliderFrame as React.MutableRefObject<HTMLDivElement>
  }

  componentDidMount() {
    this.config.selector = this.selector
    this.currentSlide = this.config.startIndex || 0

    this.init()

    this.onResize = debounce(() => {
      this.resize()
      this.slideToCurrent()
    }, this.config.resizeDebounce || 0)

    window.addEventListener('resize', this.onResize)

    if (this.config.draggable) {
      this.pointerDown = false
      this.drag = {
        start: 0,
        end: 0,
      }
    }
  }

  runTimer() {
    this.next()
  }

  componentDidUpdate() {
    if (this.timer)
      clearInterval(this.timer)
    this.init()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize)
    if (this.timer)
      clearInterval(this.timer)
  }

  init() {
    this.setSelectorWidth()
    this.setInnerElements()
    this.resolveSlidesNumber()

    this.setStyle(this.sliderFrame, {
      width: `${(this.selectorWidth / this.perPage) * this.innerElements.length}px`,
      webkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
      transition: `all ${this.config.duration}ms ${this.config.easing}`
    })

    for (let i = 0; i < this.innerElements.length; i++) {
      this.setStyleChildren(this.innerElements[i], {
        width: `${100 / this.innerElements.length}%`
      })
    }

    this.slideToCurrent()

    this.timer = setInterval(
      () => this.runTimer(),
      this.config.timer
    )
  }

  setSelectorWidth() {
    if (this.selector)
      this.selectorWidth = this.selectorRef.current.getBoundingClientRect().width
  }

  setInnerElements() {
    if (this.sliderFrame)
      this.innerElements = Array.from(this.sliderFrameRef.current.children as HTMLCollectionOf<HTMLElement>)
  }

  resolveSlidesNumber() {
    if (typeof this.config.perPage === 'number') {
      this.perPage = this.config.perPage
    } else if (typeof this.config.perPage === 'object') {
      this.perPage = 1
      for (let viewport in this.config.perPage) {
        if (window.innerWidth > Number(viewport)) {
          this.perPage = this.config.perPage[viewport]
        }
      }
    }
  }

  prev() {
    if (this.currentSlide === 0 && this.config.loop) {
      this.currentSlide = this.innerElements.length - this.perPage
    } else {
      this.currentSlide = Math.max(this.currentSlide - 1, 0)
    }
    this.slideToCurrent()

    if (this.config.onPrev)
      this.config.onPrev(this.currentSlide)
  }

  next() {
    if (this.currentSlide === this.innerElements.length - this.perPage && this.config.loop) {
      this.currentSlide = 0
    } else {
      this.currentSlide = Math.min(this.currentSlide + 1, this.innerElements.length - this.perPage)
    }
    this.slideToCurrent()

    if (this.config.onNext)
      this.config.onNext(this.currentSlide)
  }

  goTo(index: number) {
    this.currentSlide = Math.min(Math.max(index, 0), this.innerElements.length - 1)
    this.slideToCurrent()

    if (this.config.onGoTo)
      this.config.onGoTo(this.currentSlide)
  }

  slideToCurrent() {
    this.sliderFrameRef.current.style[transformProperty] = `translate3d(-${this.currentSlide * (this.selectorWidth / this.perPage)}px, 0, 0)`
  }

  updateAfterDrag() {
    const movement = this.drag.end - this.drag.start
    if (movement > 0 && Math.abs(movement) > this.config.threshold) {
      this.prev()
    } else if (movement < 0 && Math.abs(movement) > this.config.threshold) {
      this.next()
    }
    this.slideToCurrent()
  }

  resize() {
    this.resolveSlidesNumber()

    this.selectorWidth = this.selectorRef.current.getBoundingClientRect().width
    this.setStyle(this.sliderFrame, {
      width: `${(this.selectorWidth / this.perPage) * this.innerElements.length}px`
    })
  }

  clearDrag() {
    this.drag = {
      start: 0,
      end: 0,
    }
  }

  setStyle(target: React.Ref<HTMLDivElement>, styles: any) {
    const domTarget = (target as React.MutableRefObject<HTMLDivElement>).current
    Object.keys(styles).forEach((attribute) => {
      domTarget.style[attribute] = styles[attribute]
    })
  }

  setStyleChildren(target: HTMLElement, styles: any) {
    Object.keys(styles).forEach((attribute) => {
      target.style[attribute] = styles[attribute]
    })
  }

  onTouchStart(e: TouchEvent) {
    e.stopPropagation()
    this.pointerDown = true
    this.drag.start = e.touches[0].pageX
  }

  onTouchEnd(e: TouchEvent) {
    e.stopPropagation()
    this.pointerDown = false
    this.setStyle(this.sliderFrame, {
      webkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
      transition: `all ${this.config.duration}ms ${this.config.easing}`
    })
    if (this.drag.end) {
      this.updateAfterDrag()
    }
    this.clearDrag()
  }

  onTouchMove(e: TouchEvent) {
    e.stopPropagation()
    if (this.pointerDown) {
      this.drag.end = e.touches[0].pageX;

      this.setStyle(this.sliderFrame, {
        webkitTransition: `all 0ms ${this.config.easing}`,
        transition: `all 0ms ${this.config.easing}`,
        [transformProperty]: `translate3d(${(this.currentSlide * (this.selectorWidth / this.perPage) + (this.drag.start - this.drag.end)) * -1}px, 0, 0)`
      })
    }
  }

  onMouseDown(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    this.pointerDown = true
    this.drag.start = e.pageX
  }

  onMouseUp(e: MouseEvent) {
    e.stopPropagation()
    this.pointerDown = false
    this.setStyle(this.sliderFrame, {
      cursor: '-webkit-grab',
      webkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
      transition: `all ${this.config.duration}ms ${this.config.easing}`
    })
    if (this.drag.end) {
      this.updateAfterDrag()
    }
    this.clearDrag()
  }

  onMouseMove(e: MouseEvent) {
    e.preventDefault()
    if (this.pointerDown) {
      this.drag.end = e.pageX;
      this.setStyle(this.sliderFrame, {
        cursor: '-webkit-grabbing',
        webkitTransition: `all 0ms ${this.config.easing}`,
        transition: `all 0ms ${this.config.easing}`,
        [transformProperty]: `translate3d(${(this.currentSlide * (this.selectorWidth / this.perPage) + (this.drag.start - this.drag.end)) * -1}px, 0, 0)`
      })
    }
  }

  onMouseLeave(e: MouseEvent) {
    if (this.pointerDown) {
      this.pointerDown = false
      this.drag.end = e.pageX
      this.setStyle(this.sliderFrame, {
        cursor: '-webkit-grab',
        webkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
        transition: `all ${this.config.duration}ms ${this.config.easing}`
      })
      this.updateAfterDrag()
      this.clearDrag()
    }
  }

  render() {
    return (
      <div
        ref={this.selector}
        style={{ overflow: 'hidden' }}
        {...this.events.reduce((props, event) => Object.assign({}, props, { [event]: this[event] }), {})}
      >
        <div ref={this.sliderFrame}>
          {React.Children.map(this.props.children, (children, index) =>
            React.cloneElement((children as React.ReactElement<any, string | React.JSXElementConstructor<any>>), {
              key: index,
              style: { float: 'left' }
            })
          )}
        </div>
      </div>
    )
  }
}

export default ReactSiema
