import React, { Component } from 'react';
import debounce from './utils/debounce';
import transformProperty from './utils/transformProperty';

interface Selector {
  selector: React.Ref<HTMLDivElement>;
}

type PerPage = { [k: number]: number };

type Style = { [k: string]: string };

interface ConfigProps extends Partial<Selector> {
  resizeDebounce: number;
  duration: number;
  easing: string;
  perPage: number | PerPage;
  startIndex: number;
  draggable: boolean;
  threshold: number;
  loop: boolean;
  timer: number;
  disabledTimer: boolean;
  useFixedWidth: boolean;
  fixedWidth: string;
  onNext: (currentSlide: number) => void;
  onPrev: (currentSlide: number) => void;
  onGoTo: (currentSlide: number) => void;
  onNavigationChanged: (enable: boolean) => void;
}

interface IProps extends Partial<ConfigProps> {
  children: React.ReactNode;
}

interface PropDrag {
  start: number;
  end: number;
}

class ReactSiema extends Component<IProps> {
  events: string[] = [
    'onTouchStart',
    'onTouchEnd',
    'onTouchMove',
    'onMouseDown',
    'onMouseUp',
    'onMouseLeave',
    'onMouseMove',
  ];

  timer: ReturnType<typeof setInterval> | null;
  config: ConfigProps;
  selector: React.Ref<HTMLDivElement>;
  sliderFrame: React.Ref<HTMLDivElement>;
  currentSlide: number;
  onResize: (this: Window, ev: UIEvent) => void;
  pointerDown: boolean;
  drag: PropDrag;
  perPage: number;
  selectorWidth: number;
  innerElements: HTMLElement[];
  useNavigation: boolean;

  constructor(props: IProps) {
    super(props);
    this.config = Object.assign(
      {},
      {
        resizeDebounce: 250,
        duration: 200,
        easing: 'ease-out',
        perPage: 1,
        startIndex: 0,
        draggable: true,
        threshold: 20,
        loop: false,
        timer: 10000,
        disabledTimer: false,
        useFixedWidth: false,
        fixedWidth: '0',

        onNext: () => {
          // do nothing.
        },
        onPrev: () => {
          // do nothing.
        },
        onGoTo: () => {
          // do nothing.
        },
        onNavigationChanged: () => {
          // do nothing.
        },
      },
      props,
    );

    this.events.forEach((handler) => {
      this[handler] = this[handler].bind(this);
    });

    this.currentSlide = 0;
    this.timer = null;

    this.selector = React.createRef();
    this.sliderFrame = React.createRef();

    this.onResize = () => {
      // do nothing.
    };

    this.pointerDown = false;
    this.drag = {
      start: 0,
      end: 0,
    };
    this.perPage = 0;
    this.selectorWidth = 0;
    this.innerElements = [];
    this.useNavigation = false;
  }

  get selectorRef(): React.MutableRefObject<HTMLDivElement> {
    return this.selector as React.MutableRefObject<HTMLDivElement>;
  }

  get sliderFrameRef(): React.MutableRefObject<HTMLDivElement> {
    return this.sliderFrame as React.MutableRefObject<HTMLDivElement>;
  }

  componentDidMount(): void {
    this.config.selector = this.selector;
    this.currentSlide = this.config.startIndex || 0;

    this.init();

    this.onResize = debounce(() => {
      this.resize();
      this.slideToCurrent();
    }, this.config.resizeDebounce || 0);

    window.addEventListener('resize', this.onResize);

    if (this.config.draggable) {
      this.pointerDown = false;
      this.drag = {
        start: 0,
        end: 0,
      };
    }
  }

  runTimer(): void {
    this.next();
  }

  componentDidUpdate(): void {
    if (this.timer) clearInterval(this.timer);
    this.init();
  }

  componentWillUnmount(): void {
    window.removeEventListener('resize', this.onResize);
    if (this.timer) clearInterval(this.timer);
  }

  init(): void {
    this.setSelectorWidth();
    this.setInnerElements();
    this.resolveSlidesNumber();
    this.checkNavigation();

    this.setStyle(this.sliderFrame, {
      width: `${this.initialFrameWidth()}px`,
      webkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
      transition: `all ${this.config.duration}ms ${this.config.easing}`,
    });

    for (let i = 0; i < this.innerElements.length; i++) {
      if (this.config.useFixedWidth) {
        this.setStyleChildren(this.innerElements[i], {
          width: `${this.config.fixedWidth}`,
        });
      } else {
        this.setStyleChildren(this.innerElements[i], {
          width: `${100 / this.innerElements.length}%`,
        });
      }
    }

    this.slideToCurrent();

    if (!this.config.disabledTimer) {
      this.timer = setInterval(() => this.runTimer(), this.config.timer);
    }
  }

  checkNavigation(): void {
    this.useNavigation = false;
    if (this.config.useFixedWidth) {
      if (Number(this.config.fixedWidth.replace('px', '')) * this.innerElements.length > this.selectorWidth) {
        this.useNavigation = true;
      }
    } else {
      if ((this.selectorWidth / this.perPage) * this.innerElements.length > this.selectorWidth) {
        this.useNavigation = true;
      }
    }
    if (this.config.onNavigationChanged) this.config.onNavigationChanged(this.useNavigation);
  }

  setSelectorWidth(): void {
    if (this.selector) this.selectorWidth = this.selectorRef.current.getBoundingClientRect().width;
  }

  setInnerElements(): void {
    if (this.sliderFrame)
      this.innerElements = Array.from(this.sliderFrameRef.current.children as HTMLCollectionOf<HTMLElement>);
  }

  initialFrameWidth(): number {
    if (this.config.useFixedWidth) {
      return Number(this.config.fixedWidth.replace('px', '')) * this.innerElements.length;
    }
    return this.resolveWidth() * this.innerElements.length;
  }

  resolveWidth(): number {
    if (this.config.useFixedWidth) {
      if (Number(this.config.fixedWidth.replace('px', '')) * this.innerElements.length < this.selectorWidth) {
        return Number(this.config.fixedWidth.replace('px', '')) * this.innerElements.length;
      }
    }
    return this.selectorWidth / this.perPage;
  }

  resolveSlidesNumber(): void {
    if (typeof this.config.perPage === 'number') {
      this.perPage = this.config.perPage;
    } else if (typeof this.config.perPage === 'object') {
      this.perPage = 1;
      for (const viewport in this.config.perPage) {
        if (window.innerWidth > Number(viewport)) {
          this.perPage = this.config.perPage[viewport];
        }
      }
    }
  }

  prev(): void {
    if (this.currentSlide === 0 && this.config.loop) {
      this.currentSlide = this.innerElements.length - this.perPage;
    } else {
      this.currentSlide = Math.max(this.currentSlide - 1, 0);
    }
    this.slideToCurrent();

    if (this.config.onPrev) this.config.onPrev(this.currentSlide);
  }

  next(): void {
    if (this.currentSlide === this.innerElements.length - this.perPage && this.config.loop) {
      this.currentSlide = 0;
    } else {
      this.currentSlide = Math.min(this.currentSlide + 1, this.innerElements.length - this.perPage);
    }
    this.slideToCurrent();

    if (this.config.onNext) this.config.onNext(this.currentSlide);
  }

  goTo(index: number): void {
    this.currentSlide = Math.min(Math.max(index, 0), this.innerElements.length - 1);
    this.slideToCurrent();

    if (this.config.onGoTo) this.config.onGoTo(this.currentSlide);
  }

  slideToCurrent(): void {
    this.sliderFrameRef.current.style[transformProperty] = `translate3d(-${this.resolveTransformProperty()}px, 0, 0)`;
  }

  resolveTransformProperty(): number {
    let preCalculate = this.currentSlide * this.resolveWidth();
    if (this.config.useFixedWidth) {
      preCalculate = this.currentSlide * Number(this.config.fixedWidth.replace('px', ''));
      if (this.useNavigation && this.initialFrameWidth() - preCalculate < this.selectorWidth) {
        this.prev();
        preCalculate = this.initialFrameWidth() - this.selectorWidth;
      }
    }
    return preCalculate;
  }

  updateAfterDrag(): void {
    const movement = this.drag.end - this.drag.start;
    if (movement > 0 && Math.abs(movement) > this.config.threshold) {
      this.prev();
    } else if (movement < 0 && Math.abs(movement) > this.config.threshold) {
      this.next();
    }
    this.slideToCurrent();
  }

  updateMovement(): void {
    // const movement = this.drag.end - this.drag.start;
    // if (!this.config.useFixedWidth) {
    //   if (movement > 0 && Math.abs(movement) > this.config.threshold) {
    //     this.prev();
    //   } else if (movement < 0 && Math.abs(movement) > this.config.threshold) {
    //     this.next();
    //   }
    // } else {
    //   if (movement > 0 && Math.abs(movement) > (this.config.threshold + Number(this.config.fixedWidth.replace('px', '')))) {
    //     this.prev();
    //   } else if (movement < 0 && Math.abs(movement) > (this.config.threshold + Number(this.config.fixedWidth.replace('px', '')))) {
    //     this.next();
    //   }
    // }
  }

  resize(): void {
    this.resolveSlidesNumber();
    this.setSelectorWidth();
    this.checkNavigation();

    this.setStyle(this.sliderFrame, {
      width: `${this.initialFrameWidth()}px`,
    });
  }

  clearDrag(): void {
    this.drag = {
      start: 0,
      end: 0,
    };
  }

  setStyle(target: React.Ref<HTMLDivElement>, styles: Style): void {
    const domTarget = (target as React.MutableRefObject<HTMLDivElement>).current;
    Object.keys(styles).forEach((attribute) => {
      domTarget.style[attribute] = styles[attribute];
    });
  }

  setStyleChildren(target: HTMLElement, styles: Style): void {
    Object.keys(styles).forEach((attribute) => {
      target.style[attribute] = styles[attribute];
    });
  }

  resolveDragCalculate(): number {
    if (this.drag.start > 0) {
      // to right
      return this.drag.end > 0 ? this.drag.start - this.drag.end : 0;
    }
    // to left
    return this.drag.start > 0 ? this.drag.end - this.drag.start : 0;
  }

  onTouchStart(e: TouchEvent): void {
    e.stopPropagation();
    if (this.config.draggable) {
      this.pointerDown = true;
      this.drag.start = e.touches[0].pageX;
    }
  }

  onTouchEnd(e: TouchEvent): void {
    e.stopPropagation();
    if (this.config.draggable) {
      this.pointerDown = false;
      this.setStyle(this.sliderFrame, {
        webkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
        transition: `all ${this.config.duration}ms ${this.config.easing}`,
      });
      // if (this.drag.end) {
      //   this.updateAfterDrag();
      // }
      this.updateAfterDrag();
      this.clearDrag();
    }
  }

  onTouchMove(e: TouchEvent): void {
    e.stopPropagation();
    if (this.config.draggable) {
      this.drag.end = e.touches[0].pageX;
      if (this.pointerDown) {
        // this.drag.end = e.touches[0].pageX;

        this.setStyle(this.sliderFrame, {
          webkitTransition: `all 0ms ${this.config.easing}`,
          transition: `all 0ms ${this.config.easing}`,
          [transformProperty]: `translate3d(${
            (this.resolveTransformProperty() + this.resolveDragCalculate()) * -1
          }px, 0, 0)`,
        });
        this.updateMovement();
      }
    }
  }

  onMouseDown(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (this.config.draggable) {
      this.pointerDown = true;
      this.drag.start = e.pageX;
    }
  }

  onMouseUp(e: MouseEvent): void {
    e.stopPropagation();
    if (this.config.draggable) {
      this.pointerDown = false;
      this.setStyle(this.sliderFrame, {
        cursor: '-webkit-grab',
        webkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
        transition: `all ${this.config.duration}ms ${this.config.easing}`,
      });
      // if (this.drag.end) {
      //   this.updateAfterDrag();
      // }
      this.updateAfterDrag();
      this.clearDrag();
    }
  }

  onMouseMove(e: MouseEvent): void {
    e.preventDefault();
    if (this.config.draggable) {
      this.drag.end = e.pageX;
      if (this.pointerDown) {
        // this.drag.end = e.pageX;
        this.setStyle(this.sliderFrame, {
          cursor: '-webkit-grabbing',
          webkitTransition: `all 0ms ${this.config.easing}`,
          transition: `all 0ms ${this.config.easing}`,
          [transformProperty]: `translate3d(${
            (this.resolveTransformProperty() + this.resolveDragCalculate()) * -1
          }px, 0, 0)`,
        });
        this.updateMovement();
      }
    }
  }

  onMouseLeave(e: MouseEvent): void {
    if (this.config.draggable) {
      this.drag.end = e.pageX;
      if (this.pointerDown) {
        this.pointerDown = false;
        // this.drag.end = e.pageX;
        this.setStyle(this.sliderFrame, {
          cursor: '-webkit-grab',
          webkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
          transition: `all ${this.config.duration}ms ${this.config.easing}`,
        });
        this.updateAfterDrag();
        this.clearDrag();
      }
    }
  }

  render(): JSX.Element {
    return (
      <div
        ref={this.selector}
        style={{ overflow: 'hidden' }}
        {...this.events.reduce((props, event) => Object.assign({}, props, { [event]: this[event] }), {})}
      >
        <div ref={this.sliderFrame}>
          {React.Children.map(this.props.children, (children, index) =>
            React.cloneElement(children as React.ReactElement<any, string | React.JSXElementConstructor<any>>, {
              key: index,
              style: { float: 'left' },
            }),
          )}
        </div>
      </div>
    );
  }
}

export default ReactSiema;
