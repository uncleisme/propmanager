import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../utils/supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { List, Download } from 'lucide-react';
import type { Contact } from '../types';

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
    { key: 'contactId', label: 'Service Provider' },
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

const Reporting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(categories[0].key);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  // Dropdown state for export
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  // Dropdown state for category
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  // Add contacts state for contracts tab
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setCategoryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Fetch contacts if contracts tab is active
  useEffect(() => {
    if (activeTab === 'contracts') {
      supabase.from('contacts').select('*').then(({ data }) => setContacts(data || []));
    }
  }, [activeTab]);

  const columns = columnsMap[activeTab];
  const filteredData = data; // No search
  const sortedData = filteredData; // No sort

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
    const exportData = exportRows.map((row: Record<string, unknown>) => {
      const out: Record<string, unknown> = {};
      columns.forEach(col => {
        if (activeTab === 'contracts' && col.key === 'contactId') {
          out[col.label] = getContactName(row[col.key] as string);
        } else {
          out[col.label] = row[col.key];
        }
      });
      return out;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `${activeTab}_report.xlsx`);
  };
  const handleExportCSV = () => {
    const exportData = exportRows.map((row: Record<string, unknown>) => {
      const out: Record<string, unknown> = {};
      columns.forEach(col => {
        if (activeTab === 'contracts' && col.key === 'contactId') {
          out[col.label] = getContactName(row[col.key] as string);
        } else {
          out[col.label] = row[col.key];
        }
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
    const logoUrl = '/images.png'; // Path in public directory
    const companyName = 'PropManager Sdn Bhd';
    const companyAddress = 'Suite 23-A, Jalan Integra, 50450 Kuala Lumpur, Malaysia';
    const companyPhone = '+60 12-345 6789';
    const companyEmail = 'info@propmanager.com';
    const exportDate = new Date().toLocaleString();
    const addContentAndSave = () => {
      const pageWidth = doc.internal.pageSize.getWidth();
      // Logo
      const logoWidth = 36;
      const logoHeight = 18;
      const logoY = 10;
      const logoX = 14;
      // Vertically center text with logo
      const headerCenterY = logoY + logoHeight / 2 + 2;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, pageWidth / 2, headerCenterY - 3, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(companyAddress, pageWidth / 2, headerCenterY + 5, { align: 'center' });
      doc.text(`${companyPhone} • ${companyEmail}`, pageWidth / 2, headerCenterY + 13, { align: 'center' });
      // Draw line below header
      doc.setDrawColor(180);
      doc.setLineWidth(0.5);
      doc.line(14, 38, pageWidth - 14, 38); // x1, y1, x2, y2
      // Add title further below header, above table
      const title = categories.find(c => c.key === activeTab)?.label || 'Report';
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, pageWidth / 2, 48, { align: 'center' });
      // Table
      autoTable(doc, {
        startY: 56,
        head: [columns.map(col => col.label)],
        body: exportRows.map((row: Record<string, unknown>) => columns.map(col =>
          (activeTab === 'contracts' && col.key === 'contactId')
            ? getContactName(row[col.key] as string)
            : row[col.key]?.toString() || ''
        )),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        didDrawPage: (data) => {
          doc.setFontSize(8);
          // Number of entries below the table (centered)
          const pageCount = (doc as any).internal.getNumberOfPages ? (doc as any).internal.getNumberOfPages() : 1;
          if (data.pageNumber === pageCount && data.cursor) {
            doc.text(`Total: ${exportRows.length} entries`, doc.internal.pageSize.getWidth() / 2, data.cursor.y + 8, { align: 'center' });
          }
          // Draw line above footer
          doc.setDrawColor(180);
          doc.setLineWidth(0.5);
          doc.line(14, doc.internal.pageSize.getHeight() - 16, pageWidth - 14, doc.internal.pageSize.getHeight() - 16);
          // Export date at bottom right
          doc.text(`Exported: ${exportDate}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
          // Copyright centered
          doc.text('Copyright of PropManager 2025', pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
        }
      });
      doc.save(`${activeTab}_report.pdf`);
    };
    // Load logo as image
    const img = new window.Image();
    img.src = logoUrl;
    img.onload = () => {
      try {
        doc.addImage(img, 'JPEG', 14, 10, 36, 18); // x, y, width, height
      } catch {
        // Optionally log error
      }
      addContentAndSave();
    };
    img.onerror = () => {
      addContentAndSave();
    };
  };

  // Helper to export for a specific category
  const handleExport = (type: 'excel' | 'csv' | 'pdf', categoryKey: string) => {
    setExportOpen(false);
    const prevTab = activeTab;
    setActiveTab(categoryKey);
    setTimeout(() => {
      if (type === 'excel') handleExportExcel();
      if (type === 'csv') handleExportCSV();
      if (type === 'pdf') handleExportPDF();
      setActiveTab(prevTab);
    }, 0);
  };

  // Helper to get contact name by id
  const getContactName = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? contact.name : contactId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporting</h1>
          <p className="text-gray-600">Manage all reporting</p>
        </div>
        {/* Category and Export Dropdown Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
          {/* Category Dropdown */}
          <div className="relative w-full sm:w-auto max-w-xs" ref={categoryRef}>
            <button
              className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:bg-blue-800 transition-colors duration-200 space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => setCategoryOpen((open) => !open)}
              aria-haspopup="true"
              aria-expanded={categoryOpen}
              type="button"
            >
              <List className="w-4 h-4" />
              <span className="font-medium">{categories.find(c => c.key === activeTab)?.label || 'Select Category'}</span>
              <svg className={`w-4 h-4 ml-1 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {categoryOpen && (
              <div className="absolute left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fade-in">
                {categories.map(cat => (
                  <button
                    key={cat.key}
                    className={`block w-full text-left px-4 py-2 text-sm rounded hover:bg-blue-50 focus:bg-blue-100 focus:outline-none ${activeTab === cat.key ? 'bg-blue-100' : ''}`}
                    onClick={() => { setActiveTab(cat.key); setCategoryOpen(false); }}
                    type="button"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Export Dropdown */}
          <div className="relative w-full sm:w-auto max-w-xs" ref={exportRef}>
            <button
              className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:bg-blue-800 transition-colors duration-200 space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => setExportOpen((open) => !open)}
              aria-haspopup="true"
              aria-expanded={exportOpen}
              type="button"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">Export</span>
              <svg className={`w-4 h-4 ml-1 transition-transform ${exportOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fade-in">
                <button
                  className="block w-full text-left px-4 py-2 text-sm rounded hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
                  onClick={() => { setExportOpen(false); handleExportExcel(); }}
                  type="button"
                >
                  Export Excel
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm rounded hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
                  onClick={() => { setExportOpen(false); handleExportCSV(); }}
                  type="button"
                >
                  Export CSV
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm rounded hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
                  onClick={() => { setExportOpen(false); handleExportPDF(); }}
                  type="button"
                >
                  Export PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <h2 className="text-base sm:text-lg font-semibold mb-2">{categories.find(c => c.key === activeTab)?.label} Data</h2>
      {loading ? (
        <div className="text-center py-8 text-gray-500 text-sm sm:text-base">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <span className="flex items-center">
                      {col.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row: Record<string, unknown>, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => handleSelectRow(i)}
                    />
                  </td>
                  {columns.map(col => (
                    <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-[180px] overflow-x-auto">
                      {activeTab === 'contracts' && col.key === 'contactId'
                        ? getContactName(row[col.key] as string)
                        : row[col.key]?.toString() || ''}
                    </td>
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
  );
};

export default Reporting; 