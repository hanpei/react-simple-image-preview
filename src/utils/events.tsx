export const events = {
  mouse: {
    down: 'mousedown',
    move: 'mousemove',
    up: 'mouseup',
    click: 'click',
  },
  touch: {
    start: 'touchstart',
    move: 'touchmove',
    stop: 'touchend',
  },
  wheel: 'mousewheel',
  resize: 'resize',
};

export function addEvent(
  node: Node | Window,
  event: string,
  handler: EventListenerOrEventListenerObject,
  options?: Object
): void {
  const eventOptions = { capture: true, ...options };
  node.addEventListener(event, handler, eventOptions);
}

export function removeEvent(
  node: Node,
  event: string,
  handler: EventListenerOrEventListenerObject,
  options?: Object
) {
  const eventOptions = { capture: true, ...options };
  node.removeEventListener(event, handler, eventOptions);
}
