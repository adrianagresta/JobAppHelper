import React, { useEffect, useState } from 'react';
import { setMenuItems } from '../structure/menuService';
import { setContent } from '../structure/contentService';
import { ApplicationsStore, StatusCodesStore, StatusStore } from '../../indexeddb/api';

/**
 * Home content component.
 * Shows a table of applications (excluding rejected) ordered by applicationDate
 * descending. If no applications are found, displays a "No Applications Found"
 * message instead of the table. Registers the home menu buttons on mount.
 */
function HomeContent() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    setMenuItems([
      ['New Application', handleNewApplication],
      ['Sync', handleSync],
      ['Import', handleImport],
      ['Export', handleExport],
    ]);

    // load applications
    let mounted = true;
    /**
     * Load applications and status codes and filter out any application
     * whose status corresponds to a rejected status code.
     * The statusCodes store entries are expected to have fields:
     * - code: the status code string
     * - label: human label
     * - isActive: boolean (optional)
     *
     * We treat a status as rejected if:
     * - the status code's `code` equals 'rejected', or
     * - the status code `label` equals 'rejected' (case-insensitive), or
     * - the status code has `isActive === false`.
     */
    async function load() {
      try {
        const [all, statusCodes] = await Promise.all([
          ApplicationsStore.getAll(),
          StatusCodesStore.getAll(),
        ]);
        if (!mounted) return;

        const codes = (statusCodes || []).reduce((m, sc) => {
          if (sc && sc.code) m[sc.code] = sc;
          return m;
        }, {});

        const filtered = (all || []).filter(a => {
          if (!a) return false;
          const sc = codes[a.status];
          if (!sc) {
            // no status code definition; keep the application
            return true;
          }
          const codeLower = (sc.code || '').toString().toLowerCase();
          const labelLower = (sc.label || '').toString().toLowerCase();
          if (codeLower === 'rejected' || labelLower === 'rejected') return false;
          if (typeof sc.isActive === 'boolean' && sc.isActive === false) return false;
          return true;
        });

        filtered.sort((a, b) => {
          const ta = a && a.applicationDate ? new Date(a.applicationDate).getTime() : 0;
          const tb = b && b.applicationDate ? new Date(b.applicationDate).getTime() : 0;
          return tb - ta;
        });
        setApplications(filtered);
      } catch (err) {
        // keep it simple for scaffold
        // eslint-disable-next-line no-console
        console.error('Failed to load applications', err);
      }
    }
    load();

    return () => {
      mounted = false;
      // clear menu when leaving home
      setMenuItems([]);
    };
  }, []);

  return (
    <div>
      {applications.length === 0 ? (
        <div style={{ marginTop: 12, fontStyle: 'italic' }}>No Applications Found</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px' }} />
              <th style={{ textAlign: 'left', padding: '6px' }}>Company</th>
              <th style={{ textAlign: 'left', padding: '6px' }}>Role</th>
              <th style={{ textAlign: 'left', padding: '6px' }}>Application Date</th>
              <th style={{ textAlign: 'left', padding: '6px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
            <tr key={app.id} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: '8px', width: 80 }}>
                <a href="#" onClick={(e) => { e.preventDefault(); openApplicationById(app.id); }}>
                  Open
                </a>
              </td>
              <td style={{ padding: '8px' }}>{app.companyName}</td>
              <td style={{ padding: '8px' }}>{app.roleTitle}</td>
              <td style={{ padding: '8px' }}>{app.applicationDate ? new Date(app.applicationDate).toLocaleString() : ''}</td>
              <td style={{ padding: '8px' }}>{app.status}</td>
            </tr>
            ))}
          </tbody>
        </table>
      )}
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
  try {
    const provisionalId = await StatusStore.allocateNextProvisionalId();
    const mod = await import('./ApplicationContent');
    const el = <mod.default application={{ id: provisionalId }} />;
    setContent(el);
  } catch (err) {
    // fallback to -1
    // eslint-disable-next-line no-console
    console.error('Failed to allocate provisional id, falling back to -1', err);
    const mod = await import('./ApplicationContent');
    const el = <mod.default application={{ id: -1 }} />;
    setContent(el);
  }
}


/**
 * Open an existing application in the content area.
 * Dynamically imports the ApplicationContent component and sets it as
 * the current content.
 *
 * @param {object} application - the application record to open
 * @example
 * openApplication(application)
 */
async function openApplication(application) {
  try {
    const { default: ApplicationContent } = await import('./ApplicationContent');
    setContent(<ApplicationContent application={application} />);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to load ApplicationContent', err);
  }
}

/**
 * Open application by id: fetch full application from DB and open it.
 * @param {number} id - application id
 */
async function openApplicationById(id) {
  try {
    const app = await ApplicationsStore.get(id);
    if (!app) return;
    const { default: ApplicationContent } = await import('./ApplicationContent');
    setContent(<ApplicationContent application={app} />);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to open application', err);
  }
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
