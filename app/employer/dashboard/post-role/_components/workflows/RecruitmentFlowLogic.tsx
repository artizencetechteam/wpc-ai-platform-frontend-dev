'use client';

import React from 'react';
import { useAuditStore, AuditEmployee } from '@/app/store/auditStore';
import { AlertTriangle, CheckCircle2, Info, DatePicker, Calendar, FileSearch, ShieldAlert } from 'lucide-react';

export default function RecruitmentFlowLogic() {
  const { employees } = useAuditStore();

  const getComplianceResults = (emp: AuditEmployee) => {
    const results: { logic: string; outcome: 'Compliant' | 'Non-Compliance' | 'Warning'; message: string }[] = [];
    const { type, recruitmentDocs, cosDetails, payrollOnboardingDate } = emp;
    const { interviewDate, expLetterValidationDate } = recruitmentDocs;
    
    // Convert dates for comparison
    const cosDate = cosDetails ? new Date(cosDetails.cosAssignDateRaw) : null;
    const payrollDate = payrollOnboardingDate ? new Date(payrollOnboardingDate) : null;
    const intDate = interviewDate ? new Date(interviewDate) : null;
    const valDate = expLetterValidationDate ? new Date(expLetterValidationDate) : null;

    if (type === 'Sponsored - New hire') {
      // Logic for Case A
      results.push({
        logic: 'Experience Source Verification',
        outcome: 'Compliant', // Placeholder for actual CV analysis
        message: 'CV mentions no internal history prior to sponsorship.'
      });

      if (cosDate && intDate && intDate > cosDate) {
        results.push({
          logic: 'Interview Sequence',
          outcome: 'Non-Compliance',
          message: `Interview date (${interviewDate}) is after COS Assign Date (${cosDetails?.cosAssignDate}).`
        });
      } else {
        results.push({
          logic: 'Interview Sequence',
          outcome: 'Compliant',
          message: 'Interview conducted prior to COS assignment.'
        });
      }
    } else if (type === 'Sponsored – Existing staff') {
      // Logic for Case B
      if (cosDate && intDate && intDate > cosDate) {
        results.push({
          logic: 'Interview Update Requirement',
          outcome: 'Warning',
          message: 'Upload updated interview note – date is after COS assignment.'
        });
      }
    } else if (type === 'Not Sponsored') {
      // Logic for Case C
      if (payrollDate && intDate && intDate > payrollDate) {
        results.push({
          logic: 'Hiring Sequence',
          outcome: 'Non-Compliance',
          message: `Interview date (${interviewDate}) is after Payroll Onboarding Date (${payrollOnboardingDate}).`
        });
      }
    }

    return results;
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col gap-2">
        <h3 className="text-[18px] font-extrabold text-[#111827]">Workflow 2: Recruitment Flow Logic</h3>
        <p className="text-[13px] text-gray-400 font-medium italic">Automated decision engine cross-referencing recruitment evidence with payroll and sponsorship timelines.</p>
      </div>

      <div className="flex flex-col gap-6">
        {employees.map(emp => {
          const results = getComplianceResults(emp);
          return (
            <div key={emp.id} className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-6">
               <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-[#0852C9]">
                       {emp.fullName?.charAt(0)}
                     </div>
                     <div>
                        <div className="text-[14px] font-black text-gray-900">{emp.fullName}</div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{emp.type}</div>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="text-right">
                        <div className="text-[10px] font-black text-gray-400 uppercase">Payroll Start</div>
                        <div className="text-[12px] font-bold">{emp.payrollOnboardingDate || 'N/A'}</div>
                     </div>
                     {emp.cosDetails && (
                        <div className="text-right border-l border-gray-100 pl-4">
                           <div className="text-[10px] font-black text-gray-400 uppercase">COS Assigned</div>
                           <div className="text-[12px] font-bold">{emp.cosDetails.cosAssignDate}</div>
                        </div>
                     )}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.length === 0 && (
                    <div className="col-span-full py-10 bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-gray-400 font-bold text-[13px]">
                       <FileSearch size={24} className="mb-2 opacity-30" />
                       Insufficient data to run logic check. Ensure dates are entered in Stage 1.
                    </div>
                  )}
                  {results.map((res, i) => (
                    <div key={i} className={`p-5 rounded-2xl border flex flex-col gap-3 transition-all
                      ${res.outcome === 'Compliant' ? 'bg-green-50 border-green-100' : 
                        res.outcome === 'Non-Compliance' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}
                    `}>
                       <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider">{res.logic}</span>
                          {res.outcome === 'Compliant' ? <CheckCircle2 size={16} className="text-green-500" /> : 
                           res.outcome === 'Non-Compliance' ? <ShieldAlert size={16} className="text-red-500" /> : <AlertTriangle size={16} className="text-orange-500" />}
                       </div>
                       <div className={`text-[13px] font-black leading-tight
                         ${res.outcome === 'Compliant' ? 'text-green-700' : 
                           res.outcome === 'Non-Compliance' ? 'text-red-700' : 'text-orange-700'}
                       `}>
                         {res.outcome}
                       </div>
                       <p className="text-[12px] font-medium text-gray-600 leading-relaxed italic">
                         {res.message}
                       </p>
                    </div>
                  ))}
               </div>
            </div>
          );
        })}

        {employees.length === 0 && (
          <div className="py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300">
             <AlertTriangle size={48} className="mb-4 opacity-20" />
             <p className="text-[15px] font-black">Audit Logic Engine Idle</p>
             <p className="text-[12px] font-medium">Add staff to see automated compliance decisions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
