import React, { useState, useEffect } from 'react';
import { setMenuItems } from '../structure/menuService';
import { setContent } from '../structure/contentService';
import { InterviewsStore } from '../../indexeddb/api';
import { enqueue as enqueueSync } from '../../indexeddb/syncQueue';

/**
 * InterviewContent component. Shows all Interview entity fields and allows saving.
 * Props:
 * - applicationId: id of the parent application (optional)
 * - interview: existing interview object (optional)
 */
export default function InterviewContent({ applicationId, interview }) {
  const [interviewerName, setInterviewerName] = useState((interview && interview.interviewerName) || '');
  const [interviewerPosition, setInterviewerPosition] = useState((interview && interview.interviewerPosition) || '');
  const [interviewDate, setInterviewDate] = useState((interview && interview.interviewDate) || '');
  const [interviewTime, setInterviewTime] = useState((interview && interview.interviewTime) || '');
  const [interviewerEmail, setInterviewerEmail] = useState((interview && interview.interviewerEmail) || '');
  const [interviewerPhone, setInterviewerPhone] = useState((interview && interview.interviewerPhone) || '');
  const [interviewNotes, setInterviewNotes] = useState((interview && interview.interviewNotes) || '');

  useEffect(() => {
    setMenuItems([
      ['Done', handleDone],
      ['Cancel', handleCancel],
      ['Delete', handleDelete]
    ]);
    return () => setMenuItems([]);
  }, []);

  async function handleDone() {
    try {
      const it = Object.assign({}, interview || {});
      if (!it.id) it.id = -Date.now();
      it.applicationId = applicationId || (interview && interview.applicationId) || null;
      it.interviewerName = interviewerName;
      it.interviewerPosition = interviewerPosition;
      it.interviewDate = interviewDate;
      it.interviewTime = interviewTime;
      it.interviewerEmail = interviewerEmail;
      it.interviewerPhone = interviewerPhone;
      it.interviewNotes = interviewNotes;

      await InterviewsStore.put(it);
      await enqueueSync({ operationType: 'upsert', entityType: 'interview', entityId: it.id, timestamp: Date.now() });

      // after saving, return to parent application content
      const { default: ApplicationContent } = await import('./ApplicationContent');
      setContent(<ApplicationContent application={ { id: it.applicationId } } />);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to save interview', err);
    }
  }

  function handleCancel() {
    // go back to application content
    import('./ApplicationContent').then((m) => {
      const Comp = m.default;
      if (Comp) setContent(<Comp application={ { id: applicationId } } />);
    }).catch((err) => console.error(err));
  }

  function handleDelete() {
    // stub: delete interview from indexeddb and enqueue delete
    // not implemented yet
    console.log('Delete interview');
  }

  return (
    <div>
      <h2>Interview</h2>
      <label>
        Interviewer Name
        <input value={interviewerName} onChange={e => setInterviewerName(e.target.value)} />
      </label>
      <br />
      <label>
        Interviewer Position
        <input value={interviewerPosition} onChange={e => setInterviewerPosition(e.target.value)} />
      </label>
      <br />
      <label>
        Interview Date
        <input value={interviewDate} onChange={e => setInterviewDate(e.target.value)} placeholder="YYYY-MM-DDTHH:MM:SS.sssZ" />
      </label>
      <br />
      <label>
        Interview Time
        <input value={interviewTime} onChange={e => setInterviewTime(e.target.value)} />
      </label>
      <br />
      <label>
        Interviewer Email
        <input value={interviewerEmail} onChange={e => setInterviewerEmail(e.target.value)} />
      </label>
      <br />
      <label>
        Interviewer Phone
        <input value={interviewerPhone} onChange={e => setInterviewerPhone(e.target.value)} />
      </label>
      <br />
      <label>
        Interview Notes
        <textarea value={interviewNotes} onChange={e => setInterviewNotes(e.target.value)} rows={3} />
      </label>
    </div>
  );
}
