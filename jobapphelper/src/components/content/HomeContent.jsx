import React, { useEffect } from 'react';
import { setMenuItems } from '../structure/menuService';
import { setContent } from '../structure/contentService';

/**
 * Home content component and its menu handlers.
 */
function HomeContent() {
  useEffect(() => {
    setMenuItems([
      ['New Application', handleNewApplication],
      ['Sync', handleSync],
      ['Import', handleImport],
      ['Export', handleExport],
    ]);
    return () => {
      // clear menu when leaving home
      setMenuItems([]);
    };
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <p>This is a scaffolded layout. Replace with your content.</p>
    </div>
  );
}

/**
 * Stub: open the new application form.
 * @example handleNewApplication()
 */
/**
 * Handler to open the new ApplicationContent.
 * Dynamically imports the `ApplicationContent` component and sets it as the
 * current content using the content service. This avoids static circular
 * imports.
 *
 * @example
 * handleNewApplication()
 */
async function handleNewApplication() {
  const mod = await import('./ApplicationContent');
  // create a new provisional application (id negative indicates provisional)
  const el = <mod.default application={{ id: -1 }} />;
  setContent(el);
}

/**
 * Stub: trigger synchronization.
 * @example handleSync()
 */
function handleSync() {
  console.log('Sync clicked');
}

/**
 * Stub: open import dialog.
 * @example handleImport()
 */
function handleImport() {
  console.log('Import clicked');
}

/**
 * Stub: export data.
 * @example handleExport()
 */
function handleExport() {
  console.log('Export clicked');
}

export default HomeContent;
