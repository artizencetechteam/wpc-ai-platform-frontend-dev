'use client';

import React, { useEffect, useState } from 'react';
import { useAuditStore } from '@/app/store/auditStore';
import { LayoutDashboard, Users, FileText, ClipboardCheck, Wallet, ShieldAlert, ChevronRight, ArrowLeft } from 'lucide-react';
import EvaluationSteps from './_components/EvaluationSteps';
import { listPostComplianceAuditsAction, createPostComplianceAuditAction } from '@/app/employer/sections/action/action';
import toast from 'react-hot-toast';

// Step 1 Sub-pages
import RecruitmentDocsStep from './_components/steps/RecruitmentDocsStep';
import RTWCheckStep from './_components/steps/RTWCheckStep';

// Workflows
import DossierWorkflow from './_components/workflows/DossierWorkflow';
import RecruitmentFlowLogic from './_components/workflows/RecruitmentFlowLogic';
import RTWComplianceLogic from './_components/workflows/RTWComplianceLogic';
import PayrollWorkflow from './_components/workflows/PayrollWorkflow';
import SponsorshipDutiesWorkflow from './_components/workflows/SponsorshipDutiesWorkflow';
import HRDocumentsWorkflow from './_components/workflows/HRDocumentsWorkflow';
import ReportGeneration from './_components/ReportGeneration';
import StaffListStep from './_components/steps/StaffListStep';

const MAIN_STEPS = [
  'Onboarding & Setup',
  'Personnel Dossier',
  'Recruitment Flow',
  'RTW Compliance',
  'C&B Audit',
  'Sponsorship Duties',
  'HR Documents',
  'Final Report',
];

export default function PostRolePage() {
  const { currentStep, currentSubPage, setStep, employees, auditId, auditDate, setAuditId } = useAuditStore();
  const [mounted, setMounted] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setMounted(true);
    initAudit();
  }, []);

  const initAudit = async () => {
    try {
      // First try to list existing audits
      const listRes = await listPostComplianceAuditsAction();
      if (listRes.success && listRes.data && listRes.data.length > 0) {
        // Use the most recent audit
        const sorted = [...listRes.data].sort((a, b) => b.id - a.id);
        setAuditId(sorted[0].id, sorted[0].date_created);
      } else {
        // Create a new audit
        let userId: number | null = null;
        try {
          const raw = document.cookie
            .split('; ')
            .find((r) => r.startsWith('user-info='))
            ?.split('=')
            .slice(1)
            .join('=');
          if (raw) {
            const parsed = JSON.parse(decodeURIComponent(raw));
            userId = parsed?.id ?? null;
          }
        } catch { /* ignore */ }

        if (userId) {
          const createRes = await createPostComplianceAuditAction(userId);
          if (createRes.success && createRes.data) {
            setAuditId(createRes.data.id, createRes.data.date_created);
          } else {
            toast.error('Failed to initialize audit.');
          }
        } else {
          toast.error('User session invalid. Please login again.');
        }
      }
    } catch (error) {
      console.error('Failed to init audit:', error);
      toast.error('Error initializing audit.');
    } finally {
      setInitializing(false);
    }
  };

  if (!mounted || initializing) return null;

  const handleNext = () => {
    // Logic for transitioning between sub-pages and main steps
    if (currentStep === 0 && currentSubPage < 2) {
      setStep(0, currentSubPage + 1);
    } else if (currentStep < MAIN_STEPS.length - 1) {
      setStep(currentStep + 1, 0);
    }
  };

  const handleBack = () => {
    if (currentStep === 0 && currentSubPage > 0) {
      setStep(0, currentSubPage - 1);
    } else if (currentStep > 0) {
      setStep(currentStep - 1, 0);
    }
  };

  const renderContent = () => {
    if (currentStep === 0) {
      switch (currentSubPage) {
        case 0: return <StaffListStep />;
        case 1: return <RecruitmentDocsStep />;
        case 2: return <RTWCheckStep />;
        default: return null;
      }
    }

    switch (currentStep) {
      case 1: return <DossierWorkflow />;
      case 2: return <RecruitmentFlowLogic />;
      case 3: return <RTWComplianceLogic />;
      case 4: return <PayrollWorkflow />;
      case 5: return <SponsorshipDutiesWorkflow />;
      case 6: return <HRDocumentsWorkflow />;
      case 7: return <ReportGeneration />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFEFF] p-6 lg:p-10 font-inter">
      <div className="max-w-[1500px] mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-[26px] font-black text-[#111827] tracking-tighter flex items-center gap-3">
              <ShieldAlert className="text-[#0852C9]" size={28} />
              Post Compliance Audit
            </h1>
            <p className="text-[13px] text-gray-500 mt-1 font-medium">
              Comprehensive compliance verification, AI extraction, and reporting engine.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end mr-4">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Active Audit</span>
                <span className="text-[14px] font-bold text-gray-900">REF: AUD-{auditDate ? new Date(auditDate).getFullYear() : new Date().getFullYear()}-{auditId ? String(auditId).padStart(3, '0') : '001'}</span>
             </div>
             <div className="w-10 h-10 rounded-2xl bg-[#0852C9] flex items-center justify-center shadow-lg shadow-blue-100">
                <FileText className="text-white" size={20} />
             </div>
          </div>
        </div>

        {/* Horizontal Stepper Top */}
        <EvaluationSteps currentStep={currentStep} steps={MAIN_STEPS} />

        {/* Workflow Canvas */}
        <main className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 min-h-[700px] flex flex-col justify-between">
          <div className="w-full">
             {/* Sub-step indicator for Step 1 */}
             {currentStep === 0 && (
               <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-4">
                  {['Staff List', 'Recruitment Docs', 'RTW Upload'].map((name, i) => (
                    <div 
                      key={name}
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-300 whitespace-nowrap
                        ${currentSubPage === i 
                          ? 'bg-[#0852C9] border-[#0852C9] text-white shadow-lg shadow-blue-100' 
                          : i < currentSubPage 
                            ? 'bg-green-50 border-green-100 text-green-600'
                            : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60'}
                      `}
                    >
                      <span className="text-[12px] font-black uppercase tracking-widest">{name}</span>
                      {i < currentSubPage && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                    </div>
                  ))}
               </div>
             )}

            {renderContent()}
          </div>

            {/* Global Actions */}
            <div className="flex items-center justify-between pt-10 border-t border-gray-50 mt-16">
              <button
                onClick={handleBack}
                className="flex items-center gap-3 px-8 py-4 text-[15px] font-black text-gray-500 bg-white border-2 border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-95 group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back
              </button>
              
              <div className="flex items-center gap-5">
                <button
                  className="px-8 py-4 text-[15px] font-black text-gray-400 hover:text-[#0852C9] transition-all"
                >
                  Quick Save
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-3 px-10 py-4 text-[15px] font-black text-white bg-[#0852C9] rounded-2xl hover:bg-[#0644A8] shadow-2xl shadow-blue-200 transition-all active:scale-95 group"
                >
                  {currentStep === MAIN_STEPS.length - 1 ? 'Generate Final Audit' : 'Continuue Workflow'}
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
  );
}
