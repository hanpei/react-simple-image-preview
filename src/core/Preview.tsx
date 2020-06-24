import React, { Component, CSSProperties } from 'react';
import './Preview.scss';
import { events, addEvent, removeEvent } from '../utils/events';
import { getImageFitSize, getZoomState } from '../utils/imageData';
import { rafThrottle } from '../utils/rafThrottle';

type PreviewProps = typeof ImagePreview.defaultProps & {
  // 图片src
  imgSrc: string;
  // z-index
  zIndex: number;
  // 缩放速度 建议在 0.05-0.2 之间
  zoomSpeed: number;
  // 图片更改后是否重置缩放比例到默认
  resetZoomAfterChange: boolean;
  // 默认加载后的缩放比例
  defaultScale: number;
  // 图片最小缩放限制
  minScaleLimit: number;
  // 是否按图片真实尺寸加载， 否则缩放到容器的合适比例
  loadWithImgRealSize: boolean;
  // 动画时长
  transitionDuration: number;
  // 缓动动画函数
  transitionTimingFunction: string | Function;

  // 关闭鼠标滚轮缩放
  disableMouseZoom: boolean;
  // 拖拽边界限制
  disableBoundaryLimit: boolean;
  // 关闭拖动
  disableDrag: boolean;
  // 关闭快捷键
  disableKeyboardSupport: boolean;
};

type PreviewState = {
  width: number;
  height: number;
  top: number;
  left: number;
  rotate: number;
  imgWidth: number;
  imgHeight: number;
  scaleX: number;
  scaleY: number;
  imgLoaded: boolean;
  isDragging: boolean;
};

type MovingProps = {
  lastX: number;
  lastY: number;
};

class ImagePreview extends Component<PreviewProps, PreviewState> {
  static defaultProps = {
    zIndex: 1000,
    disableDrag: false,
    zoomSpeed: 0.1,
    disableKeyboardSupport: false,
    resetZoomAfterChange: false,
    defaultScale: 1,
    disableMouseZoom: false,
    minScaleLimit: 0.1,
    loadWithImgRealSize: false,
    disableBoundaryLimit: false,
    transitionDuration: 300,
    transitionTimingFunction: 'ease-out',
  };

  private wrapRef = React.createRef<HTMLDivElement>();
  private containerWidth = 0;
  private containerHeight = 0;
  private movingProps: MovingProps = {
    lastX: NaN,
    lastY: NaN,
  };

  constructor(props: PreviewProps) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      rotate: 0,
      imgWidth: 0,
      imgHeight: 0,
      scaleX: props.defaultScale,
      scaleY: props.defaultScale,
      imgLoaded: false,
      isDragging: false,
    };
  }

  componentDidMount() {
    this.setContainerSize();
    this.loadImage(this.props.imgSrc);
    this.bindEvents();
  }

  setContainerSize(): void {
    this.containerWidth = this.wrapRef.current!.clientWidth;
    this.containerHeight = this.wrapRef.current!.clientHeight;
  }

  loadImage(src: string) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (src === this.props.imgSrc) {
        this.initImageState(img.width, img.height);
      }
    };
  }

  initImageState(imgWidth: number, imgHeight: number): void {
    const [width, height] = getImageFitSize(
      imgWidth,
      imgHeight,
      this.wrapRef.current!
    );
    const left = (this.containerWidth - width) / 2;
    const top = (this.containerHeight - height) / 2;

    this.setState({
      width,
      height,
      left,
      top,
      imgWidth: imgWidth,
      imgHeight: imgHeight,
      scaleX: this.state.scaleX,
      scaleY: this.state.scaleY,
      imgLoaded: true,
    });
  }

  /* events相关 */
  bindEvents(): void {
    // resize
    addEvent(window, events.resize, this.handleResize, false);
    // wheel,触控板放大缩小
    addEvent(
      this.wrapRef.current!,
      events.wheel,
      this.handleWheelScroll as EventListener,
      false
    );
    // mouse move start
    addEvent(
      this.wrapRef.current!,
      events.mouse.down,
      this.handleMoveStart as EventListener,
      false
    );
  }

  handleResize = (): void => {
    this.setContainerSize();
    this.initImageState(this.state.imgWidth, this.state.imgHeight);
  };

  handleWheelScroll = (e: WheelEvent): void => {
    e.preventDefault();
    if (this.props.disableMouseZoom) {
      return;
    }

    const { deltaY = 0 } = e;
    const direction = deltaY === 0 ? 0 : deltaY < 0 ? 1 : -1;
    const x = e.clientX!;
    const y = e.clientY!;
    this.handleZoom(x, y, direction, this.props.zoomSpeed);
  };

  handleMoveStart = (e: MouseEvent) => {
    e.preventDefault();
    this.setState({
      isDragging: true,
    });
    this.movingProps = {
      lastX: e.clientX,
      lastY: e.clientY,
    };
    addEvent(
      this.wrapRef.current!,
      events.mouse.move,
      this.handleMove as EventListener,
      false
    );
    addEvent(
      this.wrapRef.current!,
      events.mouse.up,
      this.handleMoveEnd as EventListener,
      false
    );
  };

  private needRaf = true;

  handleMove = (e: MouseEvent) => {
    e.preventDefault();
    if (this.state.isDragging) {
      this.updateMoveState(e.clientX, e.clientY);
    }
  };

  updateMoveState = rafThrottle((x: number, y: number) => {
    const deltaX = x - this.movingProps.lastX;
    const deltaY = y - this.movingProps.lastY;
    this.movingProps.lastX = x;
    this.movingProps.lastY = y;
    this.setState({
      left: this.state.left + deltaX,
      top: this.state.top + deltaY,
    });
  });

  handleMoveEnd = (e: MouseEvent) => {
    e.preventDefault();

    this.setState({
      isDragging: false,
    });
    removeEvent(
      this.wrapRef.current!,
      events.mouse.move,
      this.handleMove as EventListener,
      false
    );
    removeEvent(
      this.wrapRef.current!,
      events.mouse.up,
      this.handleMoveEnd as EventListener,
      false
    );
  };

  handleZoom(
    targetX: number,
    targetY: number,
    direction: number,
    speed: number
  ) {
    const nextState = getZoomState(
      targetX,
      targetY,
      direction,
      speed,
      this.props.minScaleLimit,
      {
        width: this.state.width,
        height: this.state.height,
        left: this.state.left,
        top: this.state.top,
        scaleX: this.state.scaleX,
        scaleY: this.state.scaleY,
      }
    );

    this.setState({
      top: nextState.top,
      left: nextState.left,
      scaleX: nextState.scaleX,
      scaleY: nextState.scaleY,
    });
  }

  render() {
    const imgStyle = {
      width: `${this.state.width}px`,
      height: `${this.state.height}px`,
      transform: `
        translateX(${this.state.left}px) 
        translateY(${this.state.top}px)
        translateZ(0)
        rotate(${this.state.rotate}deg)
        scaleX(${this.state.scaleX})
        scaleY(${this.state.scaleY})
        `,
    };

    const imgTransition: CSSProperties = {
      transitionProperty: 'width, height, margin, transform',
      transitionDuration: `${this.props.transitionDuration}ms`,
      transitionTimingFunction: this.props.transitionTimingFunction,
    };

    const moveStyle: CSSProperties = this.state.isDragging
      ? { cursor: 'move' }
      : { cursor: 'default', ...imgTransition };

    return (
      <div className="image-preview-container" ref={this.wrapRef}>
        <div className="log-code">
          <h2>state</h2>
          <pre>{JSON.stringify(this.state, null, ' ')}</pre>
          <h2>props</h2>
          <pre>{JSON.stringify(this.props, null, ' ')}</pre>
        </div>
        {this.state.imgLoaded ? (
          <img
            src={this.props.imgSrc}
            alt=""
            style={{ ...imgStyle, ...moveStyle }}
          />
        ) : (
          'loading'
        )}
      </div>
    );
  }
}

export default ImagePreview;
