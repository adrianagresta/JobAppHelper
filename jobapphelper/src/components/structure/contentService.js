// Service for updating the Layout content area from anywhere in the app.
// Export `setContent(element)` where `element` is a React element (JSX).

let _setter = null;
let _pending = null;

export function setContent(element) {
  if (_setter) {
    _setter(element);
  } else {
    _pending = element || null;
  }
}

export function registerContentSetter(setter) {
  _setter = setter;
}

export function unregisterContentSetter(setter) {
  if (_setter === setter) _setter = null;
}

export function consumePendingContent() {
  const p = _pending;
  _pending = null;
  return p;
}

