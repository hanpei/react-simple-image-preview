//@ts-nocheck

const getKeyboardAction = (e) => {
  // console.log(e);
  let keyCode = e.keyCode || e.which || e.charCode;
  let isFeatrue = false;
  let actionType = '';
  switch (keyCode) {
    // key: esc
    // key space
    case 32:
      actionType = 'space';
      isFeatrue = true;
      break;
    // key: ←
    case 37:
      if (e.shiftKey) {
        actionType = 'leftFast';
      } else {
        actionType = 'left';
      }
      isFeatrue = true;
      break;
    // key: →
    case 39:
      if (e.shiftKey) {
        actionType = 'rightFast';
      } else {
        actionType = 'right';
      }
      isFeatrue = true;
      break;
    // key: ↑
    case 38:
      if (e.shiftKey) {
        actionType = 'upFast';
      } else {
        actionType = 'up';
      }
      isFeatrue = true;
      break;
    // key: ↓
    case 40:
      if (e.shiftKey) {
        actionType = 'downFast';
      } else {
        actionType = 'down';
      }
      isFeatrue = true;
      break;
    // key: =   (其实就是加号但不shift)
    case 187:
      if (e.ctrlKey || e.metaKey) {
        actionType = 'original';
      } else {
        actionType = 'zoomIn';
      }
      isFeatrue = true;
      break;
    // key: -
    case 189:
      if (e.ctrlKey || e.metaKey) {
        actionType = 'smallest'
      } else {
        actionType = 'zoomOut';
      }
      isFeatrue = true;
      break;
    // key: 0   ctl+0  cmd+0  恢复
    // case 48:
    //   if (e.ctrlKey || e.metaKey) {
    //     actionType = 'reset';
    //     isFeatrue = true;
    //   }
    //   break;
    // // key: 9  ctl+9 cmd+9 原始大小
    // case 57:
    //   if (e.ctrlKey || e.metaKey) {
    //     actionType = 'original';
    //     isFeatrue = true;
    //   }
    //   break;
    // key: c   center
    case 67:
      actionType = 'center';
      isFeatrue = true;
      break;
    // key: z   全屏切换
    case 90: {
      actionType = 'toggleFull';
      isFeatrue = true;
      break;
    }
    // key: v   input/output切换
    case 86: {
      actionType = 'toggleInputOutput';
      isFeatrue = true;
      break;
    }
    default:
      break;
  }
  if (isFeatrue) {
    e.preventDefault();
    e.stopPropagation();
  }
  return actionType;
};

export default getKeyboardAction;
