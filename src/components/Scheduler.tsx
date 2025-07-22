import React, { useState, useMemo, useEffect } from 'react';
import SchedulerProvider, { useScheduler } from './SchedulerContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { X, AlertTriangle, Wrench } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

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

interface ComplaintCard {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  propertyUnit?: string;
  createdAt: string;
  scheduledDate?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  technicianId?: string;
}

// Pagination helper
function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

const Scheduler: React.FC = () => {
  const { jobs, assignableContacts, addJob, assignJob, rescheduleJob, loading, error } = useScheduler();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [complaints, setComplaints] = useState<ComplaintCard[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsPage, setComplaintsPage] = useState(1);
  const [jobsPage, setJobsPage] = useState(1);
  const pageSize = 4;

  const fetchComplaints = async () => {
    setComplaintsLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('createdAt', { ascending: false });
    if (!error && data) setComplaints(data);
    setComplaintsLoading(false);
  };
  useEffect(() => {
    fetchComplaints();
  }, []);

  // Convert jobs and complaints to FullCalendar events
  const events: any[] = useMemo(() => {
    // Map of complaintId to job for quick lookup
    const jobByComplaint: Record<string, any> = {};
    jobs.forEach(job => {
      if (job.complaintId) jobByComplaint[job.complaintId] = job;
    });
    // Job events
    const jobEvents = jobs.map(job => {
      const start = `${job.scheduledDate}T${job.scheduledStart}`;
      const end = `${job.scheduledDate}T${job.scheduledEnd}`;
      return {
        id: job.id,
        title: job.title,
        start,
        end,
        backgroundColor: '#3b82f6', // single blue for all jobs
        borderColor: '#1e40af',
        textColor: '#fff',
        className: 'event-job',
        extendedProps: {
          job,
          assignableContacts,
        },
      };
    });
    // Complaint events (only those without a job)
    const complaintEvents = complaints
      .filter(c => !jobByComplaint[c.id] && c.scheduledDate)
      .map(c => {
        // Use scheduledStart and scheduledEnd if available, else default to 09:00 and 10:00
        const startTime = c.scheduledStart || '09:00';
        const endTime = c.scheduledEnd || '10:00';
        const start = `${c.scheduledDate}T${startTime}`;
        const end = `${c.scheduledDate}T${endTime}`;
        return {
          id: `complaint-${c.id}`,
          title: `Complaint: ${c.title}`,
          start,
          end,
          allDay: false,
          backgroundColor: '#FACC15', // yellow
          borderColor: '#FACC15',
          textColor: '#92400e', // yellow-900
          className: 'event-complaint',
          extendedProps: {
            complaint: c,
          },
        };
      });
    return [...jobEvents, ...complaintEvents];
  }, [jobs, assignableContacts, complaints]);

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
    // If this is a job event, reschedule the job
    if (event.extendedProps.job) {
      const date = start.toISOString().slice(0, 10);
      const startTime = start.toTimeString().slice(0, 5);
      const endTime = end.toTimeString().slice(0, 5);
      await rescheduleJob(event.id, date, startTime, endTime);
    } else if (event.extendedProps.complaint) {
      // If this is a complaint event, update the complaint's scheduledDate, scheduledStart, and scheduledEnd
      const complaintId = event.extendedProps.complaint.id;
      const newDate = start.toISOString().slice(0, 10);
      const newStart = start.toTimeString().slice(0, 5);
      const newEnd = end.toTimeString().slice(0, 5);
      await supabase.from('complaints').update({ scheduledDate: newDate, scheduledStart: newStart, scheduledEnd: newEnd }).eq('id', complaintId);
      // Refresh complaints
      await fetchComplaints();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4">
      <h1 className="text-2xl font-bold mb-4">Job Scheduler</h1>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
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
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-col gap-4 flex-1 min-w-[280px]">
          <div className="p-4 rounded-xl shadow" style={{ background: '#e0edfa', border: '1px solid #60a5fa' }}>
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-5 h-5 text-blue-700" />
              <h2 className="text-lg font-bold text-blue-900 tracking-wide">Jobs</h2>
            </div>
            <ul className="divide-y">
              {paginate(jobs, jobsPage, pageSize).map(job => (
                <li key={job.id} className="py-2 px-2 rounded-lg hover:bg-blue-50 transition flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-blue-900">{job.title}</span>
                    {job.complaintId && (
                      <span title="Linked to complaint" className="ml-1 text-yellow-500"><AlertTriangle size={14} /></span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center text-xs mt-1">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{job.scheduledDate} {job.scheduledStart}-{job.scheduledEnd}</span>
                    {job.technicianId && (
                      <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">Assigned: {assignableContacts.find(c => c.id === job.technicianId)?.name}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center mt-2">
              <button
                className="px-2 py-1 rounded bg-blue-200 text-blue-900 disabled:opacity-50"
                onClick={() => setJobsPage(p => Math.max(1, p - 1))}
                disabled={jobsPage === 1}
              >Prev</button>
              <span className="text-xs">Page {jobsPage} of {Math.ceil(jobs.length / pageSize) || 1}</span>
              <button
                className="px-2 py-1 rounded bg-blue-200 text-blue-900 disabled:opacity-50"
                onClick={() => setJobsPage(p => (p * pageSize < jobs.length ? p + 1 : p))}
                disabled={jobsPage * pageSize >= jobs.length}
              >Next</button>
            </div>
          </div>
          <div className="p-4 rounded-xl shadow" style={{ background: '#FEF9C3', border: '1px solid #FACC15' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-bold text-yellow-900 tracking-wide">Complaints</h2>
            </div>
            {complaintsLoading ? (
              <div className="text-gray-500 text-sm">Loading complaints...</div>
            ) : (
              <ul className="divide-y">
                {paginate(complaints, complaintsPage, pageSize).map(complaint => (
                  <li key={complaint.id} className="py-2 px-2 rounded-lg hover:bg-yellow-50 transition flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-yellow-900">{complaint.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-xs mt-1">
                      {complaint.propertyUnit && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Unit: {complaint.propertyUnit}</span>}
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Scheduled: {complaint.scheduledDate} {complaint.scheduledStart}-{complaint.scheduledEnd}</span>
                      {complaint.technicianId && (
                        <span className="bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded-full">Assigned: {assignableContacts.find(c => c.id === complaint.technicianId)?.name}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-between items-center mt-2">
              <button
                className="px-2 py-1 rounded bg-yellow-200 text-yellow-900 disabled:opacity-50"
                onClick={() => setComplaintsPage(p => Math.max(1, p - 1))}
                disabled={complaintsPage === 1}
              >Prev</button>
              <span className="text-xs">Page {complaintsPage} of {Math.ceil(complaints.length / pageSize) || 1}</span>
              <button
                className="px-2 py-1 rounded bg-yellow-200 text-yellow-900 disabled:opacity-50"
                onClick={() => setComplaintsPage(p => (p * pageSize < complaints.length ? p + 1 : p))}
                disabled={complaintsPage * pageSize >= complaints.length}
              >Next</button>
            </div>
          </div>
        </div>
        <div className="bg-white p-2 sm:p-4 rounded shadow flex-[2] min-w-[280px] overflow-x-auto">
  
          <div className="w-[600px] sm:w-auto">
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
          <div className="flex flex-wrap gap-2 mt-4 text-xs border-t pt-2">
            <div className="flex items-center gap-1"><Wrench className="w-3 h-3 text-blue-500" /><span style={{ background: '#3b82f6', width: 14, height: 14, borderRadius: 3, display: 'inline-block' }}></span> Job</div>
            <div className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-500" /><span style={{ background: '#FACC15', width: 14, height: 14, borderRadius: 3, display: 'inline-block' }}></span> Complaint</div>
          </div>
        </div>
      </div>
      {/* Custom event color styles for FullCalendar */}
      <style>{`
        .event-job, .fc-event.event-job {
          background-color: #3b82f6 !important;
          border-color: #1e40af !important;
          color: #fff !important;
        }
        .event-complaint, .fc-event.event-complaint {
          background-color: #fde047 !important;
          border-color: #facc15 !important;
          color: #92400e !important;
        }
        .fc-daygrid-event-dot {
          border-color: #3b82f6 !important;
        }
        .fc-daygrid-event.event-complaint .fc-daygrid-event-dot {
          border-color: #facc15 !important;
        }
        @media (max-width: 640px) {
          .fc .fc-toolbar-title { font-size: 1rem; }
          .fc .fc-toolbar { flex-wrap: wrap; }
          .fc .fc-header-toolbar { padding: 0.25rem 0; }
          .fc .fc-daygrid-day-number { font-size: 0.9rem; }
          .fc .fc-daygrid-event, .fc .fc-timegrid-event { font-size: 0.85rem; }
          .fc .fc-scrollgrid-sync-table { min-width: 600px; }
        }
      `}</style>
    </div>
  );
};

// Custom rendering for FullCalendar events
function renderEventContent(arg: any) {
  if (arg.event.extendedProps.job) {
    const job = arg.event.extendedProps.job;
    const contacts = arg.event.extendedProps.assignableContacts;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {job.complaintId && (
          <span title="Linked to complaint" style={{ color: '#eab308', marginRight: 4 }}>
            <AlertTriangle size={14} />
          </span>
        )}
        <span>{job.title}</span>
        {job.technicianId && (
          <span style={{ fontSize: 11, color: '#374151', marginLeft: 4 }}>
            ({contacts?.find((c: any) => c.id === job.technicianId)?.name || 'Technician'})
          </span>
        )}
      </div>
    );
  } else if (arg.event.extendedProps.complaint) {
    const complaint = arg.event.extendedProps.complaint;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#eab308', marginRight: 4 }}>
          <AlertTriangle size={14} />
        </span>
        <span>{complaint.title}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, background: '#fff', color: '#FACC15', borderRadius: 8, padding: '0 6px', border: '1px solid #FACC15' }}>
          Complaint
        </span>
      </div>
    );
  }
  return null;
}

const SchedulerModule: React.FC = () => (
  <SchedulerProvider>
    <Scheduler />
  </SchedulerProvider>
);

export default SchedulerModule; 