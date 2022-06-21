//@ts-nocheck

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './ImageView.scss';
import getBounds from './getBounds';

export default class ImageView extends PureComponent {
  static propTypes = {
    imgSrc: PropTypes.string.isRequired,
    imgLoaded: PropTypes.bool.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
    rotate: PropTypes.number.isRequired,
    onChangeImgState: PropTypes.func.isRequired,
    onResize: PropTypes.func.isRequired,
    zIndex: PropTypes.number.isRequired,
    scaleX: PropTypes.number.isRequired,
    scaleY: PropTypes.number.isRequired,
    drag: PropTypes.bool.isRequired,
    //边界回弹函数
    hanldeBoundaryBack: PropTypes.func.isRequired,
    // isDragging是为了同步两个窗口拖动时取消动画transition，停止后恢复。
    isDragging: PropTypes.bool.isRequired,
    toggleDragging: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this.state = {
      mouseX: 0,
      mouseY: 0,
    };
    this.isMouseDown = false;
  }

  componentDidMount() {
    this.dragRef = React.createRef();
    this.wrapRef = React.createRef();
    if (this.props.drag) {
      this.bindEvent();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.drag && !this.props.drag) {
      return this.bindEvent('remove');
    }
    if (!prevProps.drag && this.props.drag) {
      return this.bindEvent('remove');
    }
    if (prevProps.imgLoaded !== this.props.imgLoaded) {
      if (this.props.imgLoaded) {
        this.bindFakeWheelEvent();
      } else {
        this.bindFakeWheelEvent('remove');
      }
    }
  }

  componentWillUnmount() {
    this.bindEvent('remove');
    this.bindFakeWheelEvent('remove');
  }

  handleResize = (e) => {
    this.props.onResize();
  };

  handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!this.props.drag) {
      return;
    }
    this.setState({
      mouseX: e.nativeEvent.clientX,
      mouseY: e.nativeEvent.clientY,
    });
    this.isMouseDown = true;
    this.props.toggleDragging(true);
  };

  handleMouseMove = (e) => {
    if (this.isMouseDown) {
      let diffX = e.clientX - this.state.mouseX;
      let diffY = e.clientY - this.state.mouseY;

      this.setState({
        mouseX: e.clientX,
        mouseY: e.clientY,
      });
      const [top, left] = getBounds(
        this.wrapRef.current,
        this.props.width,
        this.props.height,
        this.props.scaleX,
        this.props.scaleY,
        this.props.top + diffY,
        this.props.left + diffX,
        33
      );
      this.props.onChangeImgState(
        this.props.width,
        this.props.height,
        top,
        left
      );
    }
  };

  handleMouseUp = (e) => {
    this.isMouseDown = false;
    this.props.toggleDragging(false);
    this.props.hanldeBoundaryBack();
  };

  bindEvent = (val = 'add') => {
    let funcName = 'addEventListener';
    if (val === 'remove') {
      funcName = 'removeEventListener';
    }

    document[funcName]('click', this.handleMouseUp, false);
    document[funcName]('mousemove', this.handleMouseMove, false);
    window[funcName]('resize', this.handleResize, false);
    // document[funcName]('wheel', this.handleWheel, { passive: false });
  };

  bindFakeWheelEvent = (val = 'add') => {
    let funcName = 'addEventListener';
    if (val === 'remove') {
      funcName = 'removeEventListener';
    }
    if (this.wrapRef.current) {
      this.wrapRef.current[funcName]('wheel', this.handleWheel, {
        passive: false,
      });
    }
  };

  //wheel=>touchpad 双指移动
  handleWheel = (e) => {
    // console.log(e);
    if (e.ctrlKey) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();

    // e.preventDefault();
    let diffX = -e.deltaX;
    let diffY = -e.deltaY;
    const [top, left] = getBounds(
      this.wrapRef.current,
      this.props.width,
      this.props.height,
      this.props.scaleX,
      this.props.scaleY,
      this.props.top + diffY,
      this.props.left + diffX,
      33
    );
    this.props.onChangeImgState(this.props.width, this.props.height, top, left);
  };

  render() {
    //就靠这个来各种变化
    let imgStyle = {
      width: `${this.props.width}px`,
      height: `${this.props.height}px`,
      transform: `
        translateX(${this.props.left}px) 
        translateY(${this.props.top}px)
        translateZ(0)
        rotate(${this.props.rotate}deg)
        scaleX(${this.props.scaleX})
        scaleY(${this.props.scaleY})
        `,
    };

    const imgClassName = () => {
      const drag = this.isMouseDown ? 'drag' : '';
      const tansition = !this.props.isDragging ? 'image-transition' : '';
      return `img ${drag} ${tansition}`;
    };

    return this.props.imgLoaded ? (
      <div className="image-view-transform-area" ref={this.wrapRef}>
        <img
          ref={this.dragRef}
          alt="this is a img"
          className={imgClassName()}
          src={this.props.imgSrc}
          style={imgStyle}
          onMouseDown={this.handleMouseDown}
        />
      </div>
    ) : (
      <div className="img-loading"> loading </div>
    );
  }
}
