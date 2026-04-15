'use client';

import React from 'react';
import { useAuditStore, AuditEmployee } from '@/app/store/auditStore';
import { ShieldCheck, ShieldAlert, Calendar, User, Info } from 'lucide-react';

export default function RTWComplianceLogic() {
  const { employees } = useAuditStore();

  const getRTWCompliance = (emp: AuditEmployee) => {
    const { payrollOnboardingDate, rtwStatus } = emp;
    // We assume the rtwCheckDate is stored in recruitmentDocs or a new field.
    // Let's use interviewDate as a proxy for rtw check date if not exist, 
    // but better to add a specific field in the store later. 
    // For now, let's assume recruitmentDocs.expLetterValidationDate is the RTW check date.
    const rtwCheckDateStr = emp.recruitmentDocs.expLetterValidationDate; 
    
    if (rtwStatus === 'Not Required') return { status: 'Compliant', msg: 'RTW check not required for this status.' };
    if (!rtwCheckDateStr || !payrollOnboardingDate) return { status: 'Pending', msg: 'Missing dates for validation.' };

    const checkDate = new Date(rtwCheckDateStr);
    const onboardingDate = new Date(payrollOnboardingDate);

    if (checkDate <= onboardingDate) {
      return { 
        status: 'Compliant', 
        msg: `Check conducted on ${rtwCheckDateStr}, which is on or before onboarding (${payrollOnboardingDate}).` 
      };
    } else {
      return { 
        status: 'Non-compliant', 
        msg: `Check conducted on ${rtwCheckDateStr}, which is AFTER onboarding (${payrollOnboardingDate}). This is a violation.` 
      };
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex flex-col gap-2">
        <h3 className="text-[18px] font-extrabold text-[#111827]">Workflow 3: Right to Work Compliance</h3>
        <p className="text-[13px] text-gray-400 font-medium italic">Validating that Right to Work checks were performed prior to official payroll onboarding.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {employees.map(emp => {
          const result = getRTWCompliance(emp);
          const isCompliant = result.status === 'Compliant';
          const isPending = result.status === 'Pending';

          return (
            <div key={emp.id} className={`p-8 rounded-[2.5rem] border transition-all duration-300 flex flex-col gap-6
              ${isCompliant ? 'bg-green-50/30 border-green-100' : isPending ? 'bg-gray-50 border-gray-100' : 'bg-red-50/30 border-red-100 ring-4 ring-red-50/50'}
            `}>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                       ${isCompliant ? 'bg-green-500 text-white' : isPending ? 'bg-gray-200 text-gray-400' : 'bg-red-500 text-white shadow-lg shadow-red-100'}
                     `}>
                        {isCompliant ? <ShieldCheck size={24} /> : isPending ? <User size={24} /> : <ShieldAlert size={24} />}
                     </div>
                     <div>
                        <div className="text-[14px] font-black text-gray-900">{emp.fullName}</div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{emp.rtwStatus}</div>
                     </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest
                    ${isCompliant ? 'bg-green-100 text-green-700' : isPending ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'}
                  `}>
                    {result.status}
                  </div>
               </div>

               <div className="p-6 bg-white rounded-3xl border border-gray-100/50 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between text-[12px] font-bold">
                     <div className="flex items-center gap-2 text-gray-400">
                        <Calendar size={14} />
                        RTW Check Conducted
                     </div>
                     <div className="text-gray-900">{emp.recruitmentDocs.expLetterValidationDate || 'Not set'}</div>
                  </div>
                  <div className="flex items-center justify-between text-[12px] font-bold">
                     <div className="flex items-center gap-2 text-gray-400">
                        <Calendar size={14} />
                        Payroll Onboarding
                     </div>
                     <div className="text-gray-900">{emp.payrollOnboardingDate || 'Not set'}</div>
                  </div>
                  <div className="mt-2 text-[13px] font-medium text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                     {result.msg}
                  </div>
               </div>
            </div>
          );
        })}

        {employees.length === 0 && (
          <div className="col-span-full py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center text-gray-300">
             <Info size={48} className="mb-4 opacity-20" />
             <p className="text-[15px] font-black">RTW Validator Offline</p>
             <p className="text-[12px] font-medium">Add staff data to verify right to work timelines.</p>
          </div>
        )}
      </div>
    </div>
  );
}
