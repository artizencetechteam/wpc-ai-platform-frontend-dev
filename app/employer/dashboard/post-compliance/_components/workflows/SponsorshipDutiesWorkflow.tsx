'use client';

import React, { useState, useEffect } from 'react';
import { useAuditStore, AuditEmployee } from '@/app/store/auditStore';
import { ShieldCheck, ShieldAlert, Timer, MapPin, Calendar, User, Search, Plus, Info, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

type ReportingStatus = 'Reported' | 'Delayed report' | 'Unreported';

interface ReportableEvent {
  id: string;
  employeeId: string;
  category: string;
  description: string;
  status: ReportingStatus;
  autoDetected?: boolean;
}

export default function SponsorshipDutiesWorkflow() {
  const { employees } = useAuditStore();
  const [events, setEvents] = useState<ReportableEvent[]>([]);

  // Auto-detect events based on logic
  useEffect(() => {
    const detected: ReportableEvent[] = [];
    
    employees.forEach(emp => {
      // 1. Delayed work start date
      if (emp.cosDetails && emp.payrollOnboardingDate) {
        const cosStart = new Date(emp.cosDetails.workStartDate);
        const payrollStart = new Date(emp.payrollOnboardingDate);
        if (payrollStart > cosStart) {
          detected.push({
            id: Math.random().toString(),
            employeeId: emp.id,
            category: 'Delayed work start date',
            description: `Payroll onboarding (${emp.payrollOnboardingDate}) is after COS start date (${emp.cosDetails.workStartDate}).`,
            status: 'Unreported',
            autoDetected: true
          });
        }
      }

      // 2. Checklist items from Workflow 1
      const categoriesToCheck = [
        { key: 'Unauthorized Absence', category: 'Unauthorized Absence' },
        { key: 'Work Location changed', category: 'Work Location change' },
        { key: 'Statutory Leaves', category: 'Statutory Leave' }
      ];

      categoriesToCheck.forEach(cat => {
        if (emp.documents[cat.key] === 'present') {
          detected.push({
            id: Math.random().toString(),
            employeeId: emp.id,
            category: cat.category,
            description: `Event identified during personnel dossier checklist validation.`,
            status: 'Unreported',
            autoDetected: true
          });
        }
      });
    });

    setEvents(detected);
  }, [employees]);

  const updateEventStatus = (id: string, status: ReportingStatus) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    toast.success('Reporting status updated');
  };

  const getComplianceIcon = (status: ReportingStatus) => {
    if (status === 'Reported') return <CheckCircle2 className="text-green-500" size={18} />;
    if (status === 'Delayed report') return <AlertTriangle className="text-red-500" size={18} />;
    return <XCircle className="text-red-500" size={18} />;
  };

  const isCompliant = (status: ReportingStatus) => status === 'Reported';

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex flex-col gap-2">
        <h3 className="text-[18px] font-extrabold text-[#111827]">Workflow 5: Sponsorship Duties Duties</h3>
        <p className="text-[13px] text-gray-400 font-medium italic italic">Tracking and reporting changes in employee circumstances as per UKVI requirements.</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Events Feed */}
        <div className="flex flex-col gap-4">
           {events.map((event) => {
             const emp = employees.find(e => e.id === event.employeeId);
             return (
               <div key={event.id} className={`p-8 bg-white rounded-[2.5rem] border transition-all duration-300 flex flex-col lg:flex-row items-center justify-between gap-8
                 ${isCompliant(event.status) ? 'border-green-100' : 'border-red-100 ring-4 ring-red-50/30'}
               `}>
                 <div className="flex items-center gap-6 flex-1">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white
                      ${event.category.includes('Delayed') ? 'bg-orange-500 shadow-orange-100' :
                        event.category.includes('Absence') ? 'bg-red-500 shadow-red-100' : 'bg-[#0852C9] shadow-blue-100'}
                    `}>
                       {event.category.includes('Delayed') ? <Timer size={24} /> :
                        event.category.includes('Location') ? <MapPin size={24} /> : <Calendar size={24} />}
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">{event.category}</span>
                          {event.autoDetected && <span className="text-[9px] bg-blue-50 text-[#0852C9] px-2 py-0.5 rounded font-black uppercase">Auto-Detected</span>}
                       </div>
                       <div className="text-[18px] font-black text-gray-900 tracking-tight">{emp?.fullName}</div>
                       <p className="text-[12px] text-gray-500 font-medium max-w-md">{event.description}</p>
                    </div>
                 </div>

                 <div className="flex flex-col lg:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                       {(['Reported', 'Delayed report', 'Unreported'] as ReportingStatus[]).map((status) => (
                         <button
                           key={status}
                           onClick={() => updateEventStatus(event.id, status)}
                           className={`px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all
                             ${event.status === status 
                               ? status === 'Reported' ? 'bg-green-500 text-white' : 'bg-red-500 text-white shadow-lg shadow-red-100'
                               : 'text-gray-400 hover:bg-white hover:text-gray-900'}
                           `}
                         >
                           {status}
                         </button>
                       ))}
                    </div>

                    <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-2xl border border-gray-100 min-w-[160px] justify-center">
                       {getComplianceIcon(event.status)}
                       <span className={`text-[12px] font-black uppercase ${isCompliant(event.status) ? 'text-green-600' : 'text-red-600'}`}>
                          {isCompliant(event.status) ? 'Compliant' : 'Non-Compliance'}
                       </span>
                    </div>
                 </div>
               </div>
             );
           })}

           {events.length === 0 && (
             <div className="py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center text-gray-300">
                <ShieldCheck size={48} className="mb-4 opacity-20" />
                <p className="text-[15px] font-black uppercase tracking-widest">Awaiting reporting events</p>
                <p className="text-[12px] font-medium">Any changes in staff circumstances will trigger detection here.</p>
             </div>
           )}
        </div>

        {/* Manual Addition */}
        <div className="mt-4 flex flex-col gap-4">
           <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-4">Advanced Reporting</div>
           <button className="flex items-center gap-3 px-8 py-5 bg-white border-2 border-dashed border-gray-200 rounded-3xl text-[14px] font-bold text-gray-400 hover:border-[#0852C9] hover:text-[#0852C9] transition-all group">
              <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                 <Plus size={20} />
              </div>
              <span>Manually write for any changes (Reporting Duty)</span>
           </button>
        </div>
      </div>
    </div>
  );
}
