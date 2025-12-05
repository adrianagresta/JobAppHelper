import React from 'react';
import PropTypes from 'prop-types';

function MenuItem({ children, onClick }) {
  return (
    <div className="menu-item" onClick={onClick} role="menuitem" tabIndex={0}>
      {children}
    </div>
  );
}

MenuItem.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
};

export default MenuItem;
