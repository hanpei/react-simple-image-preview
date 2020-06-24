function getImageFitSize(
  imgWidth: number,
  imgHeight: number,
  wrapNode: HTMLDivElement
): [number, number] {
  let width;
  let height;
  const containerWidth = wrapNode.clientWidth;
  const containerHeight = wrapNode.clientHeight;

  // 按container尺寸比例调整显示图像尺寸
  width = Math.min(containerWidth, imgWidth);
  height = (width / imgWidth) * imgHeight;
  if (height > containerHeight) {
    height = containerHeight;
    width = (height / imgHeight) * imgWidth;
  }
  return [width, height];
}

function getImageCenterXY(
  width: number,
  height: number,
  left: number,
  top: number
): { x: number; y: number } {
  const x = left + width / 2;
  const y = top + height / 2;
  return { x, y };
}

type ImageProps = {
  width: number;
  height: number;
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
};

function getZoomState(
  targetX: number,
  targetY: number,
  direction: number,
  speed: number,
  limit: number | undefined,
  imageProps: ImageProps
): ImageProps {
  let { width, height, left, top, scaleX, scaleY } = imageProps;

  const centerXY = getImageCenterXY(width, height, left, top);
  const diffX = targetX - centerXY.x;
  const diffY = targetY - centerXY.y;

  let directX = scaleX > 0 ? 1 : -1;
  let directY = scaleY > 0 ? 1 : -1;

  scaleX = scaleX + speed * direction * directX;
  scaleY = scaleY + speed * direction * directY;
  // 缩放最小值限定
  if (limit) {
    scaleX = Math.max(scaleX, limit);
    scaleY = Math.max(scaleY, limit);
  }

  top = top + ((-direction * diffY) / scaleX) * speed * directX;
  left = left + ((-direction * diffX) / scaleY) * speed * directY;

  return { width, height, scaleX, scaleY, left, top };
}

export { getImageFitSize, getImageCenterXY, getZoomState };
