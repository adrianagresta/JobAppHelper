import React, { useState, useEffect } from 'react';
import { registerMenuSetter, unregisterMenuSetter, consumePending } from './menuService';
import { setContent } from './contentService';

function MenuBar() {
  const [items, setItems] = useState(() => consumePending() || []);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    registerMenuSetter(setItems);
    return () => unregisterMenuSetter(setItems);
  }, [setItems]);

  /**
   * Get inline style for a menu button based on hover state.
   * Controls the simple hover visual effect from inside MenuBar.
   * @param {boolean} isHover - whether the button is hovered
   * @returns {object} style object to apply to the button
   * @example
   * const style = getButtonStyle(true)
   */
  function getButtonStyle(isHover) {
    const base = {
      transition: 'transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease',
      outline: 'none',
    };
    if (!isHover) return base;
    return {
      ...base,
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
      backgroundColor: '#9fcfff',
      color: '#000'
    };
  }

  return (
    <div className="menu-bar">
      {items && items.map(([label, handler], idx) => (
        <button
          key={idx}
          className="menu-heading"
          onClick={() => {
            // handler may optionally return a React element to set as new content
            const res = handler && handler();
            if (res) setContent(res);
          }}
          type="button"
          onMouseEnter={() => setHovered(idx)}
          onMouseLeave={() => setHovered(null)}
          style={getButtonStyle(hovered === idx)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default MenuBar;
