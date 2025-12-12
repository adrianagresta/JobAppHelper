import React, { useEffect, useState } from 'react';
import { setMenuItems } from '../structure/menuService';
import { setContent } from '../structure/contentService';
import { ApplicationsStore } from '../../indexeddb/api';
import { enqueue as enqueueSync } from '../../indexeddb/syncQueue';

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
    // Register detail-page buttons: Save, Cancel, Add Interview, and Delete only
    // when the application is not provisional (id >= 0).
    const items = [
      ['Save', handleSave],
      ['Cancel', handleCancel],
      ['Add Interview', handleAddInterview],
    ];
    if (application && typeof application.id === 'number' && application.id >= 0) {
      items.push(['Delete', handleDelete]);
    }
    setMenuItems(items);

    return () => {
      // Clear menu when leaving application detail view
      setMenuItems([]);
    };
  }, []);

  // Local form state for all Application fields
  const [companyName, setCompanyName] = useState((application && application.companyName) || '');
  const [companyUrl, setCompanyUrl] = useState((application && application.companyUrl) || '');
  const [careersSiteUrl, setCareersSiteUrl] = useState((application && application.careersSiteUrl) || '');
  const [jobAdPdfBase64, setJobAdPdfBase64] = useState((application && application.jobAdPdfBase64) || '');
  const [roleTitle, setRoleTitle] = useState((application && application.roleTitle) || '');
  const [applicationDate, setApplicationDate] = useState((application && application.applicationDate) || '');
  const [status, setStatus] = useState((application && application.status) || '');
  const [contactEmail, setContactEmail] = useState((application && application.contactEmail) || '');
  const [baseCompensation, setBaseCompensation] = useState((application && application.baseCompensation) || '');
  const [careerSiteUsername, setCareerSiteUsername] = useState((application && application.careerSiteUsername) || '');
  const [careerSitePassword, setCareerSitePassword] = useState((application && application.careerSitePassword) || '');
  const [coverLetterText, setCoverLetterText] = useState((application && application.coverLetterText) || '');
  const [gitRepoUrl, setGitRepoUrl] = useState((application && application.gitRepoUrl) || '');
  const [rejectionDate, setRejectionDate] = useState((application && application.rejectionDate) || '');
  const [reapplyEligibleDate, setReapplyEligibleDate] = useState((application && application.reapplyEligibleDate) || '');
  const [notes, setNotes] = useState((application && application.notes) || '');

  return (
    <div>
      <h2>Application</h2>
      <p>Editing application id: {application && application.id}</p>
      <div>
        <label>
          Company Name
          <input value={companyName} onChange={e => setCompanyName(e.target.value)} />
        </label>
        <br />
        <label>
          Company URL
          <input value={companyUrl} onChange={e => setCompanyUrl(e.target.value)} />
        </label>
        <br />
        <label>
          Careers Site URL
          <input value={careersSiteUrl} onChange={e => setCareersSiteUrl(e.target.value)} />
        </label>
        <br />
        <label>
          Job Ad (base64)
          <textarea value={jobAdPdfBase64} onChange={e => setJobAdPdfBase64(e.target.value)} rows={3} />
        </label>
        <br />
        <label>
          Role Title
          <input value={roleTitle} onChange={e => setRoleTitle(e.target.value)} />
        </label>
        <br />
        <label>
          Application Date
          <input value={applicationDate} onChange={e => setApplicationDate(e.target.value)} placeholder="YYYY-MM-DDTHH:MM:SS.sssZ" />
        </label>
        <br />
        <label>
          Status
          <input value={status} onChange={e => setStatus(e.target.value)} />
        </label>
        <br />
        <label>
          Contact Email
          <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
        </label>
        <br />
        <label>
          Base Compensation
          <input value={baseCompensation} onChange={e => setBaseCompensation(e.target.value)} />
        </label>
        <br />
        <label>
          Careers Site Username
          <input value={careerSiteUsername} onChange={e => setCareerSiteUsername(e.target.value)} />
        </label>
        <br />
        <label>
          Careers Site Password
          <input value={careerSitePassword} onChange={e => setCareerSitePassword(e.target.value)} type="password" />
        </label>
        <br />
        <label>
          Cover Letter Text
          <textarea value={coverLetterText} onChange={e => setCoverLetterText(e.target.value)} rows={3} />
        </label>
        <br />
        <label>
          Git Repo URL
          <input value={gitRepoUrl} onChange={e => setGitRepoUrl(e.target.value)} />
        </label>
        <br />
        <label>
          Rejection Date
          <input value={rejectionDate} onChange={e => setRejectionDate(e.target.value)} placeholder="YYYY-MM-DDTHH:MM:SS.sssZ" />
        </label>
        <br />
        <label>
          Reapply Eligible Date
          <input value={reapplyEligibleDate} onChange={e => setReapplyEligibleDate(e.target.value)} placeholder="YYYY-MM-DDTHH:MM:SS.sssZ" />
        </label>
        <br />
        <label>
          Notes
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
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
  (async () => {
    try {
      // prepare application object from form state
      const app = Object.assign({}, application || {});
      // ensure id exists; generate provisional negative id if needed
      if (!app.id || typeof app.id !== 'number' || app.id >= 0 === false) {
        // provisional negative id: timestamp-based
        app.id = -Date.now();
      }
      app.companyName = companyName;
      app.companyUrl = companyUrl;
      app.careersSiteUrl = careersSiteUrl;
      app.jobAdPdfBase64 = jobAdPdfBase64;
      app.roleTitle = roleTitle;
      // normalize applicationDate to ISO if possible
      app.applicationDate = applicationDate ? new Date(applicationDate).toISOString() : new Date().toISOString();
      app.status = status;
      app.contactEmail = contactEmail;
      app.baseCompensation = baseCompensation;
      app.careerSiteUsername = careerSiteUsername;
      app.careerSitePassword = careerSitePassword;
      app.coverLetterText = coverLetterText;
      app.gitRepoUrl = gitRepoUrl;
      app.rejectionDate = rejectionDate || null;
      app.reapplyEligibleDate = reapplyEligibleDate || null;
      app.notes = notes;

      await ApplicationsStore.put(app);

      // enqueue sync operation
      await enqueueSync({ operationType: 'upsert', entityType: 'application', entityId: app.id, timestamp: Date.now() });

      // after save, return to home
      const { default: HomeContent } = await import('./HomeContent');
      setContent(<HomeContent />);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to save application', err);
    }
  })();
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
