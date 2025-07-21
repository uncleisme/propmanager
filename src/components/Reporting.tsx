import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../utils/supabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const categories = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'licenses', label: 'Licenses' },
  { key: 'complaints', label: 'Complaints' },
  { key: 'packages', label: 'Packages' },
  { key: 'guests', label: 'Guests' },
  { key: 'moveRequests', label: 'Move Requests' },
  { key: 'utilities', label: 'Utilities' },
];

const columnsMap: Record<string, { key: string; label: string }[]> = {
  contacts: [
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'type', label: 'Type' },
    { key: 'notes', label: 'Notes' },
  ],
  contracts: [
    { key: 'title', label: 'Title' },
    { key: 'contactId', label: 'Contact ID' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'value', label: 'Value' },
    { key: 'status', label: 'Status' },
    { key: 'description', label: 'Description' },
  ],
  licenses: [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'issuer', label: 'Issuer' },
    { key: 'issueDate', label: 'Issue Date' },
    { key: 'expirationDate', label: 'Expiration Date' },
    { key: 'licenseNumber', label: 'License Number' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Notes' },
  ],
  complaints: [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'propertyUnit', label: 'Property Unit' },
    { key: 'createdAt', label: 'Created At' },
  ],
  packages: [
    { key: 'trackingNumber', label: 'Tracking Number' },
    { key: 'recipientName', label: 'Recipient' },
    { key: 'sender', label: 'Sender' },
    { key: 'deliveryDate', label: 'Delivery Date' },
    { key: 'status', label: 'Status' },
    { key: 'location', label: 'Location' },
    { key: 'notes', label: 'Notes' },
  ],
  guests: [
    { key: 'visitorName', label: 'Visitor' },
    { key: 'hostName', label: 'Host' },
    { key: 'visitDate', label: 'Visit Date' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Notes' },
  ],
  moveRequests: [
    { key: 'requestType', label: 'Type' },
    { key: 'residentName', label: 'Resident' },
    { key: 'unitNumber', label: 'Unit' },
    { key: 'requestedDate', label: 'Requested Date' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Notes' },
  ],
  utilities: [
    { key: 'type', label: 'Type' },
    { key: 'month', label: 'Month' },
    { key: 'consumption', label: 'Consumption' },
    { key: 'cost', label: 'Cost' },
    { key: 'notes', label: 'Notes' },
  ],
};

const tableMap: Record<string, string> = {
  contacts: 'contacts',
  contracts: 'contracts',
  licenses: 'licenses',
  complaints: 'complaints',
  packages: 'packages',
  guests: 'guests',
  moveRequests: 'moveRequests',
  utilities: 'utilities_consumption',
};

const Reporting: React.FC<{ user?: any }> = () => {
  const [activeTab, setActiveTab] = useState(categories[0].key);
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const table = tableMap[activeTab];
      const { data } = await supabase.from(table).select('*');
      setData(data || []);
      setSelected(new Set());
      setSelectAll(false);
      setLoading(false);
    };
    fetchData();
  }, [activeTab]);

  const columns = columnsMap[activeTab];
  const filteredData = data.filter(row =>
    columns.some(col =>
      (row[col.key] || '').toString().toLowerCase().includes(search.toLowerCase())
    )
  );
  // Sorting
  const sortedData = sort
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sort.key] ?? '';
        const bVal = b[sort.key] ?? '';
        if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredData;

  // Selection
  const handleSelectRow = (idx: number) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) newSet.delete(idx);
      else newSet.add(idx);
      return newSet;
    });
  };
  const handleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(sortedData.map((_, i) => i)));
      setSelectAll(true);
    }
  };
  const selectedRows = sortedData.filter((_, i) => selected.has(i));
  const exportRows = selected.size > 0 ? selectedRows : sortedData;

  // Export functions
  const handleExportExcel = () => {
    const exportData = exportRows.map(row => {
      const out: Record<string, any> = {};
      columns.forEach(col => {
        out[col.label] = row[col.key];
      });
      return out;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `${activeTab}_report.xlsx`);
  };
  const handleExportCSV = () => {
    const exportData = exportRows.map(row => {
      const out: Record<string, any> = {};
      columns.forEach(col => {
        out[col.label] = row[col.key];
      });
      return out;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [columns.map(col => col.label)],
      body: exportRows.map(row => columns.map(col => row[col.key]?.toString() || '')),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save(`${activeTab}_report.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reporting</h1>
        <p className="text-gray-600">Generate and export reports for all data</p>
      </div>
      <div className="flex flex-wrap gap-2 sm:space-x-4">
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-base ${activeTab === cat.key ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-2 justify-between items-center">
        <input
          type="text"
          placeholder="Search..."
          className="border rounded px-2 py-1 w-full sm:w-64 text-xs sm:text-base"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-base"
            onClick={handleExportExcel}
          >
            Export Excel
          </button>
          <button
            className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-base"
            onClick={handleExportCSV}
          >
            Export CSV
          </button>
          <button
            className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-base"
            onClick={handleExportPDF}
          >
            Export PDF
          </button>
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{categories.find(c => c.key === activeTab)?.label} Data</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-xs sm:text-sm border">
            <thead>
              <tr>
                <th className="border px-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className="border px-2 py-1 cursor-pointer select-none hover:bg-gray-100"
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="flex items-center">
                      {col.label}
                      {sort?.key === col.key && (
                        <span className="ml-1">
                          {sort.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => handleSelectRow(i)}
                    />
                  </td>
                  {columns.map(col => (
                    <td key={col.key} className="border px-2 py-1 whitespace-nowrap max-w-[120px] overflow-x-auto">{row[col.key]?.toString() || ''}</td>
                  ))}
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-2">No data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default Reporting; 