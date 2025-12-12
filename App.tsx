import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileDown, Printer } from 'lucide-react';
import { ReportHeader, LineItem } from './types';
import { getFormattedDate, formatCurrency } from './utils';
import { generateReports, calculateTotals } from './services/reportService';

const App: React.FC = () => {
  const [header, setHeader] = useState<ReportHeader>({
    buyerName: '',
    supplierName: '',
    fileNo: '',
    invoiceNo: '',
    lcNumber: '',
    invoiceDate: '',
    billingDate: ''
  });

  const [items, setItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      fabricCode: '',
      itemDescription: '',
      color: '',
      hsCode: '',
      rcvdDate: '',
      challanNo: '',
      piNumber: '',
      unit: 'YDS',
      invoiceQty: 0,
      rcvdQty: 0,
      unitPrice: 0,
      appstremeNo: ''
    }
  ]);

  // Set default billing date on mount
  useEffect(() => {
    const today = new Date();
    setHeader(prev => ({ ...prev, billingDate: getFormattedDate(today) }));
  }, []);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id: string, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [name]: value };
      }
      return item;
    }));
  };

  const addNewRow = () => {
    setItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        fabricCode: '',
        itemDescription: '',
        color: '',
        hsCode: '',
        rcvdDate: '',
        challanNo: '',
        piNumber: '',
        unit: 'YDS',
        invoiceQty: 0,
        rcvdQty: 0,
        unitPrice: 0,
        appstremeNo: ''
      }
    ]);
  };

  const removeRow = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const totals = calculateTotals(items);

  const handleGenerate = () => {
    if (!header.buyerName) {
      alert("Please enter a Buyer Name.");
      return;
    }
    generateReports(header, items);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-sm">
      <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
        
        {/* Header Section */}
        <div className="bg-slate-800 text-white p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h1 className="text-2xl font-bold tracking-tight">Tusuka Trousers Ltd.</h1>
            <div className="text-right opacity-80 text-xs">
              <p>Neelngar, Konabari, Gazipur</p>
              <p className="font-semibold text-sm mt-1">Inventory Report Generator</p>
            </div>
          </div>
        </div>

        {/* Input Forms */}
        <div className="p-6 space-y-8">
          
          {/* Top Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            <div className="space-y-3">
              <InputGroup label="Buyer Name" name="buyerName" value={header.buyerName} onChange={handleHeaderChange} placeholder="e.g. HNM" />
              <InputGroup label="Supplier Name" name="supplierName" value={header.supplierName} onChange={handleHeaderChange} />
              <InputGroup label="File No" name="fileNo" value={header.fileNo} onChange={handleHeaderChange} />
              <InputGroup label="Invoice No" name="invoiceNo" value={header.invoiceNo} onChange={handleHeaderChange} />
              <InputGroup label="L/C Number" name="lcNumber" value={header.lcNumber} onChange={handleHeaderChange} />
            </div>
            <div className="space-y-3">
              <InputGroup label="Invoice Date" name="invoiceDate" value={header.invoiceDate} onChange={handleHeaderChange} type="date" />
              <InputGroup label="Billing Date" name="billingDate" value={header.billingDate} onChange={handleHeaderChange} readOnly />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Inventory Items</h2>
              <button 
                onClick={addNewRow}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-xs font-medium transition-colors"
              >
                <Plus size={16} /> Add Fabric Row
              </button>
            </div>
            
            {/* Table Area - Horizontal Scroll enabled for mobile */}
            <div className="overflow-x-auto rounded-lg border border-gray-300">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr className="divide-x divide-gray-200">
                    <Th>Fabric Code</Th>
                    <Th width="200px">Item Description</Th>
                    <Th>Details (Color/HS)</Th>
                    <Th>Rcvd Date</Th>
                    <Th>Challan No</Th>
                    <Th>Pi Number</Th>
                    <Th>Unit</Th>
                    <Th>Inv Qty</Th>
                    <Th>Rcvd Qty</Th>
                    <Th>Unit Price $</Th>
                    <Th>Total Value</Th>
                    <Th>Appstreme No.</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.map((item, index) => (
                    <tr key={item.id} className="divide-x divide-gray-200 hover:bg-gray-50">
                      <Td>
                        <input className="w-full p-1 border rounded bg-transparent focus:ring-1 focus:ring-blue-500 outline-none" 
                          name="fabricCode" value={item.fabricCode} onChange={(e) => handleItemChange(item.id, e)} />
                      </Td>
                      <Td>
                        <input className="w-full p-1 border rounded bg-transparent focus:ring-1 focus:ring-blue-500 outline-none" 
                          name="itemDescription" placeholder="Desc" value={item.itemDescription} onChange={(e) => handleItemChange(item.id, e)} />
                      </Td>
                      <Td>
                         <div className="flex flex-col gap-1">
                            <input className="w-full p-1 border rounded text-xs" name="color" placeholder="Color" value={item.color} onChange={(e) => handleItemChange(item.id, e)} />
                            <input className="w-full p-1 border rounded text-xs" name="hsCode" placeholder="HS Code" value={item.hsCode} onChange={(e) => handleItemChange(item.id, e)} />
                         </div>
                      </Td>
                      <Td>
                        <input type="date" className="w-full p-1 border rounded bg-transparent text-xs" 
                          name="rcvdDate" value={item.rcvdDate} onChange={(e) => handleItemChange(item.id, e)} />
                      </Td>
                      <Td>
                        <input className="w-full p-1 border rounded bg-transparent" 
                          name="challanNo" value={item.challanNo} onChange={(e) => handleItemChange(item.id, e)} />
                      </Td>
                      <Td>
                        <input className="w-full p-1 border rounded bg-transparent" 
                          name="piNumber" value={item.piNumber} onChange={(e) => handleItemChange(item.id, e)} />
                      </Td>
                      <Td>
                        <select className="w-full p-1 border rounded bg-transparent" 
                          name="unit" value={item.unit} onChange={(e) => handleItemChange(item.id, e)}>
                            <option value="YDS">YDS</option>
                            <option value="PCS">PCS</option>
                            <option value="KGS">KGS</option>
                            <option value="MTR">MTR</option>
                        </select>
                      </Td>
                      <Td>
                        <input type="number" className="w-full p-1 border rounded bg-transparent" 
                          name="invoiceQty" value={item.invoiceQty || ''} onChange={(e) => handleItemChange(item.id, e)} />
                      </Td>
                      <Td>
                        <input type="number" className="w-full p-1 border rounded bg-transparent" 
                          name="rcvdQty" value={item.rcvdQty || ''} onChange={(e) => handleItemChange(item.id, e)} />
                      </Td>
                      <Td>
                        <input type="number" className="w-full p-1 border rounded bg-transparent" 
                          name="unitPrice" value={item.unitPrice || ''} onChange={(e) => handleItemChange(item.id, e)} />
                      </Td>
                      <Td className="bg-gray-50 text-right font-medium">
                        {formatCurrency(Number(item.invoiceQty || 0) * Number(item.unitPrice || 0))}
                      </Td>
                      <Td>
                        <input className="w-full p-1 border rounded bg-transparent" 
                          name="appstremeNo" value={item.appstremeNo} onChange={(e) => handleItemChange(item.id, e)} />
                      </Td>
                      <Td className="text-center">
                        <button onClick={() => removeRow(item.id)} className="text-red-500 hover:text-red-700 p-1" disabled={items.length === 1}>
                          <Trash2 size={16} />
                        </button>
                      </Td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-slate-100 font-bold divide-x divide-gray-300">
                    <Td colSpan={6} className="text-right pr-4">Total:</Td>
                    <Td className="text-center">YDS</Td>
                    <Td className="text-right">{totals.totalInvoiceQty.toFixed(2)}</Td>
                    <Td className="text-right">{totals.totalRcvdQty.toFixed(2)}</Td>
                    <Td></Td>
                    <Td className="text-right text-blue-800">{formatCurrency(totals.totalValue)}</Td>
                    <Td colSpan={2}></Td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
             Ready to generate Bill for <strong>{header.buyerName || '(Buyer)'}</strong> with Total Value <strong>{formatCurrency(totals.totalValue)}</strong>
          </div>
          <button 
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-bold shadow-lg transform active:scale-95 transition-all"
          >
            <FileDown size={20} />
            GENERATE REPORT (PDF & Excel)
          </button>
        </div>
      </div>
    </div>
  );
};

// UI Components
const InputGroup = ({ label, name, value, onChange, placeholder, type = "text", readOnly = false }: any) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
    <label className="sm:w-32 font-semibold text-gray-700">{label} :</label>
    <input 
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}`}
    />
  </div>
);

const Th = ({ children, width }: { children?: React.ReactNode, width?: string }) => (
  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" style={{ width }}>
    {children}
  </th>
);

const Td = ({ children, className = "", colSpan }: { children?: React.ReactNode, className?: string, colSpan?: number }) => (
  <td className={`px-3 py-2 text-xs whitespace-nowrap text-gray-700 ${className}`} colSpan={colSpan}>
    {children}
  </td>
);

export default App;