import React, { useState, useMemo, useEffect } from 'react';
// import SchedulerProvider, { useScheduler } from './SchedulerContext';
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

// Malaysia public holidays (2024–2025, sample major holidays)
const MALAYSIA_PUBLIC_HOLIDAYS = [
  // 2024
  { date: '2024-01-01', name: 'New Year\'s Day' },
  { date: '2024-02-10', name: 'Chinese New Year' },
  { date: '2024-02-11', name: 'Chinese New Year (Day 2)' },
  { date: '2024-04-10', name: 'Hari Raya Aidilfitri' },
  { date: '2024-04-11', name: 'Hari Raya Aidilfitri (Day 2)' },
  { date: '2024-05-01', name: 'Labour Day' },
  { date: '2024-05-22', name: 'Wesak Day' },
  { date: '2024-06-03', name: 'Agong\'s Birthday' },
  { date: '2024-06-17', name: 'Hari Raya Haji' },
  { date: '2024-07-07', name: 'Awal Muharram' },
  { date: '2024-08-31', name: 'National Day' },
  { date: '2024-09-16', name: 'Malaysia Day' },
  { date: '2024-10-31', name: 'Deepavali' },
  { date: '2024-12-25', name: 'Christmas Day' },
  // 2025
  { date: '2025-01-01', name: 'New Year\'s Day' },
  { date: '2025-01-29', name: 'Chinese New Year' },
  { date: '2025-01-30', name: 'Chinese New Year (Day 2)' },
  { date: '2025-03-30', name: 'Hari Raya Aidilfitri' },
  { date: '2025-03-31', name: 'Hari Raya Aidilfitri (Day 2)' },
  { date: '2025-05-01', name: 'Labour Day' },
  { date: '2025-05-12', name: 'Wesak Day' },
  { date: '2025-06-02', name: 'Agong\'s Birthday' },
  { date: '2025-06-07', name: 'Hari Raya Haji' },
  { date: '2025-07-27', name: 'Awal Muharram' },
  { date: '2025-08-31', name: 'National Day' },
  { date: '2025-09-16', name: 'Malaysia Day' },
  { date: '2025-10-20', name: 'Deepavali' },
  { date: '2025-12-25', name: 'Christmas Day' },
];

const Scheduler: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: woData, error: woError } = await supabase
      .from('work_order')
      .select('id,type,title,description,status,priority,propertyUnit,scheduledDate,scheduledStart,scheduledEnd,technicianId,createdAt,resolvedAt')
      .order('createdAt', { ascending: false });
    if (!woError && woData) setWorkOrders(woData);
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('id, name');
    setContacts(contactsData || []);
    setLoading(false);
  };
  useEffect(() => {
    fetchData();
  }, []);

  // Convert work orders to FullCalendar events
  const events: any[] = useMemo(() => {
    const workOrderEvents = workOrders
      .filter(wo => wo.scheduledDate)
      .map(wo => {
        const startTime = wo.scheduledStart || '09:00';
        const endTime = wo.scheduledEnd || '10:00';
        const start = `${wo.scheduledDate}T${startTime}`;
        const end = `${wo.scheduledDate}T${endTime}`;
        const isJob = wo.type === 'job';
        return {
          id: wo.id,
          title: wo.title,
          start,
          end,
          backgroundColor: isJob ? '#3b82f6' : '#FACC15',
          borderColor: isJob ? '#1e40af' : '#FACC15',
          textColor: isJob ? '#fff' : '#92400e',
          className: isJob ? 'event-job' : 'event-complaint',
          extendedProps: {
            workOrder: wo,
            contacts,
          },
        };
      });
    const holidayEvents = MALAYSIA_PUBLIC_HOLIDAYS.map(h => ({
      id: `holiday-${h.date}`,
      title: `Public Holiday: ${h.name}`,
      start: h.date,
      end: h.date,
      allDay: true,
      backgroundColor: '#ff5252', // vibrant red
      borderColor: '#b91c1c',
      textColor: '#000', // black for better contrast
      color: '#000', // force black font
      className: 'event-holiday',
      editable: false,
      display: 'background',
    }));
    return [...workOrderEvents, ...holidayEvents];
  }, [workOrders, contacts]);

  // No resources for now (FullCalendar resource view is a paid feature)

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('work_order').insert([
      {
        type: 'job',
        title,
        description,
        scheduledDate,
        scheduledStart,
        scheduledEnd,
        technicianId: selectedTech || null,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ]);
    if (error) setError(error.message);
    setTitle('');
    setDescription('');
    setScheduledDate('');
    setScheduledStart('');
    setScheduledEnd('');
    setSelectedTech('');
    setShowModal(false);
    await fetchData();
    setLoading(false);
  };

  // Drag-and-drop rescheduling
  const onEventDrop = async (info: any) => {
    const { event } = info;
    const start = event.start;
    const end = event.end;
    if (!start || !end) return;
    const workOrderId = event.id;
    const newDate = start.toISOString().slice(0, 10);
    const newStart = start.toTimeString().slice(0, 5);
    const newEnd = end.toTimeString().slice(0, 5);
    await supabase.from('work_order').update({ scheduledDate: newDate, scheduledStart: newStart, scheduledEnd: newEnd }).eq('id', workOrderId);
    await fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Scheduler</h1>
          <p className="text-gray-600">Monitor and manage all jobs and complaints</p>
        </div>
        <div className="flex items-center space-x-3"></div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="bg-white p-4 rounded shadow w-full overflow-x-auto">
          <div className="w-[600px] sm:w-auto p-2">
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
          {/* Add legend for public holidays */}
          <div className="flex flex-wrap gap-4 mt-6 text-xs border-t pt-4 bg-gray-50 rounded-b-lg">
            <div className="flex items-center gap-1"><Wrench className="w-3 h-3 text-blue-500" /><span style={{ background: '#3b82f6', width: 16, height: 16, borderRadius: 3, display: 'inline-block' }}></span> <span className="font-medium text-gray-700">Job</span></div>
            <div className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-500" /><span style={{ background: '#FACC15', width: 16, height: 16, borderRadius: 3, display: 'inline-block' }}></span> <span className="font-medium text-gray-700">Complaint</span></div>
            <div className="flex items-center gap-1"><span style={{ background: '#ff5252', width: 16, height: 16, borderRadius: 3, display: 'inline-block', border: '1px solid #b91c1c' }}></span> <span className="font-medium text-gray-700">Public Holiday</span></div>
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
        .event-holiday, .fc-event.event-holiday {
          background-color: #ff5252 !important;
          border-color: #b91c1c !important;
          color: #000 !important;
        }
        .event-holiday *, .fc-event.event-holiday * {
          color: #000 !important;
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
  const wo = arg.event.extendedProps.workOrder;
  const contacts = arg.event.extendedProps.contacts;
  if (!wo) {
    // Public holiday or other background event
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#64748b', fontWeight: 600 }}>{arg.event.title}</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {wo.type === 'complaint' && (
        <span style={{ color: '#eab308', marginRight: 4 }}>
          <AlertTriangle size={14} />
        </span>
      )}
      {wo.type === 'job' && (
        <span style={{ color: '#3b82f6', marginRight: 4 }}>
          <Wrench size={14} />
        </span>
      )}
      <span>{wo.title}</span>
      {wo.technicianId && (
        <span style={{ fontSize: 11, color: '#374151', marginLeft: 4 }}>
          ({contacts?.find((c: any) => c.id === wo.technicianId)?.name || 'Technician'})
        </span>
      )}
      {wo.type === 'complaint' && (
        <span style={{ marginLeft: 'auto', fontSize: 10, background: '#fff', color: '#FACC15', borderRadius: 8, padding: '0 6px', border: '1px solid #FACC15' }}>
          Complaint
        </span>
      )}
    </div>
  );
}

export default Scheduler; 