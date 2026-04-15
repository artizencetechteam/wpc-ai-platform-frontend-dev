'use client';

import React, { useState } from 'react';
import { useAuditStore, AuditEmployee } from '@/app/store/auditStore';
import { Wallet, Landmark, Upload, Loader2, CheckCircle2, XCircle, AlertCircle, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Transaction {
  id: string;
  month: string;
  employeeId: string;
  amount: number;
  expectedAmount: number;
  status: 'Matched' | 'Underpaid' | 'Missing';
}

export default function PayrollAuditWorkflow() {
  const { employees } = useAuditStore();
  const [isExtracting, setIsExtracting] = useState(false);
  const [results, setResults] = useState<Transaction[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleBankUpload = async () => {
    setIsExtracting(true);
    const toastId = toast.loading('AI extracting payroll data from bank statements...');
    
    // Simulate API call to /api/extract-bank-statement
    setTimeout(() => {
        setIsExtracting(false);
        toast.dismiss(toastId);
        
        // Mock extracted data based on current employees
        const mockResults: Transaction[] = employees.flatMap(emp => [
            { id: Math.random().toString(), month: 'Jan 2024', employeeId: emp.id, amount: 2500, expectedAmount: 2500, status: 'Matched' },
            { id: Math.random().toString(), month: 'Feb 2024', employeeId: emp.id, amount: 2400, expectedAmount: 2500, status: 'Underpaid' },
            { id: Math.random().toString(), month: 'Mar 2024', employeeId: emp.id, amount: 0, expectedAmount: 2500, status: 'Missing' },
        ]);
        setResults(mockResults);
        toast.success('Extraction complete. Verification findings listed below.');
    }, 2000);
  };

  const updateTransaction = (id: string, amount: number) => {
    setResults(prev => prev.map(t => {
        if (t.id === id) {
            const status = amount === t.expectedAmount ? 'Matched' : amount === 0 ? 'Missing' : 'Underpaid';
            return { ...t, amount, status };
        }
        return t;
    }));
    setEditingId(null);
    toast.success('Record updated manually');
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col gap-2">
        <h3 className="text-[18px] font-extrabold text-[#111827]">Workflow 4: C&B Audit (Payroll)</h3>
        <p className="text-[13px] text-gray-400 font-medium italic">Comparing Real-Time Information (RTI) against actual bank statement outflows to ensure payment compliance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Panel */}
        <div className="flex flex-col gap-6 p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 h-fit">
           <div className="flex items-center gap-3 text-[14px] font-black text-[#0852C9] uppercase tracking-wider">
              <Landmark size={20} />
              Evidence Repository
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-blue-200 bg-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#0852C9] transition-colors">
                 <Upload className="text-[#0852C9]" size={20} />
                 <span className="text-[11px] font-black uppercase text-center text-gray-400">Upload RTI (6m)</span>
              </div>
              <div className="border-2 border-dashed border-blue-200 bg-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#0852C9] transition-colors">
                 <Upload className="text-[#0852C9]" size={20} />
                 <span className="text-[11px] font-black uppercase text-center text-gray-400">Bank Statements (6m)</span>
              </div>
           </div>

           <button 
            disabled={isExtracting}
            onClick={handleBankUpload}
            className="w-full py-5 bg-[#0852C9] text-white rounded-2xl text-[14px] font-black shadow-xl shadow-blue-100 flex items-center justify-center gap-3 hover:bg-[#0644A8] transition-all"
           >
              {isExtracting ? <Loader2 className="animate-spin" /> : <Wallet size={18} />}
              {isExtracting ? 'Extracting Payments...' : 'Run Automated Cross-Check'}
           </button>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-4 p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 h-fit">
           <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">Compliance Indicators</div>
           <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100">
                 <div className="w-2 h-2 rounded-full bg-green-500" />
                 <span className="text-[12px] font-bold text-gray-700">Matched – Amount matches RTI exactly</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100">
                 <div className="w-2 h-2 rounded-full bg-red-500" />
                 <span className="text-[12px] font-bold text-gray-700">Missing – No matching transaction found in bank</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100">
                 <div className="w-2 h-2 rounded-full bg-orange-500" />
                 <span className="text-[12px] font-bold text-gray-700">Underpaid – Bank outflow is less than RTI payable</span>
              </div>
           </div>
        </div>
      </div>

      {/* Audit Findings Table */}
      <div className="overflow-x-auto border border-gray-100 rounded-[2.5rem] bg-white shadow-xl shadow-gray-100/30 overflow-hidden">
         <table className="min-w-full text-left">
            <thead className="bg-[#FAFBFD] border-b border-gray-100">
               <tr>
                  <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                  <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Period</th>
                  <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">RTI (Expected)</th>
                  <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Bank (Actual)</th>
                  <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Findings</th>
                  <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {results.map(t => {
                  const emp = employees.find(e => e.id === t.employeeId);
                  return (
                     <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-6">
                           <div className="text-[14px] font-black text-gray-900">{emp?.fullName}</div>
                           <div className="text-[11px] font-bold text-gray-400 uppercase">{emp?.designation}</div>
                        </td>
                        <td className="p-6 text-[13px] font-bold text-gray-600">{t.month}</td>
                        <td className="p-6 text-[13px] font-black text-gray-900">£{t.expectedAmount.toLocaleString()}</td>
                        <td className="p-6">
                           {editingId === t.id ? (
                               <input 
                                 autoFocus
                                 className="w-24 p-2 bg-blue-50 border border-blue-200 rounded-lg text-[13px] font-black"
                                 defaultValue={t.amount}
                                 onBlur={(e) => updateTransaction(t.id, Number(e.target.value))}
                                 onKeyDown={(e) => e.key === 'Enter' && updateTransaction(t.id, Number((e.target as HTMLInputElement).value))}
                               />
                           ) : (
                               <div className="text-[13px] font-black text-[#0852C9]">£{t.amount.toLocaleString()}</div>
                           )}
                        </td>
                        <td className="p-6">
                           <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2
                              ${t.status === 'Matched' ? 'bg-green-50 text-green-600' : 
                                t.status === 'Missing' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}
                           `}>
                              {t.status === 'Matched' ? <CheckCircle2 size={12} /> : 
                               t.status === 'Missing' ? <XCircle size={12} /> : <AlertCircle size={12} />}
                              {t.status === 'Matched' ? 'Payment Verified' : 
                               t.status === 'Missing' ? `Payment missing for ${t.month.split(' ')[0]}` : 
                               `Underpaid by £${(t.expectedAmount - t.amount).toLocaleString()}`}
                           </div>
                        </td>
                        <td className="p-6 text-right">
                           <button 
                             onClick={() => setEditingId(t.id)}
                             className="p-3 text-gray-400 hover:text-[#0852C9] hover:bg-blue-50 rounded-xl transition-all"
                           >
                              <Edit3 size={18} />
                           </button>
                        </td>
                     </tr>
                  );
               })}
               {results.length === 0 && (
                 <tr>
                    <td colSpan={6} className="p-20 text-center">
                       <Wallet className="mx-auto text-gray-200 mb-4" size={48} />
                       <p className="text-[15px] font-black text-gray-400 uppercase tracking-widest">No audit data extracted</p>
                       <p className="text-[12px] text-gray-400 font-medium">Upload evidences to start the cross-check.</p>
                    </td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
}
