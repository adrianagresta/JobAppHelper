import React from 'react';
import PropTypes from 'prop-types';

function Header({ children }) {
  return (
    <div className="app-header">
      {children || <div className="app-title">Applicant's Assistant</div>}
    </div>
  );
}

Header.propTypes = {
  children: PropTypes.node,
};

export default Header;
