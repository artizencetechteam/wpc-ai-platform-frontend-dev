'use client';

import React, { useState } from 'react';
import { useAuditStore, RTWStatus } from '@/app/store/auditStore';
import { XCircle, Upload, ShieldCheck, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updatePostComplianceStaffDetailsAction } from '@/app/employer/sections/action/action';

// ── Per-employee Save RTW button ──────────────────────────────────────────────
function RTWSaveButton({ empId, rtwStatus }: { empId: string; rtwStatus: RTWStatus }) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const staffId = Number(empId);
    if (isNaN(staffId)) {
      toast.error('Invalid employee ID.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await updatePostComplianceStaffDetailsAction(staffId, {
        rtw_work_check: rtwStatus,
      });
      if (res.success) {
        toast.success('RTW check status saved to server');
      } else {
        toast.error(res.message || 'Save failed.');
      }
    } catch {
      toast.error('Network error saving RTW status.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={isSaving}
      className={`px-5 py-3 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all flex items-center gap-2
        ${isSaving ? 'bg-gray-100 text-gray-400 pointer-events-none' : 'bg-gray-900 text-white hover:bg-gray-700 active:scale-95'}
      `}
    >
      {isSaving && <Loader2 className="animate-spin" size={14} />}
      {isSaving ? 'Saving...' : 'Save RTW'}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RTWCheckStep() {
  const { employees, updateEmployee } = useAuditStore();

  const handleStatusChange = (id: string, status: RTWStatus) => {
    updateEmployee(id, { rtwStatus: status });
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col gap-2">
        <h3 className="text-[18px] font-extrabold text-[#111827]">Step 1 Page 3: Upload Right to Work Check</h3>
        <p className="text-[13px] text-gray-400 font-medium italic">
          Validate the right to work status for all added employees. Compliance depends on this verification.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className={`p-8 bg-white rounded-[2rem] border transition-all duration-300 flex flex-col lg:flex-row items-center justify-between gap-8
                ${emp.rtwStatus === 'Available' ? 'border-green-100 ring-4 ring-green-50/50' : 'border-gray-100'}
              `}
            >
              {/* Employee info */}
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg
                  ${emp.rtwStatus === 'Available' ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-400'}
                `}>
                  {emp.rtwStatus === 'Available' ? <ShieldCheck size={28} /> : <User size={28} />}
                </div>
                <div>
                  <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Employee Check</div>
                  <div className="text-[22px] font-black text-gray-900 tracking-tight">{emp.fullName}</div>
                  <div className="text-[13px] text-gray-500 font-bold">{emp.type} · {emp.designation}</div>
                </div>
              </div>

              {/* Status controls + Save */}
              <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                  {(['Available', 'Not Available', 'Not Required'] as RTWStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(emp.id, status)}
                      className={`px-5 py-3 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all
                        ${emp.rtwStatus === status
                          ? status === 'Available' ? 'bg-green-500 text-white shadow-lg shadow-green-100'
                            : status === 'Not Available' ? 'bg-red-500 text-white shadow-lg shadow-red-100'
                            : 'bg-gray-900 text-white'
                          : 'text-gray-400 hover:bg-white hover:text-gray-900'}
                      `}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {emp.rtwStatus === 'Available' && (
                  <div className="flex-1 lg:w-56">
                    <div className="group border-2 border-dashed border-green-200 bg-green-50/30 rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer hover:border-green-500 hover:bg-white transition-all">
                      <Upload className="text-green-500" size={18} />
                      <span className="text-[12px] font-bold text-green-700">Upload Evidence</span>
                    </div>
                  </div>
                )}

                <RTWSaveButton empId={emp.id} rtwStatus={emp.rtwStatus} />
              </div>
            </div>
          ))}

          {employees.length === 0 && (
            <div className="py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
              <XCircle className="text-gray-200 mb-4" size={48} />
              <p className="text-[15px] font-black text-gray-400">No staff found to validate.</p>
              <p className="text-[12px] text-gray-400 font-medium">Please add employees in Stage 1 to manage RTW status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
