import React, { useEffect } from 'react';
import { setMenuItems } from '../structure/menuService';
import { setContent } from '../structure/contentService';

/**
 * ApplicationContent component.
 * Renders a simple application editor scaffold and registers
 * the Application-detail menu buttons on mount.
 *
 * Props:
 * - application: object representing the application being edited (may be provisional)
 *
 * Example:
 * <ApplicationContent application={{ id: -1 }} />
 */
function ApplicationContent({ application }) {
  useEffect(() => {
    // Register detail-page buttons: Save, Cancel, Add Interview, Delete
    setMenuItems([
      ['Save', handleSave],
      ['Cancel', handleCancel],
      ['Add Interview', handleAddInterview],
      ['Delete', handleDelete],
    ]);

    return () => {
      // Clear menu when leaving application detail view
      setMenuItems([]);
    };
  }, []);

  return (
    <div>
      <h2>Application</h2>
      <p>Editing application id: {application && application.id}</p>
      <div>
        <label>
          Company Name
          <input defaultValue={(application && application.companyName) || ''} />
        </label>
        <br />
        <label>
          Role Title
          <input defaultValue={(application && application.roleTitle) || ''} />
        </label>
        <div style={{ marginTop: 12 }}>
          <small>Use the menu buttons to Save / Cancel / Add Interview / Delete</small>
        </div>
      </div>
    </div>
  );
}

/**
 * Stub handler for saving the application.
 * @example handleSave()
 */
function handleSave() {
  console.log('Save clicked');
}

/**
 * Stub handler for canceling edit.
 * @example handleCancel()
 */
function handleCancel() {
  // Dynamically load HomeContent and set it as the active content.
  // This avoids static imports and potential circular dependencies.
  import('./HomeContent').then((m) => {
    const Comp = m.default;
    if (Comp) {
      setContent(<Comp />);
    } else {
      console.error('HomeContent module did not export a default component');
    }
  }).catch((err) => {
    console.error('Failed to load HomeContent', err);
  });
}

/**
 * Stub handler for adding an interview.
 * @example handleAddInterview()
 */
function handleAddInterview() {
  // Dynamically load InterviewContent and set it as current content.
  // Do not return a Promise (MenuBar treats a returned Promise as a renderable
  // value). Call setContent when the module is loaded instead.
  import('./InterviewContent').then((m) => {
    const Comp = m.default;
    if (Comp) {
      setContent(<Comp />);
    } else {
      console.error('InterviewContent module did not export a default component');
    }
  }).catch((err) => {
    console.error('Failed to load InterviewContent', err);
  });
}

/**
 * Stub handler for deleting the application.
 * @example handleDelete()
 */
function handleDelete() {
  console.log('Delete clicked');
}

export default ApplicationContent;
