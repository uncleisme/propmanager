import React, { useState, useMemo } from 'react';
import SchedulerProvider, { useScheduler } from './SchedulerContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import '@fullcalendar/common/index.css';
import '@fullcalendar/daygrid/index.css';
import '@fullcalendar/timegrid/index.css';
import { X } from 'lucide-react';

// Color map for job status
const statusColors: Record<string, string> = {
  pending: '#fbbf24', // yellow
  in_progress: '#3b82f6', // blue
  complete: '#10b981', // green
};

// FullCalendar event data
function getEventColor(status: string) {
  return statusColors[status] || '#e5e7eb';
}

const Scheduler: React.FC = () => {
  const { jobs, technicians, assignableContacts, addJob, assignJob, rescheduleJob, loading, error } = useScheduler();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Convert jobs to FullCalendar events
  const events: any[] = useMemo(() =>
    jobs.map(job => {
      const start = `${job.scheduledDate}T${job.scheduledStart}`;
      const end = `${job.scheduledDate}T${job.scheduledEnd}`;
      return {
        id: job.id,
        title: job.title,
        start,
        end,
        backgroundColor: getEventColor(job.status),
        borderColor: getEventColor(job.status),
        extendedProps: {
          job,
          technicians,
        },
      };
    }),
    [jobs, technicians]
  );

  // No resources for now (FullCalendar resource view is a paid feature)

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
  const onEventDrop = async (info: any) => {
    const { event } = info;
    const start = event.start;
    const end = event.end;
    if (!start || !end) return;
    const date = start.toISOString().slice(0, 10);
    const startTime = start.toTimeString().slice(0, 5);
    const endTime = end.toTimeString().slice(0, 5);
    await rescheduleJob(event.id, date, startTime, endTime);
  };

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
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          editable={true}
          droppable={false}
          eventDrop={onEventDrop}
          height={500}
          eventContent={renderEventContent}
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
    </div>
  );
};

// Custom rendering for FullCalendar events
function renderEventContent(arg: any) {
  const job = arg.event.extendedProps.job;
  const technicians = arg.event.extendedProps.technicians;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span>{job.title}</span>
      {job.technicianId && (
        <span style={{ fontSize: 11, color: '#374151', marginLeft: 4 }}>
          ({technicians?.find((t: any) => t.id === job.technicianId)?.name || 'Technician'})
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
}

const SchedulerModule: React.FC = () => (
  <SchedulerProvider>
    <Scheduler />
  </SchedulerProvider>
);

export default SchedulerModule; 