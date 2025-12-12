import React, { useEffect, useState } from 'react';
import { setMenuItems } from '../structure/menuService';
import { setContent } from '../structure/contentService';
import { ApplicationsStore } from '../../indexeddb/api';
import { enqueue as enqueueSync } from '../../indexeddb/syncQueue';
import { InterviewsStore } from '../../indexeddb/api';

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
  const [interviews, setInterviews] = useState([]);

  // Handlers need access to component state and props, so define them here.
  async function handleSave() {
    try {
      const app = Object.assign({}, application || {});
      if (typeof app.id !== 'number') {
        app.id = -Date.now();
      }
      app.companyName = companyName;
      app.companyUrl = companyUrl;
      app.careersSiteUrl = careersSiteUrl;
      app.jobAdPdfBase64 = jobAdPdfBase64;
      app.roleTitle = roleTitle;
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
      await enqueueSync({ operationType: 'upsert', entityType: 'application', entityId: app.id, timestamp: Date.now() });

      const { default: HomeContent } = await import('./HomeContent');
      setContent(<HomeContent />);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to save application', err);
    }
  }

  function handleCancel() {
    import('./HomeContent').then((m) => {
      const Comp = m.default;
      if (Comp) setContent(<Comp />);
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load HomeContent', err);
    });
  }

  function handleAddInterview() {
    import('./InterviewContent').then((m) => {
      const Comp = m.default;
      if (Comp) {
        setContent(<Comp applicationId={application && application.id} />);
      } else {
        // eslint-disable-next-line no-console
        console.error('InterviewContent module did not export a default component');
      }
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load InterviewContent', err);
    });
  }

  function handleDelete() {
    // TODO: implement delete (hard delete + enqueue delete op)
    // eslint-disable-next-line no-console
    console.log('Delete clicked');
  }

  useEffect(() => {
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
      setMenuItems([]);
    };
  }, [handleSave, handleCancel, handleAddInterview, handleDelete, application]);

  // (state declarations moved above when handlers were created)

  useEffect(() => {
    let mounted = true;
    async function loadInterviews() {
      try {
        const items = await InterviewsStore.getByApplication(application && application.id);
        if (!mounted) return;
        items.sort((a, b) => {
          const ta = a && a.interviewDate ? new Date(a.interviewDate).getTime() : 0;
          const tb = b && b.interviewDate ? new Date(b.interviewDate).getTime() : 0;
          return ta - tb; // ascending
        });
        setInterviews(items || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load interviews', err);
      }
    }
    loadInterviews();
    return () => { mounted = false; };
  }, [application]);

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
      <div style={{ marginTop: 20 }}>
        <h3>Interviews</h3>
        {interviews.length === 0 ? (
          <div style={{ fontStyle: 'italic' }}>No interviews</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px' }}>Interviewer</th>
                <th style={{ textAlign: 'left', padding: '6px' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '6px' }}>Time</th>
                <th style={{ textAlign: 'left', padding: '6px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map(iv => (
                <tr key={iv.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{iv.interviewerName}</td>
                  <td style={{ padding: 8 }}>{iv.interviewDate ? new Date(iv.interviewDate).toLocaleDateString() : ''}</td>
                  <td style={{ padding: 8 }}>{iv.interviewTime}</td>
                  <td style={{ padding: 8 }}>{iv.interviewNotes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>
  );
}

/**
 * Stub handler for saving the application.
 * @example handleSave()
 */
// handlers implemented inside component; bottom legacy handlers removed

export default ApplicationContent;
