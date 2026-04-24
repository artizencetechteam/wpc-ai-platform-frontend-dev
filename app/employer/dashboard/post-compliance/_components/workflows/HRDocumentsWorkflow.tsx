'use client';

import React, { useState, useEffect } from 'react';
import { useAuditStore, ComplianceStatus } from '@/app/store/auditStore';
import { FileText, ClipboardCheck, MessageSquare, CheckCircle2, AlertTriangle, ShieldAlert, User, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const HR_FIELDS = [
  'Attendance records',
  'Leave records',
  'Evidence of Work',
  'Employment contracts',
  'NOC (if needed)'
];

interface HRComplianceRecord {
  employeeId: string;
  field: string;
  remark: string;
  status: ComplianceStatus;
}

export default function HRDocumentsWorkflow() {
  const { employees } = useAuditStore();
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(employees[0]?.id || null);
  const [records, setRecords] = useState<HRComplianceRecord[]>([]);

  // Local draft remarks — keyed by field name — so typing doesn't trigger saves
  const [draftRemarks, setDraftRemarks] = useState<Record<string, string>>({});

  const selectedEmployee = employees.find(e => e.id === selectedEmpId);

  // Reset drafts when switching employee
  useEffect(() => {
    if (!selectedEmpId) return;
    const initialDrafts: Record<string, string> = {};
    HR_FIELDS.forEach(field => {
      const existing = records.find(r => r.employeeId === selectedEmpId && r.field === field);
      initialDrafts[field] = existing?.remark || '';
    });
    setDraftRemarks(initialDrafts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmpId]);

  const handleStatusChange = (field: string, status: ComplianceStatus) => {
    if (!selectedEmpId) return;
    setRecords(prev => {
      const filtered = prev.filter(r => !(r.employeeId === selectedEmpId && r.field === field));
      const existingRemark = prev.find(r => r.employeeId === selectedEmpId && r.field === field)?.remark || draftRemarks[field] || '';
      return [...filtered, { employeeId: selectedEmpId, field, remark: existingRemark, status }];
    });
  };

  const handleSaveField = (field: string) => {
    if (!selectedEmpId) return;
    const remark = draftRemarks[field] || '';
    setRecords(prev => {
      const filtered = prev.filter(r => !(r.employeeId === selectedEmpId && r.field === field));
      const existingStatus = prev.find(r => r.employeeId === selectedEmpId && r.field === field)?.status || 'Compliant';
      return [...filtered, { employeeId: selectedEmpId, field, remark, status: existingStatus }];
    });
    toast.success(`${field} remarks saved`);
  };

  const getRecord = (field: string) => {
    return records.find(r => r.employeeId === selectedEmpId && r.field === field);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col gap-2">
        <h3 className="text-[18px] font-extrabold text-[#111827]">Workflow 6: HR Documents Final Categorization</h3>
        <p className="text-[13px] text-gray-400 font-medium italic">Final evaluation of core HR documentation with manual categorization and professional remarks.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Selection Column */}
        <div className="w-full lg:w-[280px] flex flex-col gap-3 shrink-0">
           <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">
              <User size={12} />
              Finalize Record For
           </div>
           {employees.map(emp => (
             <button
               key={emp.id}
               onClick={() => setSelectedEmpId(emp.id)}
               className={`p-5 rounded-3xl border transition-all text-left flex flex-col gap-1
                 ${selectedEmpId === emp.id ? 'bg-[#0852C9] border-[#0852C9] text-white shadow-2xl shadow-blue-100' : 'bg-white border-gray-100 text-gray-500 hover:border-blue-100'}
               `}
             >
               <span className="text-[15px] font-black truncate">{emp.fullName}</span>
               <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedEmpId === emp.id ? 'text-blue-200' : 'text-gray-400'}`}>{emp.type}</span>
             </button>
           ))}
        </div>

        {/* Categorization Feed */}
        <div className="flex-1 w-full flex flex-col gap-8">
           {selectedEmployee ? (
             <div className="grid grid-cols-1 gap-8">
                {HR_FIELDS.map(field => {
                    const record = getRecord(field);
                    return (
                        <div key={field} className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm flex flex-col gap-6 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#0852C9]">
                                    <FileText size={22} />
                                 </div>
                                 <h4 className="text-[18px] font-black text-gray-900 tracking-tight">{field}</h4>
                              </div>
                              <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                                 {(['Compliant', 'Partially compliant', 'Non-Compliant'] as ComplianceStatus[]).map((status) => (
                                   <button
                                     key={status}
                                     onClick={() => handleStatusChange(field, status)}
                                     className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all
                                       ${record?.status === status 
                                         ? status === 'Compliant' ? 'bg-green-500 text-white shadow-lg shadow-green-100' :
                                           status === 'Partially compliant' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' :
                                           'bg-red-500 text-white shadow-lg shadow-red-100'
                                         : 'text-gray-400 hover:bg-white hover:text-gray-900'}
                                     `}
                                   >
                                     {status === 'Compliant' ? 'Compliant' : status === 'Partially compliant' ? 'Partial' : 'Non-Comp'}
                                   </button>
                                 ))}
                              </div>
                           </div>

                           <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                 <MessageSquare size={14} />
                                 Observation Remarks
                              </div>
                              <textarea 
                                className="w-full p-5 bg-gray-50 rounded-[1.5rem] text-[14px] font-medium border border-transparent outline-none focus:bg-white focus:border-blue-100 focus:ring-4 ring-blue-50/50 transition-all min-h-[100px]"
                                placeholder={`Enter professional summary for ${field.toLowerCase()}...`}
                                value={draftRemarks[field] ?? record?.remark ?? ''}
                                onChange={(e) =>
                                  setDraftRemarks(prev => ({ ...prev, [field]: e.target.value }))
                                }
                              />
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleSaveField(field)}
                                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-[12px] font-black shadow-md active:scale-95 transition-all hover:bg-gray-700"
                                >
                                  <Save size={14} />
                                  Save Remarks
                                </button>
                              </div>
                           </div>

                           {record?.status && (
                             <div className={`mt-2 flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all duration-500
                                ${record.status === 'Compliant' ? 'bg-green-50 border-green-100 text-green-700' : 
                                  record.status === 'Partially compliant' ? 'bg-orange-50 border-orange-100 text-orange-700' : 
                                  'bg-red-50 border-red-100 text-red-700'}
                             `}>
                                {record.status === 'Compliant' ? <CheckCircle2 size={18} /> : 
                                 record.status === 'Partially compliant' ? <AlertTriangle size={18} /> : <ShieldAlert size={18} />}
                                <div className="text-[13px] font-black uppercase tracking-widest">
                                   Categorized as: {record.status}
                                </div>
                             </div>
                           )}
                        </div>
                    );
                })}

                <div className="flex justify-end mt-4">
                   <button 
                    onClick={() => toast.success('HR validation finalized')}
                    className="px-14 py-5 bg-[#0852C9] text-white rounded-3xl text-[15px] font-black shadow-2xl shadow-blue-100 active:scale-95 transition-all"
                   >
                     Submit Evaluation Stage
                   </button>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center p-32 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 text-gray-300">
                <ClipboardCheck size={64} className="mb-6 opacity-20" />
                <p className="text-[16px] font-black uppercase tracking-widest">Ready for Final Oversight</p>
                <p className="text-[13px] font-medium">Select a staff member from the left to start categorization.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
