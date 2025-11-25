import React from 'react';

function Content({ children }) {
  return (
    <div className="app-content">
      {children || <p>Welcome to JobAppHelper. Replace this with your content.</p>}
    </div>
  );
}

export default Content;
