// https://github.com/infeng/react-viewer
//@ts-nocheck
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ImageView from './ImageView';
import './ImageView.scss';
// import { connect } from 'react-redux';
import getKeybaordAction from './keyboardAction';
import getBounds from './getBounds';

class ImageViewContainer extends PureComponent {
  static propTypes = {
    imgSrc: PropTypes.string.isRequired,
  };
  // 参数列表 (默认)
  static defaultProps = {
    zIndex: 1000,
    // 能否拖动
    drag: true,
    // 缩放速度 建议在 0.05-0.2 之间
    zoomSpeed: 0.1,
    // 关闭快捷键
    disableKeyboardSupport: false,
    // 图片更改后是否重置缩放比例到默认
    resetZoomAfterChange: false,
    // 默认加载后的缩放比例
    defaultScale: 1,
    // 关闭鼠标滚轮缩放
    disableMouseZoom: false,
    // 图片最小缩放限制
    minScaleLimit: 1,
    // 是否按图片真实尺寸加载， 否则缩放到容器的合适比例
    loadWithImgRealSize: false,
    // 拖拽边界限制
    disableBoundaryLimit: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
      top: 15,
      left: 0,
      rotate: 0,
      imgWidth: 0,
      imgHeight: 0,
      scaleX: this.props.defaultScale,
      scaleY: this.props.defaultScale,
      imgLoaded: false,
      isDragging: false, // 同步两个窗口拖拽动画，transion样式
      diffMode: 'output',
    };
    // ref
    this.viewerRef = React.createRef(); // 外部div
    this.viewerLeftRef = React.createRef(); // 左窗口
    this.viewerRightRef = React.createRef(); // 有窗口
  }

  setContainerWidthHeight() {
    this.containerWidth = window.innerWidth;
    this.containerHeight = window.innerHeight;
    // 等div插入后更新
    const node = this.viewerLeftRef.current;
    if (node) {
      this.containerWidth = node.clientWidth;
      this.containerHeight = node.clientHeight;
    }
  }

  componentDidMount() {
    this.setContainerWidthHeight();

    // bindEvent wheel event要区分左右两个
    this.bindWheelEvent('left');
    if (!this.props.disableKeyboardSupport) {
      this.bindKeyboardEvent();
    }

    // 双窗口
    this.updateWindowByStoreState(true);
    // 加载图片
    this.loadImg(this.props.imgSrc);
  }

  componentDidUpdate(prevProps, prevState) {
    // 切换图片
    if (prevProps.imgSrc !== this.props.imgSrc) {
      this.loadImg(this.props.imgSrc);
    }
    // 处理toolbar按钮dispatch事件
    if (prevProps.imageActionInStore !== this.props.imageActionInStore) {
      this.handleAction(this.props.imageActionInStore);
      this.props.dispatchClearActionInStore();
    }
    //双窗口切换
    if (prevProps.isSplitWindowInStore !== this.props.isSplitWindowInStore) {
      this.updateWindowByStoreState();
    }
    if (prevProps.isFullWindow !== this.props.isFullWindow) {
      this.setContainerWidthHeight();
      this.handleAction('reset');
    }
  }

  componentWillUnmount() {
    this.bindWheelEvent('left', 'remove');
    if (this.props.isSplitWindowInStore) {
      this.bindWheelEvent('right', 'remove');
    }
    if (!this.props.disableKeyboardSupport) {
      this.bindKeyboardEvent('remove');
    }
  }

  updateWindowByStoreState = (isFirstLoad = false) => {
    if (this.props.isSplitWindowInStore) {
      this.setContainerWidthHeight();
      //右侧wheel
      this.bindWheelEvent('right');
      !isFirstLoad && this.handleAction('reset');
    } else {
      this.setContainerWidthHeight();
      !isFirstLoad && this.handleAction('reset');
    }
  };

  bindWheelEvent = (whichWindow, type = 'add') => {
    let funcName = 'addEventListener';
    if (type === 'remove') {
      funcName = 'removeEventListener';
    }
    if (whichWindow === 'left') {
      this.viewerLeftRef.current[funcName](
        'wheel',
        this.handleMouseScroll,
        false
      );
    }
    if (whichWindow === 'right') {
      this.viewerRightRef.current[funcName](
        'wheel',
        this.handleMouseScrollRight,
        false
      );
    }
  };

  bindKeyboardEvent = (type = 'add') => {
    let funcName = 'addEventListener';
    if (type === 'remove') {
      funcName = 'removeEventListener';
    }
    document[funcName]('keydown', this.handleKeydown, false);
    document[funcName]('keyup', this.hanldeBoundaryBack, false);
  };

  loadImg(url) {
    this.setState({ imgLoaded: false });
    const img = new Image();
    img.src = url;
    img.onload = () => {
      // 防止切换导致img加载时序不同引起计算尺寸错误，判定当前imgSrc与加载的img.src必须一致
      if (this.props.imgSrc === img.src) {
        this.calcImageState(img.width, img.height);
      }
    };
  }

  calcImageState(
    imgWidth,
    imgHeight,
    getResetSize = false,
    getOriginalSize = false
  ) {
    // 图片宽高
    let width = imgWidth;
    let height = imgHeight;
    if (!getOriginalSize) {
      [width, height] = this.getImgWidthHeight(imgWidth, imgHeight);
    }
    //中心点位置
    let left = (this.containerWidth - width) / 2;
    let top = (this.containerHeight - height) / 2;
    // 缩放比例
    let scaleX = this.state.scaleX;
    let scaleY = this.state.scaleY;

    // 重新加载图片后是否保持缩放比例
    if (this.props.resetZoomAfterChange || getResetSize) {
      scaleX = this.props.defaultScale;
      scaleY = this.props.defaultScale;
    }

    this.setState({
      width,
      height,
      left,
      top,
      imgWidth: imgWidth,
      imgHeight: imgHeight,
      imgLoaded: true,
      scaleX,
      scaleY,
    });
  }

  getImgWidthHeight(imgWidth, imgHeight) {
    let width = 0;
    let height = 0;
    let maxWidth = this.containerWidth;
    let maxHeight = this.containerHeight;

    // 按container尺寸比例调整显示图像尺寸
    width = Math.min(maxWidth, imgWidth);
    height = (width / imgWidth) * imgHeight;
    if (height > maxHeight) {
      height = maxHeight;
      width = (height / imgHeight) * imgWidth;
    }
    if (this.props.loadWithImgRealSize) {
      width = imgWidth;
      height = imgHeight;
    }
    return [width, height];
  }

  handleChangeImgState = (width, height, top, left) => {
    this.setState({
      width: width,
      height: height,
      top: top,
      left: left,
    });
  };

  hanldeBoundaryBack = () => {
    if (this.props.disableBoundaryLimit) {
      return;
    }
    const [finalTop, finalLeft] = getBounds(
      this.viewerLeftRef.current,
      this.state.width,
      this.state.height,
      this.state.scaleX,
      this.state.scaleY,
      this.state.top,
      this.state.left,
      0
    );

    this.setState({
      top: finalTop,
      left: finalLeft,
      diffMode: 'output',
    });
  };

  handleMove = (direct, delta) => {
    let left = this.state.left;
    let top = this.state.top;
    switch (direct) {
      case 'left':
        left = left - delta;
        break;
      case 'up':
        top = top - delta;
        break;
      case 'right':
        left = left + delta;
        break;
      case 'down':
        top = top + delta;
        break;
      default:
        break;
    }
    const [finalTop, finalLeft] = getBounds(
      this.viewerLeftRef.current,
      this.state.width,
      this.state.height,
      this.state.scaleX,
      this.state.scaleY,
      top,
      left,
      33
    );
    this.handleChangeImgState(
      this.state.width,
      this.state.height,
      finalTop,
      finalLeft
    );
  };

  // 目前没用上
  handleScaleX = (factor) => {
    this.setState({
      scaleX: this.state.scaleX * factor,
    });
  };

  // 目前没用上
  handleScaleY = (factor) => {
    this.setState({
      scaleY: this.state.scaleY * factor,
    });
  };

  handleScrollZoom = (targetX, targetY, direct, isRightWindow) => {
    this.handleZoom(
      targetX,
      targetY,
      direct,
      this.props.zoomSpeed,
      isRightWindow
    );
  };

  //单双窗口中心计算选择
  selectImgCenterXYMethod = (isRightWindow) => {
    if (isRightWindow) {
      return this.getSencondImageCenterXY();
    }
    return this.getImageCenterXY();
  };

  handleZoom = (targetX, targetY, direct, scale, isRightWindow) => {
    let imgCenterXY = this.selectImgCenterXYMethod(isRightWindow);
    let diffX = targetX - imgCenterXY.x;
    let diffY = targetY - imgCenterXY.y;
    let top = 0;
    let left = 0;
    let width = 0;
    let height = 0;
    let scaleX = 0;
    let scaleY = 0;
    if (this.state.width === 0) {
      const [imgWidth, imgHeight] = this.getImgWidthHeight(
        this.state.imgWidth,
        this.state.imgHeight
      );
      left = (this.containerWidth - imgWidth) / 2;
      top = (this.containerHeight - imgHeight) / 2;
      width = this.state.width + imgWidth;
      height = this.state.height + imgHeight;
      scaleX = 1;
      scaleY = 1;
    } else {
      let directX = this.state.scaleX > 0 ? 1 : -1;
      let directY = this.state.scaleY > 0 ? 1 : -1;
      scaleX = this.state.scaleX + scale * direct * directX;
      scaleY = this.state.scaleY + scale * direct * directY;
      // 缩放最小值限定
      if (
        Math.abs(scaleX) < this.props.minScaleLimit ||
        Math.abs(scaleY) < this.props.minScaleLimit
      ) {
        scaleX = this.props.minScaleLimit;
        scaleY = this.props.minScaleLimit;
      }
      top =
        this.state.top +
        ((-direct * diffY) / this.state.scaleX) * scale * directX;
      left =
        this.state.left +
        ((-direct * diffX) / this.state.scaleY) * scale * directY;
      width = this.state.width;
      height = this.state.height;
    }
    this.setState({
      width: width,
      scaleX: scaleX,
      scaleY: scaleY,
      height: height,
      top: top,
      left: left,
    });
  };

  getImageCenterXY = () => {
    return {
      x: this.state.left + this.state.width / 2,
      y: this.state.top + this.state.height / 2,
    };
  };
  getSencondImageCenterXY = () => {
    return {
      x: this.state.left + this.state.width / 2 + this.containerWidth,
      y: this.state.top + this.state.height / 2,
    };
  };

  // 目前没用上
  handleRotate = (isClockwise) => {
    this.setState({
      rotate: this.state.rotate + 90 * (isClockwise ? 1 : -1),
    });
  };

  handleResize = () => {
    this.setContainerWidthHeight();
    let left = (this.containerWidth - this.state.width) / 2;
    let top = (this.containerHeight - this.state.height) / 2;
    this.setState({
      left: left,
      top: top,
    });
  };

  handleShiftImgSrc = (diffMode) => {
    this.setState({
      diffMode,
    });
  };

  handleKeydown = (e) => {
    const type = getKeybaordAction(e);
    this.handleAction(type);
  };

  handleAction = (type) => {
    switch (type) {
      case 'space':
        this.handleShiftImgSrc('input');
        break;
      case 'up':
        this.handleMove('up', 10);
        break;
      case 'down':
        this.handleMove('down', 10);
        break;
      case 'left':
        this.handleMove('left', 10);
        break;
      case 'right':
        this.handleMove('right', 10);
        break;
      case 'upFast':
        this.handleMove('up', 100);
        break;
      case 'downFast':
        this.handleMove('down', 100);
        break;
      case 'leftFast':
        this.handleMove('left', 100);
        break;
      case 'rightFast':
        this.handleMove('right', 100);
        break;
      case 'zoomIn': {
        const imgCenterXY = this.getImageCenterXY();
        this.handleZoom(imgCenterXY.x, imgCenterXY.y, 1, this.props.zoomSpeed);
        break;
      }
      case 'zoomOut': {
        const imgCenterXY2 = this.getImageCenterXY();
        this.handleZoom(
          imgCenterXY2.x,
          imgCenterXY2.y,
          -1,
          this.props.zoomSpeed
        );
        break;
      }
      case 'reset': {
        this.calcImageState(this.state.imgWidth, this.state.imgHeight, true);
        break;
      }
      case 'original': {
        const step = this.state.imgWidth / this.state.width - this.state.scaleX;
        const imgCenterXY = this.getImageCenterXY();
        this.handleZoom(imgCenterXY.x, imgCenterXY.y, 1, step);

        break;
      }
      case 'smallest': {
        const step = this.state.scaleX - this.props.minScaleLimit;
        const imgCenterXY = this.getImageCenterXY();
        this.handleZoom(imgCenterXY.x, imgCenterXY.y, -1, step);
        break;
      }
      case 'center': {
        const { width, height } = this.state;
        let left = (this.containerWidth - width) / 2;
        let top = (this.containerHeight - height) / 2;
        this.handleChangeImgState(width, height, top, left);
        break;
      }
      case 'toggleFull': {
        this.props.dispatchFullWindow();
        break;
      }
      case 'toggleInputOutput': {
        this.props.dispatchToggleInputOutput();
        break;
      }
      default:
        break;
    }
  };

  //ctrl+wheel 缩放
  handleMouseScroll = (e) => {
    if (!e.ctrlKey) {
      return;
    }
    if (this.props.disableMouseZoom) {
      return;
    }
    e.preventDefault();
    let direct = 0; // 0 1 -1
    const value = e.deltaY;
    if (value === 0) {
      direct = 0;
    } else {
      direct = value > 0 ? -1 : 1;
    }
    if (direct !== 0) {
      let x = e.clientX;
      let y = e.clientY;
      this.handleScrollZoom(x, y, direct);
    }
  };
  handleMouseScrollRight = (e) => {
    if (!e.ctrlKey) {
      return;
    }
    if (this.props.disableMouseZoom) {
      return;
    }
    e.preventDefault();
    let direct = 0; // 0 1 -1
    const value = e.deltaY;
    if (value === 0) {
      direct = 0;
    } else {
      direct = value > 0 ? -1 : 1;
    }
    if (direct !== 0) {
      let x = e.clientX;
      let y = e.clientY;
      this.handleScrollZoom(x, y, direct, true);
    }
  };

  toggleDragging = (isDragging) => {
    this.setState({ isDragging });
  };

  render() {
    const { taskId, options } = this.props;
    // const optionsDic = JSON.parse(options);

    let zIndex = this.props.zIndex ? this.props.zIndex : 1000;
    // 这个是显示的原图尺寸比例，原图为100%,与this.state.scale无关
    const zoom = Math.floor(
      (this.state.width / this.state.imgWidth) * this.state.scaleX * 100
    );
    const info = () => {
      if (this.props.isSplitWindowInStore) {
        return '输入';
      }
      if (this.props.isDisplayInput) {
        return '输入';
      }
      return `输出 id: ${taskId}`;
    };
    return (
      <div ref={this.viewerRef} className="zoom-pan-image-view-container">
        <div className="img-state">
          <div>w:{this.state.imgWidth.toFixed(0)}</div>
          <div>h:{this.state.imgHeight.toFixed(0)}</div>
          <div>zoom: {zoom}%</div>
          <div>放大: + / cmd + </div>
          <div>缩小: - / cmd - </div>
          <div>移动：上下左右</div>
          {/* <div>fit: cmd + 0</div>
          <div>原图大小: cmd + 9</div> */}
          <div>居中: c </div>
          <div>查看输入: 空格键 </div>
          <div>全屏: z</div>
        </div>

        <div className="split-view" ref={this.viewerLeftRef}>
          {/* <div className="img-info">{info()}</div> */}
          <ImageView
            name="left"
            imgSrc={
              this.props.isSplitWindowInStore
                ? this.props.input
                : this.state.diffMode == 'output'
                ? this.props.imgSrc
                : this.props.input //为了按下空格的时候对吧原图
            }
            width={this.state.width}
            height={this.state.height}
            top={this.state.top}
            left={this.state.left}
            rotate={this.state.rotate}
            onChangeImgState={this.handleChangeImgState}
            onResize={this.handleResize}
            zIndex={zIndex}
            scaleX={this.state.scaleX}
            scaleY={this.state.scaleY}
            drag={this.props.drag}
            imgLoaded={this.state.imgLoaded}
            hanldeBoundaryBack={this.hanldeBoundaryBack}
            isDragging={this.state.isDragging}
            toggleDragging={this.toggleDragging}
            getDragRef={this.getDragRef}
          />
        </div>
        {this.props.isSplitWindowInStore && (
          <div className="split-view" ref={this.viewerRightRef}>
            <div className="img-info">输出</div>
            <ImageView
              name="right"
              imgSrc={this.props.output}
              width={this.state.width}
              height={this.state.height}
              top={this.state.top}
              left={this.state.left}
              rotate={this.state.rotate}
              onChangeImgState={this.handleChangeImgState}
              onResize={this.handleResize}
              zIndex={zIndex}
              scaleX={this.state.scaleX}
              scaleY={this.state.scaleY}
              drag={this.props.drag}
              imgLoaded={this.state.imgLoaded}
              hanldeBoundaryBack={this.hanldeBoundaryBack}
              isDragging={this.state.isDragging}
              toggleDragging={this.toggleDragging}
              getDragRef={this.getDragRef}
            />
          </div>
        )}
      </div>
    );
  }
}

// const mapState = ({ imageViewModel }) => {
//   // console.log('currentImgIndex', imageViewModel.currentImgIndex);
//   // console.log('list.length', imageViewModel.list.length);
//   return {
//     imageActionInStore: imageViewModel.action,
//     isSplitWindowInStore: imageViewModel.isSplitWindow,
//     isFullWindow: imageViewModel.isFullWindow,
//     isDisplayInput: imageViewModel.isDisplayInput,
//     input: (imageViewModel.list[imageViewModel.currentImgIndex] || {}).inputUrl,
//     output: (imageViewModel.list[imageViewModel.currentImgIndex] || {})
//       .outputUrl,
//     options: (imageViewModel.list[imageViewModel.currentImgIndex] || {})
//       .options,
//     taskId: (imageViewModel.list[imageViewModel.currentImgIndex] || {}).id,
//   };
// };

// const mapDispatch = ({ imageViewModel }) => ({
//   dispatchFullWindow: imageViewModel.toggleFullWindow,
//   dispatchClearActionInStore: imageViewModel.clearAction,
//   dispatchToggleInputOutput: imageViewModel.toggleInputOutput,
// });

export default ImageViewContainer;
// export default connect(mapState, mapDispatch)(ImageViewContainer);
