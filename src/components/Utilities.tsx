import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const UTILITY_TYPES = [
  { key: 'water', label: 'Water' },
  { key: 'electricity', label: 'Electricity' },
];

interface UtilityEntry {
  id: number;
  type: string;
  month: string;
  consumption: number;
  cost: number;
  notes: string;
  created_at: string;
}

const Utilities: React.FC = () => {
  const [activeTab, setActiveTab] = useState('water');
  const [entries, setEntries] = useState<UtilityEntry[]>([]);
  const [form, setForm] = useState({
    month: '',
    consumption: '',
    cost: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('utilities_consumption')
      .select('*')
      .eq('type', activeTab)
      .order('month', { ascending: true });
    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.month || !form.consumption) return;
    setLoading(true);
    const { error } = await supabase.from('utilities_consumption').insert([
      {
        type: activeTab,
        month: form.month + '-01', // store as YYYY-MM-01
        consumption: parseFloat(form.consumption),
        cost: form.cost ? parseFloat(form.cost) : null,
        notes: form.notes || null,
      },
    ]);
    if (!error) {
      setForm({ month: '', consumption: '', cost: '', notes: '' });
      fetchEntries();
    }
    setLoading(false);
  };

  // Prepare data for chart
  const chartData = {
    labels: entries.map(e => e.month.slice(0, 7)),
    datasets: [
      {
        label: 'Consumption',
        data: entries.map(e => e.consumption),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Utilities</h2>
      <div className="flex space-x-4 mb-6">
        {UTILITY_TYPES.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <form className="mb-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1">Month</label>
          <input
            type="month"
            name="month"
            value={form.month}
            onChange={handleInputChange}
            className="border rounded px-2 py-1 w-48"
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
            className="border rounded px-2 py-1 w-48"
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
            className="border rounded px-2 py-1 w-48"
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
            className="border rounded px-2 py-1 w-64"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Add Entry'}
        </button>
      </form>
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Monthly Consumption Graph</h3>
        <Bar data={chartData} />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Entries</h3>
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Month</th>
              <th className="border px-2 py-1">Consumption</th>
              <th className="border px-2 py-1">Cost</th>
              <th className="border px-2 py-1">Notes</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id}>
                <td className="border px-2 py-1">{e.month.slice(0, 7)}</td>
                <td className="border px-2 py-1">{e.consumption}</td>
                <td className="border px-2 py-1">{e.cost ?? '-'}</td>
                <td className="border px-2 py-1">{e.notes ?? '-'}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-2">No entries yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Utilities; 