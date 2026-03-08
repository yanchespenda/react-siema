import React, { Component } from 'react';
import debounce from './utils/debounce';
import transformProperty from './utils/transformProperty';

interface Selector {
  selector: React.RefObject<HTMLDivElement | null>;
}

type PerPage = Record<number, number>;

type Style = Record<string, string>;

interface ConfigProps extends Selector {
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

interface IProps extends Partial<Omit<ConfigProps, 'selector'>> {
  children: React.ReactNode;
}

interface PropDrag {
  start: number;
  end: number;
}

const DEFAULT_CONFIG: Omit<ConfigProps, 'selector'> = {
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
};

class ReactSiema extends Component<IProps> {
  timer: ReturnType<typeof setInterval> | null = null;
  selector = React.createRef<HTMLDivElement>();
  sliderFrame = React.createRef<HTMLDivElement>();
  currentSlide = 0;
  onResize: () => void = () => {
    // do nothing.
  };
  pointerDown = false;
  drag: PropDrag = {
    start: 0,
    end: 0,
  };
  perPage = 0;
  selectorWidth = 0;
  innerElements: HTMLElement[] = [];
  useNavigation = false;

  constructor(props: IProps) {
    super(props);
  }

  getConfigFromProps(props: IProps): ConfigProps {
    const configProps = props as Partial<Omit<ConfigProps, 'selector'>>;
    return {
      ...DEFAULT_CONFIG,
      ...configProps,
      selector: this.selector,
    };
  }

  get config(): ConfigProps {
    return this.getConfigFromProps(this.props);
  }

  hasPerPageChanged(prevPerPage: number | PerPage, nextPerPage: number | PerPage): boolean {
    if (typeof prevPerPage === 'number' && typeof nextPerPage === 'number') {
      return prevPerPage !== nextPerPage;
    }

    if (typeof prevPerPage === 'number' || typeof nextPerPage === 'number') {
      return true;
    }

    const prevEntries = Object.entries(prevPerPage).sort(([a], [b]) => Number(a) - Number(b));
    const nextEntries = Object.entries(nextPerPage).sort(([a], [b]) => Number(a) - Number(b));

    if (prevEntries.length !== nextEntries.length) {
      return true;
    }

    for (let i = 0; i < prevEntries.length; i++) {
      if (prevEntries[i][0] !== nextEntries[i][0] || prevEntries[i][1] !== nextEntries[i][1]) {
        return true;
      }
    }

    return false;
  }

  shouldReinitialize(prevProps: IProps): boolean {
    if (React.Children.count(prevProps.children) !== React.Children.count(this.props.children)) {
      return true;
    }

    const prevConfig = this.getConfigFromProps(prevProps);
    const nextConfig = this.config;

    return (
      prevConfig.resizeDebounce !== nextConfig.resizeDebounce ||
      prevConfig.duration !== nextConfig.duration ||
      prevConfig.easing !== nextConfig.easing ||
      this.hasPerPageChanged(prevConfig.perPage, nextConfig.perPage) ||
      prevConfig.startIndex !== nextConfig.startIndex ||
      prevConfig.draggable !== nextConfig.draggable ||
      prevConfig.threshold !== nextConfig.threshold ||
      prevConfig.loop !== nextConfig.loop ||
      prevConfig.timer !== nextConfig.timer ||
      prevConfig.disabledTimer !== nextConfig.disabledTimer ||
      prevConfig.useFixedWidth !== nextConfig.useFixedWidth ||
      prevConfig.fixedWidth !== nextConfig.fixedWidth
    );
  }

  componentDidMount(): void {
    this.currentSlide = this.config.startIndex;

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

  componentDidUpdate(prevProps: IProps): void {
    if (!this.shouldReinitialize(prevProps)) {
      return;
    }

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
      WebkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
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
    const fixedWidth = this.getFixedWidth();

    if (this.config.useFixedWidth) {
      this.useNavigation = fixedWidth * this.innerElements.length > this.selectorWidth;
    } else {
      this.useNavigation =
        this.perPage > 0 && (this.selectorWidth / this.perPage) * this.innerElements.length > this.selectorWidth;
    }

    this.config.onNavigationChanged(this.useNavigation);
  }

  setSelectorWidth(): void {
    const selectorElement = this.selector.current;
    if (selectorElement) {
      this.selectorWidth = selectorElement.getBoundingClientRect().width;
    }
  }

  setInnerElements(): void {
    const sliderFrameElement = this.sliderFrame.current;

    if (!sliderFrameElement) {
      this.innerElements = [];
      return;
    }

    this.innerElements = Array.from(sliderFrameElement.children as HTMLCollectionOf<HTMLElement>);
  }

  getFixedWidth(): number {
    return Number(this.config.fixedWidth.replace('px', '')) || 0;
  }

  initialFrameWidth(): number {
    if (this.config.useFixedWidth) {
      return this.getFixedWidth() * this.innerElements.length;
    }

    return this.resolveWidth() * this.innerElements.length;
  }

  resolveWidth(): number {
    if (this.config.useFixedWidth) {
      const fixedWidth = this.getFixedWidth();

      if (fixedWidth * this.innerElements.length < this.selectorWidth) {
        return fixedWidth * this.innerElements.length;
      }

      return fixedWidth;
    }

    if (this.perPage === 0) {
      return this.selectorWidth;
    }

    return this.selectorWidth / this.perPage;
  }

  resolveSlidesNumber(): void {
    if (typeof this.config.perPage === 'number') {
      this.perPage = this.config.perPage;
    } else if (typeof this.config.perPage === 'object') {
      this.perPage = 1;
      const breakpoints = Object.entries(this.config.perPage)
        .map(([viewport, perPage]) => [Number(viewport), perPage] as const)
        .sort((a, b) => a[0] - b[0]);

      for (const [viewport, perPage] of breakpoints) {
        if (window.innerWidth > viewport) {
          this.perPage = perPage;
        }
      }
    }
  }

  prev(): void {
    const maxSlide = Math.max(this.innerElements.length - this.perPage, 0);

    if (this.currentSlide === 0 && this.config.loop) {
      this.currentSlide = maxSlide;
    } else {
      this.currentSlide = Math.max(this.currentSlide - 1, 0);
    }
    this.slideToCurrent();

    if (this.config.onPrev) this.config.onPrev(this.currentSlide);
  }

  next(): void {
    const maxSlide = Math.max(this.innerElements.length - this.perPage, 0);

    if (this.currentSlide === maxSlide && this.config.loop) {
      this.currentSlide = 0;
    } else {
      this.currentSlide = Math.min(this.currentSlide + 1, maxSlide);
    }
    this.slideToCurrent();

    if (this.config.onNext) this.config.onNext(this.currentSlide);
  }

  goTo(index: number): void {
    const maxSlide = Math.max(this.innerElements.length - 1, 0);

    this.currentSlide = Math.min(Math.max(index, 0), maxSlide);
    this.slideToCurrent();

    if (this.config.onGoTo) this.config.onGoTo(this.currentSlide);
  }

  slideToCurrent(): void {
    const sliderFrameElement = this.sliderFrame.current;

    if (!sliderFrameElement) {
      return;
    }

    const sliderStyle = sliderFrameElement.style as unknown as Record<string, string>;
    sliderStyle[transformProperty] = `translate3d(-${this.resolveTransformProperty()}px, 0, 0)`;
  }

  resolveTransformProperty(): number {
    let preCalculate = this.currentSlide * this.resolveWidth();
    if (this.config.useFixedWidth) {
      preCalculate = this.currentSlide * this.getFixedWidth();
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

  setStyle(target: React.RefObject<HTMLDivElement | null>, styles: Style): void {
    const domTarget = target.current;

    if (!domTarget) {
      return;
    }

    Object.keys(styles).forEach((attribute) => {
      (domTarget.style as unknown as Record<string, string>)[attribute] = styles[attribute];
    });
  }

  setStyleChildren(target: HTMLElement, styles: Style): void {
    Object.keys(styles).forEach((attribute) => {
      (target.style as unknown as Record<string, string>)[attribute] = styles[attribute];
    });
  }

  resolveDragCalculate(): number {
    if (this.drag.start <= 0 || this.drag.end <= 0) {
      return 0;
    }

    return this.drag.start - this.drag.end;
  }

  onTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    if (this.config.draggable) {
      this.pointerDown = true;
      this.drag.start = e.touches[0].pageX;
    }
  };

  onTouchEnd = (e: React.TouchEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    if (this.config.draggable) {
      this.pointerDown = false;
      this.setStyle(this.sliderFrame, {
        WebkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
        transition: `all ${this.config.duration}ms ${this.config.easing}`,
      });
      this.updateAfterDrag();
      this.clearDrag();
    }
  };

  onTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    if (this.config.draggable) {
      this.drag.end = e.touches[0].pageX;
      if (this.pointerDown) {
        this.setStyle(this.sliderFrame, {
          WebkitTransition: `all 0ms ${this.config.easing}`,
          transition: `all 0ms ${this.config.easing}`,
          [transformProperty]: `translate3d(${
            (this.resolveTransformProperty() + this.resolveDragCalculate()) * -1
          }px, 0, 0)`,
        });
      }
    }
  };

  onMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (this.config.draggable) {
      this.pointerDown = true;
      this.drag.start = e.pageX;
    }
  };

  onMouseUp = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    if (this.config.draggable) {
      this.pointerDown = false;
      this.setStyle(this.sliderFrame, {
        cursor: '-webkit-grab',
        WebkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
        transition: `all ${this.config.duration}ms ${this.config.easing}`,
      });
      this.updateAfterDrag();
      this.clearDrag();
    }
  };

  onMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (this.config.draggable) {
      this.drag.end = e.pageX;
      if (this.pointerDown) {
        this.setStyle(this.sliderFrame, {
          cursor: '-webkit-grabbing',
          WebkitTransition: `all 0ms ${this.config.easing}`,
          transition: `all 0ms ${this.config.easing}`,
          [transformProperty]: `translate3d(${
            (this.resolveTransformProperty() + this.resolveDragCalculate()) * -1
          }px, 0, 0)`,
        });
      }
    }
  };

  onMouseLeave = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (this.config.draggable) {
      this.drag.end = e.pageX;
      if (this.pointerDown) {
        this.pointerDown = false;
        this.setStyle(this.sliderFrame, {
          cursor: '-webkit-grab',
          WebkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
          transition: `all ${this.config.duration}ms ${this.config.easing}`,
        });
        this.updateAfterDrag();
        this.clearDrag();
      }
    }
  };

  render(): React.JSX.Element {
    return (
      <div
        ref={this.selector}
        style={{ overflow: 'hidden' }}
        onTouchStart={this.onTouchStart}
        onTouchEnd={this.onTouchEnd}
        onTouchMove={this.onTouchMove}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseLeave={this.onMouseLeave}
        onMouseMove={this.onMouseMove}
      >
        <div ref={this.sliderFrame}>
          {React.Children.map(this.props.children, (child, index) => {
            if (!React.isValidElement<{ style?: React.CSSProperties }>(child)) {
              return child;
            }

            return React.cloneElement(child, {
              key: child.key ?? index,
              style: {
                ...child.props.style,
                float: 'left',
              },
            });
          })}
        </div>
      </div>
    );
  }
}

export default ReactSiema;
