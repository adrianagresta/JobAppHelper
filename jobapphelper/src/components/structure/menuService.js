// Service for updating MenuBar from anywhere in the app.
// Export a single function `setMenuItems(items)` where items is
// an array of [label, handler] pairs.

let _setter = null;
let _pending = null;

/**
 * Set the menu items for the global MenuBar.
 *
 * @param {Array<[string, function]>} items - array of [label, handler] pairs
 * @example
 * setMenuItems([['Home', () => {}], ['About', () => {}]])
 */
export function setMenuItems(items) {
  if (_setter) {
    _setter(items || []);
  } else {
    _pending = items || [];
  }
}

/**
 * Register a setter function for the MenuBar component to allow
 * the service to update the MenuBar items.
 *
 * @param {function} setter - React state setter (items => void)
 * @example
 * registerMenuSetter(setItems)
 */
export function registerMenuSetter(setter) {
  _setter = setter;
}

/**
 * Unregister the previously registered MenuBar setter.
 *
 * @param {function} setter - the same setter passed during registration
 * @example
 * unregisterMenuSetter(setItems)
 */
export function unregisterMenuSetter(setter) {
  if (_setter === setter) _setter = null;
}

/**
 * Consume any pending items set before the MenuBar mounted.
 * Returns the pending value and clears it.
 *
 * @returns {Array<[string,function]>|null}
 * @example
 * const pending = consumePending()
 */
export function consumePending() {
  const p = _pending;
  _pending = null;
  return p;
}
