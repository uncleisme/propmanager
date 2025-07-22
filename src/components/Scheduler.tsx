import React, { useState, useMemo } from 'react';
import SchedulerProvider, { useScheduler } from './SchedulerContext';
import { Calendar, dateFnsLocalizer, Event as RBCEvent } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { Tooltip } from 'react-tooltip';
import { X } from 'lucide-react';

const locales = {
  'en-US': enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Color map for job status
const statusColors: Record<string, string> = {
  pending: '#fbbf24', // yellow
  in_progress: '#3b82f6', // blue
  complete: '#10b981', // green
};

// Custom event component for calendar
const CalendarEvent: React.FC<{ event: any }> = ({ event }) => {
  const job = event.job;
  const tooltipContent = `
    <div style='min-width:180px;'>
      <div><b>${job.title}</b></div>
      <div style='font-size:12px;'>${job.description || ''}</div>
      <div style='font-size:12px;margin-top:4px;'><b>Time:</b> ${job.scheduledDate} ${job.scheduledStart}-${job.scheduledEnd}</div>
      ${job.technicianId ? `<div style='font-size:12px;'><b>Technician:</b> ${event.technicians?.find((t: any) => t.id === job.technicianId)?.name || 'Technician'}</div>` : ''}
      <div style='font-size:12px;'><b>Status:</b> ${job.status.replace('_', ' ')}</div>
    </div>
  `;
  return (
    <div
      style={{
        background: statusColors[job.status] || '#e5e7eb',
        color: '#111827',
        borderRadius: 4,
        padding: '2px 6px',
        fontWeight: 500,
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        cursor: 'pointer',
      }}
      data-tooltip-id="job-tooltip"
      data-tooltip-html={tooltipContent}
    >
      <span>{job.title}</span>
      {job.technicianId && (
        <span style={{ fontSize: 11, color: '#374151', marginLeft: 4 }}>
          ({event.technicians?.find((t: any) => t.id === job.technicianId)?.name || 'Technician'})
        </span>
      )}
      <span
        style={{
          marginLeft: 'auto',
          fontSize: 10,
          background: '#fff',
          color: statusColors[job.status] || '#6b7280',
          borderRadius: 8,
          padding: '0 6px',
          border: `1px solid ${statusColors[job.status] || '#d1d5db'}`,
        }}
      >
        {job.status.replace('_', ' ')}
      </span>
    </div>
  );
};

const Scheduler: React.FC = () => {
  const { jobs, technicians, assignableContacts, addJob, assignJob, rescheduleJob, loading, error } = useScheduler();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Convert jobs to calendar events
  const events: any[] = useMemo(() =>
    jobs.map(job => {
      const start = new Date(`${job.scheduledDate}T${job.scheduledStart}`);
      const end = new Date(`${job.scheduledDate}T${job.scheduledEnd}`);
      return {
        id: job.id,
        title: job.title,
        start,
        end,
        resourceId: job.technicianId || 'unassigned',
        allDay: false,
        job,
        technicians,
      };
    }),
    [jobs, technicians]
  );

  // Technicians as resources
  const resources: any[] = useMemo(() => [
    ...technicians.map(t => ({ resourceId: t.id, resourceTitle: t.name })),
    { resourceId: 'unassigned', resourceTitle: 'Unassigned' },
  ], [technicians]);

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    await addJob({
      title,
      description,
      scheduledDate,
      scheduledStart,
      scheduledEnd,
      technicianId: selectedTech || undefined,
      status: 'pending',
    });
    setTitle('');
    setDescription('');
    setScheduledDate('');
    setScheduledStart('');
    setScheduledEnd('');
    setSelectedTech('');
    setShowModal(false);
  };

  // Drag-and-drop rescheduling
  const onEventDrop = async ({ event, start, end, resourceId }: any) => {
    const date = format(start, 'yyyy-MM-dd');
    const startTime = format(start, 'HH:mm');
    const endTime = format(end, 'HH:mm');
    await rescheduleJob(event.id, date, startTime, endTime);
    if (resourceId && resourceId !== event.job.technicianId) {
      await assignJob(event.id, resourceId);
    }
  };

  const DragAndDropCalendar = withDragAndDrop(Calendar);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Job Scheduler</h1>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-2"
        onClick={() => setShowModal(true)}
      >
        Add Job
      </button>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add Job</h2>
            <form onSubmit={handleAddJob} className="space-y-2">
              <div>
                <input
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Job Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <textarea
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="border rounded px-2 py-1 flex-1"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  required
                />
                <input
                  type="time"
                  className="border rounded px-2 py-1 flex-1"
                  value={scheduledStart}
                  onChange={e => setScheduledStart(e.target.value)}
                  required
                />
                <input
                  type="time"
                  className="border rounded px-2 py-1 flex-1"
                  value={scheduledEnd}
                  onChange={e => setScheduledEnd(e.target.value)}
                  required
                />
              </div>
              <div>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={selectedTech}
                  onChange={e => setSelectedTech(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {assignableContacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full" disabled={loading}>
                Add Job
              </button>
              {error && <div className="text-red-500 text-sm">{error}</div>}
            </form>
          </div>
        </div>
      )}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Calendar</h2>
        {/* @ts-expect-error react-big-calendar typing issue */}
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          startAccessor={(event: any) => event.start}
          endAccessor={(event: any) => event.end}
          style={{ height: 500 }}
          resources={resources}
          resourceIdAccessor={(resource: any) => resource.resourceId}
          resourceTitleAccessor={(resource: any) => resource.resourceTitle}
          onEventDrop={onEventDrop}
          draggableAccessor={() => true}
          resizable
          components={{ event: CalendarEvent }}
        />
      </div>
      <div className="flex gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1"><span style={{ background: statusColors['pending'], width: 14, height: 14, borderRadius: 3, display: 'inline-block' }}></span> Pending</div>
        <div className="flex items-center gap-1"><span style={{ background: statusColors['in_progress'], width: 14, height: 14, borderRadius: 3, display: 'inline-block' }}></span> In Progress</div>
        <div className="flex items-center gap-1"><span style={{ background: statusColors['complete'], width: 14, height: 14, borderRadius: 3, display: 'inline-block' }}></span> Complete</div>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Jobs</h2>
        <ul className="divide-y">
          {jobs.map(job => (
            <li key={job.id} className="py-2">
              <div className="font-medium">{job.title}</div>
              <div className="text-sm text-gray-600">{job.description}</div>
              <div className="text-xs text-gray-500">
                {job.scheduledDate} {job.scheduledStart}-{job.scheduledEnd}
                {job.technicianId && (
                  <span> • Assigned to {technicians.find(t => t.id === job.technicianId)?.name}</span>
                )}
              </div>
              <div className="text-xs">Status: {job.status}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Technicians</h2>
        <ul className="divide-y">
          {technicians.map(t => (
            <li key={t.id} className="py-2">
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-gray-500">{t.email} | {t.phone}</div>
              <div className="text-xs">Skills: {(t.skills || []).join(', ')}</div>
            </li>
          ))}
        </ul>
      </div>
      <Tooltip id="job-tooltip" place="top" />
    </div>
  );
};

const SchedulerModule: React.FC = () => (
  <SchedulerProvider>
    <Scheduler />
  </SchedulerProvider>
);

export default SchedulerModule; 