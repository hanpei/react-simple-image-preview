//@ts-nocheck

/**
 * 计算边界，返回left,top值，用来translate(X,Y)。 
 * width * scaleX 与 height * scaleY 为拖动图片当前显示的尺寸。
 * @param {*} wrapNode 容器node
 * @param {*} width fit宽度
 * @param {*} height fit高度
 * @param {*} scaleX 当前缩放x
 * @param {*} scaleY 当前缩放y
 * @param {*} top 
 * @param {*} left 
 * @param {*} gap 边界可超出的值
 */
function getBounds(wrapNode, width, height, scaleX, scaleY, top, left, gap = 60) {
  const wrapStyle = wrapNode.getBoundingClientRect();

  const BOUND_GAP = gap;
  // 当前拖动图片显示的尺寸
  const dragNodeWidth = width * scaleX;
  const dragNodeHeight = height * scaleY;

  const bounds = {
    left: (dragNodeWidth - width) / 2,
    right: wrapStyle.width - (dragNodeWidth + (width - dragNodeWidth) / 2),
    top: (dragNodeHeight - height) / 2,
    bottom: wrapStyle.height - (dragNodeHeight + (height - dragNodeHeight) / 2),
  };
  let stateLeft = left;
  let stateTop = top;

  if (dragNodeWidth < wrapStyle.width) {
    // 宽 < 容器
    // <-
    if (left < bounds.left - BOUND_GAP) {
      stateLeft = bounds.left - BOUND_GAP;
    }
    // ->
    if (left > bounds.right + BOUND_GAP) {
      stateLeft = bounds.right + BOUND_GAP;
    }
  } else {
    // 宽 > 容器
    // <-
    if (left < bounds.right - BOUND_GAP) {
      stateLeft = bounds.right - BOUND_GAP;
    }
    // ->
    if (left > bounds.left + BOUND_GAP) {
      stateLeft = bounds.left + BOUND_GAP;
    }
  }
  if (dragNodeHeight < wrapStyle.height) {
    // 高 < 容器
    if (top < bounds.top - BOUND_GAP) {
      stateTop = bounds.top - BOUND_GAP;
    }
    if (top > bounds.bottom + BOUND_GAP) {
      stateTop = bounds.bottom + BOUND_GAP;
    }
  } else {
    // 高 > 容器
    // ↑
    if (top < bounds.bottom - BOUND_GAP) {
      stateTop = bounds.bottom - BOUND_GAP;
    }
    // ↓
    if (top > bounds.top + BOUND_GAP) {
      stateTop = bounds.top + BOUND_GAP;
    }
  }

  return [stateTop, stateLeft];
}
export default getBounds;
