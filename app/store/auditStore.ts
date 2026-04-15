import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type EmployeeType = 'Sponsored - New hire' | 'Sponsored – Existing staff' | 'Not Sponsored';
export type DocAvailability = 'n/a' | 'present' | 'missing';
export type RTWStatus = 'Available' | 'Not Available' | 'Not Required';
export type ComplianceStatus = 'Compliant' | 'Partially compliant' | 'Non-Compliant';

export interface AuditEmployee {
  id: string;
  type: EmployeeType;
  fullName: string;
  designation: string;
  workingHours: string;
  salaryRate: string;
  payrollOnboardingDate: string;
  cosDetails?: {
    workStartDate: string;
    workEndDate: string;
    cosAssignDate: string;
    sponsorNote: string;
    cosAssignDateRaw: string;
  };
  rtwStatus: RTWStatus;
  documents: Record<string, DocAvailability>;
  recruitmentDocs: {
    cvFile?: string;
    experienceLetters: string[];
    interviewDate?: string;
    expLetterValidationDate?: string;
    otherRelevantDates: string[];
  };
  remarks?: {
    observation: string;
    recommendation: string;
  };
}

export interface AuditState {
  companyAdded: boolean;
  employees: AuditEmployee[];
  currentStep: number;
  currentSubPage: number;
  
  // Actions
  addEmployee: (emp: Partial<AuditEmployee>) => void;
  updateEmployee: (id: string, updates: Partial<AuditEmployee>) => void;
  setStep: (step: number, subPage?: number) => void;
  resetAudit: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      companyAdded: false,
      employees: [],
      currentStep: 0,
      currentSubPage: 0,

      addEmployee: (emp) => set((state) => ({
        employees: [...state.employees, {
          id: crypto.randomUUID(),
          type: 'Not Sponsored',
          fullName: '',
          designation: '',
          workingHours: '',
          salaryRate: '',
          payrollOnboardingDate: '',
          rtwStatus: 'Not Available',
          documents: {},
          recruitmentDocs: { experienceLetters: [], otherRelevantDates: [] },
          ...emp
        } as AuditEmployee]
      })),

      updateEmployee: (id, updates) => set((state) => ({
        employees: state.employees.map(e => e.id === id ? { ...e, ...updates } : e)
      })),

      setStep: (step, subPage) => set({ 
        currentStep: step, 
        currentSubPage: subPage ?? 0 
      }),

      resetAudit: () => set({ 
        companyAdded: false, 
        employees: [], 
        currentStep: 0, 
        currentSubPage: 0 
      }),
    }),
    {
      name: 'post-compliance-audit-v2',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
