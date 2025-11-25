import React from 'react';
import PropTypes from 'prop-types';

function Header({ children }) {
  return (
    <div className="app-header">
      {children || <h1>JobAppHelper</h1>}
    </div>
  );
}

Header.propTypes = {
  children: PropTypes.node,
};

export default Header;
