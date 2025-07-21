import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { Plus, Edit2, X } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend);

interface UtilityEntry {
  id: number;
  type: string;
  month: string;
  consumption: number;
  cost: number;
  notes: string;
  created_at: string;
}

const ElectricityUtility: React.FC = () => {
  const [entries, setEntries] = useState<UtilityEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState({
    id: undefined as number | undefined,
    month: '',
    consumption: '',
    cost: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('utilities_consumption')
      .select('*')
      .eq('type', 'electricity')
      .order('month', { ascending: true });
    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setForm({ id: undefined, month: '', consumption: '', cost: '', notes: '' });
    setModalType('add');
    setModalOpen(true);
  };

  const openEditModal = (entry: UtilityEntry) => {
    setForm({
      id: entry.id,
      month: entry.month.slice(0, 7),
      consumption: entry.consumption.toString(),
      cost: entry.cost?.toString() || '',
      notes: entry.notes || '',
    });
    setModalType('edit');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.month || !form.consumption) return;
    setLoading(true);
    if (modalType === 'add') {
      const { error } = await supabase.from('utilities_consumption').insert([
        {
          type: 'electricity',
          month: form.month + '-01',
          consumption: parseFloat(form.consumption),
          cost: form.cost ? parseFloat(form.cost) : null,
          notes: form.notes || null,
        },
      ]);
      if (!error) {
        setForm({ id: undefined, month: '', consumption: '', cost: '', notes: '' });
        setModalOpen(false);
        fetchEntries();
      }
    } else if (modalType === 'edit' && form.id) {
      const { error } = await supabase.from('utilities_consumption')
        .update({
          month: form.month + '-01',
          consumption: parseFloat(form.consumption),
          cost: form.cost ? parseFloat(form.cost) : null,
          notes: form.notes || null,
        })
        .eq('id', form.id);
      if (!error) {
        setForm({ id: undefined, month: '', consumption: '', cost: '', notes: '' });
        setModalOpen(false);
        fetchEntries();
      }
    }
    setLoading(false);
  };

  const chartData = {
    labels: entries.map(e => e.month.slice(0, 7)),
    datasets: [
      {
        label: 'Electricity Consumption',
        data: entries.map(e => e.consumption),
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Electricity Utility</h1>
          <p className="text-gray-600">Track and manage electricity consumption</p>
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-yellow-600 transition-colors duration-200"
          onClick={openAddModal}
        >
          <Plus className="w-4 h-4" />
          <span>Add Entry</span>
        </button>
      </div>
      {/* Graph Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold mb-2">Monthly Electricity Consumption Graph</h3>
        <Bar data={chartData} />
      </div>
      {/* Table Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumption</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-500"></div>
                  </div>
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No entries found
                </td>
              </tr>
            ) : (
              entries.map((e, idx) => (
                <tr key={e.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                  <td className="px-6 py-4 whitespace-nowrap">{e.month.slice(0, 7)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{e.consumption}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{e.cost ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{e.notes ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      className="text-yellow-600 hover:text-yellow-800"
                      onClick={() => openEditModal(e)}
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal for Add/Edit Entry */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalType === 'add' ? 'Add Electricity Entry' : 'Edit Electricity Entry'}
                </h2>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setModalOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block mb-1">Month</label>
                  <input
                    type="month"
                    name="month"
                    value={form.month}
                    onChange={handleInputChange}
                    className="border rounded px-2 py-1 w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Consumption</label>
                  <input
                    type="number"
                    name="consumption"
                    value={form.consumption}
                    onChange={handleInputChange}
                    className="border rounded px-2 py-1 w-full"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block mb-1">Cost (optional)</label>
                  <input
                    type="number"
                    name="cost"
                    value={form.cost}
                    onChange={handleInputChange}
                    className="border rounded px-2 py-1 w-full"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block mb-1">Notes (optional)</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleInputChange}
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-yellow-500 text-white px-4 py-2 rounded w-full"
                  disabled={loading}
                >
                  {loading ? (modalType === 'add' ? 'Saving...' : 'Updating...') : (modalType === 'add' ? 'Add Entry' : 'Update Entry')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectricityUtility; 