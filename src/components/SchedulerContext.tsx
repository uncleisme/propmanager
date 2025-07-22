import React, { createContext, useContext, useState, useCallback } from 'react';
import { SchedulerContextType, Job, Technician } from '../types';
import { Contact } from '../types';
import { supabase } from '../utils/supabaseClient';

const SchedulerContext = createContext<SchedulerContextType | undefined>(undefined);

const SchedulerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assignableContacts, setAssignableContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: techs, error: techErr } = await supabase.from('technicians').select('*');
      const { data: jobsData, error: jobsErr } = await supabase.from('jobs').select('*');
      const { data: contactsData, error: contactsErr } = await supabase
        .from('contacts')
        .select('*')
        .in('type', ['serviceProvider', 'contractor', 'supplier']);
      if (techErr) throw techErr;
      if (jobsErr) throw jobsErr;
      if (contactsErr) throw contactsErr;
      setTechnicians(techs || []);
      setJobs(jobsData || []);
      setAssignableContacts(contactsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  const addJob = useCallback(async (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      // Only send columns that exist in the jobs table
      const jobPayload = {
        title: job.title,
        description: job.description,
        status: 'pending',
        scheduledDate: job.scheduledDate,
        scheduledStart: job.scheduledStart,
        scheduledEnd: job.scheduledEnd,
        technicianId: job.technicianId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const { error: insertErr } = await supabase.from('jobs').insert([jobPayload]);
      if (insertErr) throw insertErr;
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add job');
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  const updateJob = useCallback(async (job: Job) => {
    setLoading(true);
    setError(null);
    try {
      const { error: updateErr } = await supabase.from('jobs').update({ ...job, updatedAt: new Date().toISOString() }).eq('id', job.id);
      if (updateErr) throw updateErr;
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  const deleteJob = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: delErr } = await supabase.from('jobs').delete().eq('id', id);
      if (delErr) throw delErr;
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  const assignJob = useCallback(async (jobId: string, technicianId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: assignErr } = await supabase.from('jobs').update({ technicianId, status: 'in_progress', updatedAt: new Date().toISOString() }).eq('id', jobId);
      if (assignErr) throw assignErr;
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign job');
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  const rescheduleJob = useCallback(async (jobId: string, date: string, start: string, end: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: resErr } = await supabase.from('jobs').update({ scheduledDate: date, scheduledStart: start, scheduledEnd: end, updatedAt: new Date().toISOString() }).eq('id', jobId);
      if (resErr) throw resErr;
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule job');
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <SchedulerContext.Provider value={{ jobs, technicians, assignableContacts, addJob, updateJob, deleteJob, assignJob, rescheduleJob, fetchAll, loading, error }}>
      {children}
    </SchedulerContext.Provider>
  );
};

export const useScheduler = () => {
  const ctx = useContext(SchedulerContext);
  if (!ctx) throw new Error('useScheduler must be used within SchedulerProvider');
  return ctx;
};

export default SchedulerProvider; 