'use client';

import React, { useState } from 'react';
import { useAuditStore, AuditEmployee, EmployeeType } from '@/app/store/auditStore';
import { FileText, Calendar, Plus, ChevronRight, CheckCircle2, User, History } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RecruitmentDocsStep() {
  const { employees, updateEmployee } = useAuditStore();
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  const selectedEmployee = employees.find(e => e.id === selectedEmpId);

  const handleUpdate = (updates: any) => {
    if (selectedEmpId) {
      updateEmployee(selectedEmpId, {
        recruitmentDocs: {
          ...selectedEmployee?.recruitmentDocs,
          ...updates
        }
      } as any);
    }
  };

  const handleTypeChange = (type: EmployeeType) => {
    if (selectedEmpId) {
      updateEmployee(selectedEmpId, { type });
    }
  };

  const isComplete = (emp: AuditEmployee) => {
    return !!(emp.recruitmentDocs.cvFile && emp.recruitmentDocs.interviewDate);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col gap-2">
        <h3 className="text-[18px] font-extrabold text-[#111827]">Step 1 Page 2: Recruitment Documents</h3>
        <p className="text-[13px] text-gray-400 font-medium italic">Assign employment types and upload supporting recruitment evidence for each staff member.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Staff List */}
        <div className="w-full lg:w-1/3 flex flex-col gap-3">
          <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2">Employees in Audit</div>
          {employees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => setSelectedEmpId(emp.id)}
              className={`p-5 rounded-2xl border transition-all text-left flex items-center justify-between group
                ${selectedEmpId === emp.id 
                  ? 'bg-blue-50 border-blue-100 ring-2 ring-blue-50' 
                  : isComplete(emp) 
                    ? 'bg-white border-green-100' 
                    : 'bg-white border-gray-100 hover:border-blue-100'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[13px]
                  ${selectedEmpId === emp.id ? 'bg-[#0852C9] text-white' : 'bg-gray-100 text-gray-400'}
                `}>
                  {emp.fullName?.charAt(0) || <User size={16} />}
                </div>
                <div className="flex flex-col">
                  <span className={`text-[14px] font-black ${selectedEmpId === emp.id ? 'text-[#0852C9]' : 'text-gray-900'}`}>{emp.fullName}</span>
                  <span className="text-[11px] font-bold text-gray-400">{emp.type}</span>
                </div>
              </div>
              {isComplete(emp) && <CheckCircle2 className="text-green-500" size={18} />}
            </button>
          ))}
          {employees.length === 0 && (
            <div className="p-10 border-2 border-dashed border-gray-100 rounded-3xl text-center text-gray-400 text-[12px] font-bold">
              Please add employees in the previous step first.
            </div>
          )}
        </div>

        {/* Right: Upload Area */}
        <div className="flex-1 w-full">
          {selectedEmployee ? (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/30 flex flex-col gap-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                 <div>
                    <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Active Profiling</div>
                    <div className="text-[20px] font-black text-gray-900">{selectedEmployee.fullName}</div>
                 </div>
                 <div className="flex flex-col items-end">
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Employment Type</label>
                    <select 
                      value={selectedEmployee.type}
                      onChange={(e) => handleTypeChange(e.target.value as EmployeeType)}
                      className="bg-gray-50 border-none p-2 rounded-lg text-[13px] font-bold text-[#0852C9] outline-none"
                    >
                      <option value="Sponsored - New hire">Sponsored - New hire</option>
                      <option value="Sponsored – Existing staff">Sponsored – Existing staff</option>
                      <option value="Not Sponsored">Not Sponsored</option>
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
                 {/* Upload CV */}
                 <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-[14px] font-black text-gray-900">
                       <FileText size={18} className="text-[#0852C9]" />
                       Upload CV
                    </div>
                    <div className={`p-8 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group hover:bg-blue-50/50 hover:border-blue-100
                      ${selectedEmployee.recruitmentDocs.cvFile ? 'bg-green-50/30 border-green-100' : ''}
                    `}
                    onClick={() => handleUpdate({ cvFile: 'cv_mock.pdf' })}>
                       <Plus size={24} className={selectedEmployee.recruitmentDocs.cvFile ? 'text-green-500' : 'text-gray-300'} />
                       <span className={`text-[12px] font-bold ${selectedEmployee.recruitmentDocs.cvFile ? 'text-green-600' : 'text-gray-400'}`}>
                         {selectedEmployee.recruitmentDocs.cvFile ? 'CV Uploaded ✓' : 'Click to Upload CV'}
                       </span>
                    </div>
                 </div>

                 {/* Upload Experience Letters */}
                 <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-[14px] font-black text-gray-900 text-nowrap">
                       <History size={18} className="text-[#0852C9]" />
                       Experience Letter(s)
                    </div>
                    <div className="p-8 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                       <Plus size={24} className="text-gray-300" />
                       <span className="text-[12px] font-bold text-gray-400 leading-tight">Multiple uploads permitted</span>
                    </div>
                 </div>

                 {/* Interview Date */}
                 <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-[14px] font-black text-gray-900">
                       <Calendar size={18} className="text-[#0852C9]" />
                       Interview Date
                    </div>
                    <input 
                      type="date"
                      className="p-4 bg-gray-50 rounded-2xl text-[13px] font-bold outline-none border border-transparent focus:bg-white focus:border-blue-100 transition-all"
                      value={selectedEmployee.recruitmentDocs.interviewDate || ''}
                      onChange={(e) => handleUpdate({ interviewDate: e.target.value })}
                    />
                 </div>

                 {/* Validation Date */}
                 <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-[14px] font-black text-gray-900 overflow-hidden text-nowrap">
                       <History size={18} className="text-[#0852C9]" />
                       Exp. Validation Date
                    </div>
                    <input 
                      type="date"
                      className="p-4 bg-gray-50 rounded-2xl text-[13px] font-bold outline-none border border-transparent focus:bg-white focus:border-blue-100 transition-all"
                      value={selectedEmployee.recruitmentDocs.expLetterValidationDate || ''}
                      onChange={(e) => handleUpdate({ expLetterValidationDate: e.target.value })}
                    />
                 </div>
              </div>

              {/* Add other relevant date */}
              <div className="mt-4">
                 <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-xl text-[12px] font-black text-gray-500 hover:bg-gray-100 transition-all">
                    <Plus size={16} />
                    Add any other relevant date
                 </button>
              </div>

              <div className="mt-6 flex justify-end">
                 <button 
                  onClick={() => toast.success('Profile documents saved')}
                  className="px-10 py-4 bg-gray-900 text-white rounded-2xl text-[13px] font-black shadow-lg shadow-gray-200 active:scale-95 transition-all"
                 >
                   Save Profile
                 </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 text-gray-300">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="text-[14px] font-bold">Select an employee from the left to manage documentation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
