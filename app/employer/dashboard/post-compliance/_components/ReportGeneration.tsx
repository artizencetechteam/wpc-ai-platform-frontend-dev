'use client';

import React, { useState } from 'react';
import { useAuditStore } from '@/app/store/auditStore';
import { FileText, Download, Share2, ClipboardCheck, ShieldCheck, Printer, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportGeneration() {
  const { employees } = useAuditStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    toast.loading('AI is assembling the final compliance report...', { id: 'report' });
    
    setTimeout(() => {
        setIsGenerating(false);
        setReportReady(true);
        toast.dismiss('report');
        toast.success('Validation report generated successfully!');
    }, 2500);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="flex flex-col gap-2">
        <h3 className="text-[18px] font-extrabold text-[#111827]">Audit Phase: Final Report Generation</h3>
        <p className="text-[13px] text-gray-400 font-medium">Consolidating all evidentiary findings and automated logic decisions into a professional audit report.</p>
      </div>

      {!reportReady ? (
        <div className="flex flex-col items-center justify-center p-20 bg-blue-50/30 rounded-[3rem] border-2 border-dashed border-blue-100 text-center gap-6">
           <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-blue-100/50 border border-blue-100">
              <ClipboardCheck className="text-[#0852C9]" size={40} />
           </div>
           <div className="max-w-md">
              <h4 className="text-[20px] font-black text-gray-900 mb-2">Audit Complete</h4>
              <p className="text-[14px] text-gray-500 font-medium leading-relaxed">
                All 6 workflows have been completed. The AI engine is ready to synthesize the findings for {employees.length} employees into a final report.
              </p>
           </div>
           <button 
            disabled={isGenerating}
            onClick={handleGenerate}
            className="px-12 py-5 bg-[#0852C9] text-white rounded-2xl text-[16px] font-black shadow-2xl shadow-blue-200 hover:bg-[#0644A8] transition-all active:scale-95 flex items-center gap-3"
           >
              {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck size={20} />}
              {isGenerating ? 'Compiling Report...' : 'Generate Compliance Report'}
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Report Preview Card */}
           <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-10 flex flex-col gap-8">
              <div className="flex items-center justify-between border-b border-gray-50 pb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-100">
                       <FileText size={28} />
                    </div>
                    <div>
                       <div className="text-[11px] font-black text-green-600 uppercase tracking-widest leading-none mb-1">Status: Finalized</div>
                       <h4 className="text-[22px] font-black text-gray-900 tracking-tight">Audit_Report_2024_04.pdf</h4>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button className="p-3 bg-gray-50 text-gray-400 hover:text-[#0852C9] rounded-xl transition-all"><Printer size={20} /></button>
                    <button className="p-3 bg-gray-50 text-gray-400 hover:text-[#0852C9] rounded-xl transition-all"><Share2 size={20} /></button>
                 </div>
              </div>

              <div className="flex flex-col gap-6">
                 <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: 'Audit Reference', value: 'WPC-PC-8829' },
                        { label: 'Date Generated', value: new Date().toLocaleDateString() },
                        { label: 'Scope', value: `${employees.length} Staff Members` },
                        { label: 'Compliance Level', value: 'High/Satisfactory' }
                    ].map(stat => (
                        <div key={stat.label} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                           <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
                           <div className="text-[14px] font-black text-gray-900">{stat.value}</div>
                        </div>
                    ))}
                 </div>
                 
                 <div className="p-6 bg-green-50/50 rounded-3xl border border-green-100 flex items-start gap-4">
                    <div className="p-2 bg-green-500 rounded-lg text-white shrink-0"><CheckCircle2 size={16} /></div>
                    <p className="text-[13px] font-medium text-green-800 leading-relaxed">
                       Your post-compliance audit has been synthesized. The report includes all personnel dossier checks, recruitment timelines, and payroll outflows verification.
                    </p>
                 </div>
              </div>

              <button className="w-full py-5 bg-gray-900 text-white rounded-2xl text-[15px] font-black shadow-xl flex items-center justify-center gap-3 hover:bg-black transition-all">
                 <Download size={20} />
                 Download Full Audit Report (.PDF)
              </button>
           </div>

           {/* Next Steps Sidebar */}
           <div className="flex flex-col gap-6">
              <div className="bg-[#0852C9] p-8 rounded-[2.5rem] text-white flex flex-col gap-6 shadow-2xl shadow-blue-100">
                 <h5 className="text-[18px] font-black tracking-tight">Post-Audit Actions</h5>
                 <div className="flex flex-col gap-4">
                    {[
                        'Share with HR Manager',
                        'Upload to UKVI Sponsor Management System',
                        'Schedule Remediation Review'
                    ].map((action, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all cursor-pointer">
                           <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-black">{i+1}</div>
                           <span className="text-[13px] font-bold">{action}</span>
                        </div>
                    ))}
                 </div>
              </div>

              <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col gap-4">
                 <p className="text-[12px] font-bold text-gray-400 leading-relaxed">
                    By downloading this report, you acknowledge that all observations were verified against physical or digital evidentiary artifacts.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
