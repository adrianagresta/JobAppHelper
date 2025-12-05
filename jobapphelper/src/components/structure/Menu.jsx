import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

function useOutsideClick(ref, handler) {
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        handler();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, handler]);
}

function Menu({ title, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, () => setOpen(false));

  return (
    <div className="menu" ref={ref}>
      <button className="menu-heading" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {title}
      </button>
      {open && <div className="menu-items">{children}</div>}
    </div>
  );
}

Menu.propTypes = {
  title: PropTypes.node,
  children: PropTypes.node,
};

export default Menu;
