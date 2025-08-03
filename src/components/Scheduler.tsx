import React, { useState, useMemo, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { X, AlertTriangle, Wrench, Settings, Calendar, Clock, MapPin, User, Filter } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

// Enhanced color map for different event types and statuses
const statusColors: Record<string, string> = {
  // Work Order Status Colors
  open: '#f59e0b', // amber
  in_progress: '#3b82f6', // blue
  completed: '#10b981', // green
  cancelled: '#ef4444', // red
  
  // Maintenance Task Status Colors
  scheduled: '#8b5cf6', // purple
  overdue: '#dc2626', // red
  
  // Default colors
  pending: '#fbbf24', // yellow
  complete: '#10b981', // green
};

// Event type colors
const eventTypeColors = {
  job: '#3b82f6',
  complaint: '#f59e0b', 
  preventive_maintenance: '#8b5cf6',
  maintenance_task: '#06b6d4',
  holiday: '#ef4444'
};



interface WorkOrder {
  id: string;
  type: 'job' | 'complaint' | 'preventive_maintenance';
  title: string;
  description: string;
  status: string;
  priority: string;
  propertyUnit?: string;
  scheduledDate?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  assignedTo?: string;
  technicianId?: string;
  maintenanceTaskId?: number;
  createdAt: string;
  resolvedAt?: string;
  comment?: string;
}

interface MaintenanceTask {
  id: number;
  taskNumber: string;
  title: string;
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  assignedTo?: string;
  assetName?: string;
  locationBuilding?: string;
  locationFloor?: string;
  locationRoom?: string;
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  classNames: string[];
  extendedProps: {
    type: 'work_order' | 'maintenance_task' | 'holiday';
    workOrder?: WorkOrder;
    maintenanceTask?: MaintenanceTask;
    contacts?: any[];
    status?: string;
    priority?: string;
    location?: string;
  };
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
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; full_name: string | null; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [viewType, setViewType] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth');
  const [filterType, setFilterType] = useState<'all' | 'work_orders' | 'maintenance_tasks' | 'holidays'>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch work orders
      const { data: woData, error: woError } = await supabase
        .from('work_order')
        .select('id,type,title,description,status,priority,propertyUnit,scheduledDate,scheduledStart,scheduledEnd,assignedTo,technicianId,maintenanceTaskId,createdAt,resolvedAt,comment')
        .order('createdAt', { ascending: false });
      
      if (woError) {
        console.error('Error fetching work orders:', woError);
      } else {
        setWorkOrders(woData || []);
      }
      
      // Fetch maintenance tasks
      const { data: mtData, error: mtError } = await supabase
        .from('maintenanceTasks')
        .select(`
          id,
          taskNumber,
          title,
          description,
          status,
          priority,
          scheduledDate,
          scheduledStartTime,
          scheduledEndTime,
          assignedTo,
          createdAt,
          maintenanceAssets!inner(
            assetName,
            locationBuilding,
            locationFloor,
            locationRoom
          )
        `)
        .in('status', ['scheduled', 'in_progress', 'overdue'])
        .order('scheduledDate', { ascending: true });
      
      if (mtError) {
        console.error('Error fetching maintenance tasks:', mtError);
      } else {
        // Flatten the data structure
        const flattenedTasks = (mtData || []).map((task: any) => ({
          ...task,
          assetName: task.maintenanceAssets?.assetName,
          locationBuilding: task.maintenanceAssets?.locationBuilding,
          locationFloor: task.maintenanceAssets?.locationFloor,
          locationRoom: task.maintenanceAssets?.locationRoom
        }));
        setMaintenanceTasks(flattenedTasks);
      }
      
      // Fetch contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, name');
      setContacts(contactsData || []);
      
      // Fetch technicians
      const { data: techniciansData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('type', 'technician');
      setTechnicians(techniciansData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // Convert work orders and maintenance tasks to FullCalendar events
  const events: CalendarEvent[] = useMemo(() => {
    const allEvents: CalendarEvent[] = [];
    
    // Work Order Events
    if (filterType === 'all' || filterType === 'work_orders') {
      const workOrderEvents = workOrders
        .filter(wo => wo.scheduledDate)
        .map(wo => {
          const startTime = wo.scheduledStart || '09:00';
          const endTime = wo.scheduledEnd || '10:00';
          const start = `${wo.scheduledDate}T${startTime}`;
          const end = `${wo.scheduledDate}T${endTime}`;
          
          let backgroundColor, borderColor, textColor, className;
          
          switch (wo.type) {
            case 'job':
              backgroundColor = eventTypeColors.job;
              borderColor = '#1e40af';
              textColor = '#fff';
              className = 'event-job';
              break;
            case 'complaint':
              backgroundColor = eventTypeColors.complaint;
              borderColor = '#f59e0b';
              textColor = '#92400e';
              className = 'event-complaint';
              break;
            case 'preventive_maintenance':
              backgroundColor = eventTypeColors.preventive_maintenance;
              borderColor = '#7c3aed';
              textColor = '#fff';
              className = 'event-preventive-maintenance';
              break;
            default:
              backgroundColor = statusColors[wo.status] || '#e5e7eb';
              borderColor = '#9ca3af';
              textColor = '#374151';
              className = 'event-default';
          }
          
          return {
            id: `wo-${wo.id}`,
            title: wo.title,
            start,
            end,
            backgroundColor,
            borderColor,
            textColor,
            classNames: [className],
            extendedProps: {
              type: 'work_order' as const,
              workOrder: wo,
              contacts,
              technicians,
              status: wo.status,
              priority: wo.priority,
              location: wo.propertyUnit
            },
          };
        });
      allEvents.push(...workOrderEvents);
    }
    
    // Maintenance Task Events
    if (filterType === 'all' || filterType === 'maintenance_tasks') {
      const maintenanceTaskEvents = maintenanceTasks
        .filter(mt => mt.scheduledDate)
        .map(mt => {
          const startTime = mt.scheduledStartTime || '09:00';
          const endTime = mt.scheduledEndTime || '10:00';
          const start = `${mt.scheduledDate}T${startTime}`;
          const end = `${mt.scheduledDate}T${endTime}`;
          
          const backgroundColor = statusColors[mt.status] || eventTypeColors.maintenance_task;
          const borderColor = mt.status === 'overdue' ? '#dc2626' : '#0891b2';
          const textColor = '#fff';
          
          const location = [mt.locationBuilding, mt.locationFloor, mt.locationRoom]
            .filter(Boolean)
            .join(' - ');
          
          return {
            id: `mt-${mt.id}`,
            title: `${mt.taskNumber}: ${mt.title}`,
            start,
            end,
            backgroundColor,
            borderColor,
            textColor,
            classNames: ['event-maintenance-task'],
            extendedProps: {
              type: 'maintenance_task' as const,
              maintenanceTask: mt,
              status: mt.status,
              priority: mt.priority,
              location: location || mt.assetName
            },
          };
        });
      allEvents.push(...maintenanceTaskEvents);
    }
    
    // Holiday Events
    if (filterType === 'all' || filterType === 'holidays') {
      const holidayEvents = MALAYSIA_PUBLIC_HOLIDAYS.map(h => ({
        id: `holiday-${h.date}`,
        title: `🏛️ ${h.name}`,
        start: h.date,
        end: h.date,
        backgroundColor: eventTypeColors.holiday,
        borderColor: '#b91c1c',
        textColor: '#000',
        classNames: ['event-holiday'],
        extendedProps: {
          type: 'holiday' as const,
          status: 'holiday',
          priority: 'low'
        },
      }));
      allEvents.push(...holidayEvents);
    }
    
    return allEvents;
  }, [workOrders, maintenanceTasks, contacts, technicians, filterType]);

  // Event click handler
  const handleEventClick = (info: any) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start.toISOString(),
      end: event.end?.toISOString(),
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      textColor: event.textColor,
      classNames: event.classNames,
      extendedProps: event.extendedProps
    });
    setShowEventModal(true);
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
      {/* Header with improved title and controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            Smart Scheduler
          </h1>
          <p className="text-gray-600 mt-1">Unified view of work orders, maintenance tasks, and schedules</p>
        </div>
        
        {/* View and Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Type Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="dayGridMonth">Month</option>
              <option value="timeGridWeek">Week</option>
              <option value="timeGridDay">Day</option>
            </select>
          </div>
          
          {/* Filter Selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Events</option>
              <option value="work_orders">Work Orders</option>
              <option value="maintenance_tasks">Maintenance Tasks</option>
              <option value="holidays">Holidays</option>
            </select>
          </div>
          
          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center gap-2 text-blue-600">
              <Clock className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Work Orders</p>
              <p className="text-2xl font-bold text-gray-900">{workOrders.length}</p>
            </div>
            <Wrench className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Maintenance Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{maintenanceTasks.length}</p>
            </div>
            <Settings className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {maintenanceTasks.filter(mt => mt.status === 'overdue').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Events</p>
              <p className="text-2xl font-bold text-gray-900">
                {events.filter(e => {
                  const today = new Date().toISOString().split('T')[0];
                  return e.start.startsWith(today);
                }).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>
      
      {/* Main Calendar */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={viewType}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            editable={true}
            selectable={true}
            eventClick={handleEventClick}
            eventDrop={onEventDrop}
            height={600}
            eventContent={renderEventContent}
            dayMaxEvents={3}
            moreLinkClick="popover"
            nowIndicator={true}
            weekends={true}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime: '08:00',
              endTime: '18:00'
            }}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={true}
            expandRows={true}
          />
        </div>
        
        {/* Enhanced Legend */}
        <div className="border-t bg-gray-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span className="w-3 h-3 bg-blue-600 rounded"></span>
                <span className="text-sm font-medium text-gray-700">Jobs</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="w-3 h-3 bg-amber-500 rounded"></span>
                <span className="text-sm font-medium text-gray-700">Complaints</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-600" />
                <span className="w-3 h-3 bg-purple-600 rounded"></span>
                <span className="text-sm font-medium text-gray-700">Preventive Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-600" />
                <span className="w-3 h-3 bg-cyan-600 rounded"></span>
                <span className="text-sm font-medium text-gray-700">Maintenance Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🏛️</span>
                <span className="w-3 h-3 bg-red-500 rounded"></span>
                <span className="text-sm font-medium text-gray-700">Public Holidays</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Showing {events.length} events • Click events for details • Drag to reschedule
            </div>
          </div>
        </div>
      </div>
      
      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {selectedEvent.extendedProps.type === 'work_order' && <Wrench className="w-5 h-5" />}
                  {selectedEvent.extendedProps.type === 'maintenance_task' && <Settings className="w-5 h-5" />}
                  {selectedEvent.extendedProps.type === 'holiday' && <span>🏛️</span>}
                  {selectedEvent.title}
                </h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Event Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="text-gray-900 capitalize">
                      {selectedEvent.extendedProps.type?.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedEvent.extendedProps.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedEvent.extendedProps.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      selectedEvent.extendedProps.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedEvent.extendedProps.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Priority</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedEvent.extendedProps.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      selectedEvent.extendedProps.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      selectedEvent.extendedProps.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedEvent.extendedProps.priority}
                    </span>
                  </div>
                  {selectedEvent.extendedProps.location && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Location</label>
                      <p className="text-gray-900 flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        {selectedEvent.extendedProps.location}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Work Order Details */}
                {selectedEvent.extendedProps.workOrder && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Work Order Details</h4>
                    <div className="space-y-2">
                      {selectedEvent.extendedProps.workOrder.description && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Description</label>
                          <p className="text-gray-900">{selectedEvent.extendedProps.workOrder.description}</p>
                        </div>
                      )}
                      {selectedEvent.extendedProps.workOrder.assignedTo && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Assigned To</label>
                          <p className="text-gray-900 flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-500" />
                            {selectedEvent.extendedProps.workOrder.assignedTo}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Maintenance Task Details */}
                {selectedEvent.extendedProps.maintenanceTask && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Maintenance Task Details</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Task Number</label>
                        <p className="text-gray-900 font-mono">{selectedEvent.extendedProps.maintenanceTask.taskNumber}</p>
                      </div>
                      {selectedEvent.extendedProps.maintenanceTask.description && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Description</label>
                          <p className="text-gray-900">{selectedEvent.extendedProps.maintenanceTask.description}</p>
                        </div>
                      )}
                      {selectedEvent.extendedProps.maintenanceTask.assetName && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Asset</label>
                          <p className="text-gray-900">{selectedEvent.extendedProps.maintenanceTask.assetName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Custom Styles for FullCalendar */}
      <style>{`
        .event-job, .fc-event.event-job {
          background-color: #3b82f6 !important;
          border-color: #1e40af !important;
          color: #fff !important;
        }
        .event-complaint, .fc-event.event-complaint {
          background-color: #f59e0b !important;
          border-color: #d97706 !important;
          color: #92400e !important;
        }
        .event-preventive-maintenance, .fc-event.event-preventive-maintenance {
          background-color: #8b5cf6 !important;
          border-color: #7c3aed !important;
          color: #fff !important;
        }
        .event-maintenance-task, .fc-event.event-maintenance-task {
          background-color: #06b6d4 !important;
          border-color: #0891b2 !important;
          color: #fff !important;
        }
        .event-holiday, .fc-event.event-holiday {
          background-color: #ef4444 !important;
          border-color: #dc2626 !important;
          color: #000 !important;
        }
        .fc-event {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .fc-daygrid-event-dot {
          border-color: #3b82f6 !important;
        }
        .fc-daygrid-event.event-complaint .fc-daygrid-event-dot {
          border-color: #f59e0b !important;
        }
        .fc-daygrid-event.event-preventive-maintenance .fc-daygrid-event-dot {
          border-color: #8b5cf6 !important;
        }
        .fc-daygrid-event.event-maintenance-task .fc-daygrid-event-dot {
          border-color: #06b6d4 !important;
        }
        .fc-toolbar-title {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
        }
        .fc-button-primary {
          background-color: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .fc-button-primary:hover {
          background-color: #2563eb !important;
          border-color: #2563eb !important;
        }
        @media (max-width: 640px) {
          .fc .fc-toolbar-title { font-size: 1rem !important; }
          .fc .fc-toolbar { flex-wrap: wrap; gap: 0.5rem; }
          .fc .fc-header-toolbar { padding: 0.5rem 0; }
          .fc .fc-daygrid-day-number { font-size: 0.9rem; }
          .fc .fc-daygrid-event, .fc .fc-timegrid-event { font-size: 0.85rem; }
          .fc .fc-scrollgrid-sync-table { min-width: 600px; }
        }
      `}</style>
    </div>
  );
};

// Enhanced custom rendering for FullCalendar events
function renderEventContent(arg: any) {
  const eventProps = arg.event.extendedProps;
  const eventType = eventProps.type;
  
  // Handle different event types
  if (eventType === 'holiday') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px' }}>
        <span style={{ fontSize: '12px' }}>🏛️</span>
        <span style={{ color: '#000', fontWeight: 500, fontSize: '11px' }}>
          {arg.event.title.replace('🏛️ ', '')}
        </span>
      </div>
    );
  }
  
  if (eventType === 'work_order') {
    const wo = eventProps.workOrder;
    const contacts = eventProps.contacts;
    const technicians = eventProps.technicians;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px' }}>
        {wo.type === 'complaint' && (
          <AlertTriangle size={12} style={{ color: '#f59e0b' }} />
        )}
        {wo.type === 'job' && (
          <Wrench size={12} style={{ color: '#3b82f6' }} />
        )}
        {wo.type === 'preventive_maintenance' && (
          <Settings size={12} style={{ color: '#8b5cf6' }} />
        )}
        
        <span style={{ fontSize: '11px', fontWeight: 500, flex: 1 }}>
          {wo.title}
        </span>
        
        {(wo.assignedTo || wo.technicianId) && (
          <span style={{ fontSize: '9px', color: '#6b7280', marginLeft: 'auto' }}>
            {wo.assignedTo || 
             contacts?.find((c: any) => c.id === wo.technicianId)?.name ||
             technicians?.find((t: any) => t.id === wo.technicianId)?.full_name ||
             'Assigned'}
          </span>
        )}
      </div>
    );
  }
  
  if (eventType === 'maintenance_task') {
    const mt = eventProps.maintenanceTask;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px' }}>
        <Settings size={12} style={{ color: '#06b6d4' }} />
        
        <span style={{ fontSize: '11px', fontWeight: 500, flex: 1 }}>
          {mt.title}
        </span>
        
        {mt.status === 'overdue' && (
          <span style={{ 
            fontSize: '8px', 
            background: '#dc2626', 
            color: '#fff', 
            borderRadius: '4px', 
            padding: '1px 3px',
            fontWeight: 600
          }}>
            OVERDUE
          </span>
        )}
        
        {mt.assignedTo && (
          <span style={{ fontSize: '9px', color: '#6b7280', marginLeft: 'auto' }}>
            {mt.assignedTo}
          </span>
        )}
      </div>
    );
  }
  
  // Fallback for unknown event types
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px' }}>
      <span style={{ fontSize: '11px', fontWeight: 500 }}>{arg.event.title}</span>
    </div>
  );
}

export default Scheduler; 