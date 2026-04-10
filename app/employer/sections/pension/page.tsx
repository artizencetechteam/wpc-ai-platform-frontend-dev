'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const tabs = [
  { label: "Staff List", id: "staff" },
  { label: "1. RTW Compliance", id: "rtw" },
  { label: "2. Pension", id: "pension" },
  { label: "3. Authorising Officer", id: "auth" },
  { label: "4. Contracts", id: "contracts" },
  { label: "5. Financial", id: "financial" },
  { label: "6. Summary", id: "summary" },
];



const PensionIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
    <rect x="2" y="3" width="18" height="16" rx="2" stroke="#374151" strokeWidth="1.5" fill="none" />
    <path d="M2 8h18M7 3v5M15 3v5" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 13h4M6 16h6" stroke="#374151" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const PersonIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="11" cy="8" r="3.5" stroke="#374151" strokeWidth="1.5" fill="none" />
    <path d="M4 19c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}>
    <path d="M8 2L1 14h14L8 2z" fill="none" stroke="#DC2626" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M8 7v3M8 12v.5" stroke="#DC2626" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M14 20V10M14 10l-5 5M14 10l5 5" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 22h18" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);



const getProgress = () => {
  try { return JSON.parse(sessionStorage.getItem("hr_progress") || "{}"); } catch { return {}; }
};

const markComplete = (key: string) => {
  try {
    const p = getProgress();
    sessionStorage.setItem("hr_progress", JSON.stringify({ ...p, [key]: true }));
  } catch {}
};

const isTabUnlocked = (tabId: string) => {
  if (tabId === "staff" || tabId === "rtw") return true;
  if (tabId === "pension") return true;
  const p = getProgress();
  if (tabId === "auth") return p.pension;
  if (tabId === "contracts") return p.auth;
  if (tabId === "financial") return p.contracts;
  if (tabId === "summary") return p.financial;
  return false;
};

type TopNavProps = {
  onBack: () => void;
  onTabClick: (tabId: string) => void;
};

function TopNav({ onBack, onTabClick }: TopNavProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{ backgroundColor: "white", borderBottom: "1px solid #E2E8F0", padding: "0 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "16px", paddingBottom: "2px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 15L8 10L13 5" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>HR Records Validation</h1>
          <div style={{ fontSize: "11.5px", color: "#94A3B8", marginTop: "1px" }}>V.03</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px", marginTop: "10px", paddingBottom: "12px", overflowX: "auto" }}>
        {tabs.map((tab) => {
          const isActive = tab.id === "pension";
          const unlocked = mounted ? isTabUnlocked(tab.id) : (tab.id === "staff" || tab.id === "rtw" || tab.id === "pension");
          return (
            <button key={tab.id} onClick={() => onTabClick(tab.id)} style={{
              padding: "6px 16px", borderRadius: "20px",
              border: isActive ? "none" : "1.5px solid #D1D5DB",
              cursor: unlocked && !isActive ? "pointer" : "default",
              fontSize: "13px", fontWeight: isActive ? "600" : "400",
              color: isActive ? "white" : "#374151",
              backgroundColor: isActive ? "#0852C9" : "white",
              whiteSpace: "nowrap", transition: "all 0.15s",
              boxShadow: isActive ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
            }}>{tab.label}</button>
          );
        })}
      </div>
    </div>
  );
}

type StepPillsProps = {
  activeStep: string;
  onStepClick: (step: string) => void;
  companyRegistered: string | null;
};

function StepPills({ activeStep, onStepClick, companyRegistered }: StepPillsProps) {
  const steps = [
    { id: "company", label: "1. Company Registration" },
    { id: "eligibility", label: "2. Employee Eligibility" },
  ];
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "22px" }}>
      {steps.map((s) => {
        const isActive = s.id === activeStep;
      
        const clickable = s.id === "company" || companyRegistered === "yes";
        return (
          <button key={s.id} onClick={() => clickable && onStepClick(s.id)} style={{
            padding: "6px 18px", borderRadius: "20px",
            border: isActive ? "none" : "1.5px solid #D1D5DB",
            cursor: clickable && !isActive ? "pointer" : "default",
            fontSize: "13px", fontWeight: isActive ? "600" : "400",
            color: isActive ? "white" : "#374151",
            backgroundColor: isActive ? "#0852C9" : "white",
            whiteSpace: "nowrap",
            boxShadow: isActive ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
          }}>{s.label}</button>
        );
      })}
    </div>
  );
}

type CompanyRegistrationStepProps = {
  value: string | null;
  onChange: (value: string) => void;
  onContinue: () => void;
};

function CompanyRegistrationStep({
  value,
  onChange,
  onContinue,
}: CompanyRegistrationStepProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const isYes = value === "yes";
  const isNo = value === "no";

  return (
    <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "28px 30px" }}>

      
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <PensionIcon />
        <h2 style={{ margin: 0, fontSize: "19px", fontWeight: "700", color: "#0F172A" }}>Company Pension Compliance</h2>
      </div>
      <p style={{ margin: "0 0 22px", fontSize: "13px", color: "#64748B" }}>Verify that the company is registered with a pension scheme</p>

      <p style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>Is the company registered with a pension scheme?</p>

      
      <div
        onClick={() => onChange("yes")}
        style={{
          display: "flex", alignItems: "flex-start", gap: "12px",
          padding: "16px 18px", borderRadius: "8px", marginBottom: "10px",
          border: `1.5px solid ${isYes ? "#0852C9" : "#E2E8F0"}`,
          backgroundColor: isYes ? "#F0F6FF" : "white", cursor: "pointer",
        }}
      >
        <div style={{
          width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0, marginTop: "1px",
          border: `2px solid ${isYes ? "#0852C9" : "#D1D5DB"}`,
          backgroundColor: isYes ? "#0852C9" : "white",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isYes && <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "white" }} />}
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>Yes</div>
          <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Company is registered with a qualifying pension scheme</div>
        </div>
      </div>

     
      <div
        onClick={() => onChange("no")}
        style={{
          display: "flex", alignItems: "flex-start", gap: "12px",
          padding: "16px 18px", borderRadius: "8px", marginBottom: "20px",
          border: `1.5px solid ${isNo ? "#0852C9" : "#E2E8F0"}`,
          backgroundColor: isNo ? "#F0F6FF" : "white", cursor: "pointer",
        }}
      >
        <div style={{
          width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0, marginTop: "1px",
          border: `2px solid ${isNo ? "#0852C9" : "#D1D5DB"}`,
          backgroundColor: isNo ? "#0852C9" : "white",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isNo && <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "white" }} />}
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>No</div>
          <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Company is not registered with a pension scheme</div>
        </div>
      </div>

     
      {isNo && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "10px",
          padding: "14px 16px", backgroundColor: "#FFF5F5",
          borderRadius: "8px", border: "1.5px solid #FCA5A5", marginBottom: "20px",
        }}>
          <AlertIcon />
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#DC2626", marginBottom: "3px" }}>Company Non-Compliant</div>
            <div style={{ fontSize: "13px", color: "#DC2626", lineHeight: "1.5" }}>
              The company must be registered with a pension scheme to proceed. Validation paused until registration is completed.
            </div>
          </div>
        </div>
      )}

     
      {isYes && (
        <div style={{ marginBottom: "20px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "13.5px", fontWeight: "500", color: "#374151" }}>
            Upload Pension Scheme Registration Evidence (Optional)
          </p>
          <input ref={inputRef} type="file" style={{ display: "none" }} onChange={(e) => setFileName(e.target.files?.[0]?.name || null)} />
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              border: "2px dashed #D1D5DB", borderRadius: "8px", padding: "28px 20px",
              textAlign: "center", cursor: "pointer", backgroundColor: "#F9FAFB",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}><UploadIcon /></div>
            <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>
              {fileName || "Upload registration certificate or confirmation letter"}
            </p>
          </div>
        </div>
      )}

     
      {value && (
        <button
          onClick={onContinue}
          style={{
            width: "100%", padding: "14px", backgroundColor: "#0852C9",
            color: "white", border: "none", borderRadius: "8px",
            fontSize: "14px", fontWeight: "600", cursor: "pointer",
          }}
        >
          {isNo ? "Save & Pause Validation" : "Continue to Employee Checks"}
        </button>
      )}
    </div>
  );
}


type Employee = {
  id: number;
  name: string;
};

type EmployeeEligibilityStepProps = {
  employees: Employee[];
  onComplete: () => void;
};

function EmployeeEligibilityStep({
  employees,
  onComplete,
}: EmployeeEligibilityStepProps) {

  const [checks, setChecks] = useState<Record<number, any>>({});

 const toggle = (empId: number, field: string) => {
  setChecks((prev) => {
    const current = prev[empId] || { age22: false, earnings10k: false, autoEnrolled: false, optedOut: false };
    return {
      ...prev,
      [empId]: {
        ...current,
        [field]: !current[field],
      },
    };
  });
};

 const getStatus = (c: any) => {
    const eligible = c.age22 && c.earnings10k;
    if (!eligible) return { label: "Not Eligible", bg: "#F3F4F6", color: "#6B7280", border: "#D1D5DB" };
    if (c.autoEnrolled) return { label: "Compliant", bg: "#DCFCE7", color: "#166534", border: "#86EFAC" };
    if (c.optedOut) return { label: "Opted Out", bg: "#FEF9C3", color: "#854D0E", border: "#FDE047" };
    return { label: "Non-Compliant", bg: "#FEE2E2", color: "#DC2626", border: "#FCA5A5", icon: true };
  };

  return (
    <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "28px 30px" }}>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <PersonIcon />
        <h2 style={{ margin: 0, fontSize: "19px", fontWeight: "700", color: "#0F172A" }}>Employee Pension Eligibility</h2>
      </div>
      <p style={{ margin: "0 0 22px", fontSize: "13px", color: "#64748B" }}>Check pension eligibility and enrollment status for each employee</p>

      
      <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden", marginBottom: "20px" }}>
       
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1.3fr 1.3fr 1fr 1.2fr",
          padding: "12px 16px", backgroundColor: "#F8FAFC",
          borderBottom: "1px solid #E2E8F0",
        }}>
          {["Employee", "Age 22+", "Earnings £10k+", "Auto Enrolled", "Opted Out", "Status"].map((h) => (
            <div key={h} style={{ fontSize: "13px", fontWeight: "500", color: "#64748B" }}>{h}</div>
          ))}
        </div>

       
        {employees.map((emp) => {
          const c = checks[emp.id] || {};
          const status = getStatus(c);
          return (
            <div key={emp.id} style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1.3fr 1.3fr 1fr 1.2fr",
              padding: "14px 16px", borderBottom: "1px solid #F1F5F9",
              alignItems: "center",
            }}>
              <div style={{ fontSize: "14px", fontWeight: "500", color: "#0F172A" }}>{emp.name}</div>
              {["age22", "earnings10k", "autoEnrolled", "optedOut"].map((field) => (
                <div key={field}>
                  <input
                    type="checkbox"
                    checked={!!c[field]}
                    onChange={() => toggle(emp.id, field)}
                    style={{
                      width: "18px", height: "18px", cursor: "pointer",
                      accentColor: "#0852C9",
                    }}
                  />
                </div>
              ))}
              <div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                  backgroundColor: status.bg, color: status.color,
                  border: `1px solid ${status.border}`,
                }}>
                  {status.icon && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1.5L1 10h10L6 1.5z" stroke={status.color} strokeWidth="1.2" fill="none" />
                      <path d="M6 5.5v2M6 9v.3" stroke={status.color} strokeWidth="1.1" strokeLinecap="round" />
                    </svg>
                  )}
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      
      <div style={{
        backgroundColor: "#F8FAFC", borderRadius: "8px", padding: "16px 18px", marginBottom: "20px",
      }}>
        <p style={{ margin: "0 0 10px", fontSize: "13.5px", fontWeight: "600", color: "#374151" }}>Eligibility Rules:</p>
        {[
          "Employees aged 22+ earning over £10,000/year must be auto-enrolled",
          "Opted-out employees should have opt-out evidence on file",
          "Eligible but not enrolled = Non-compliant",
        ].map((rule) => (
          <p key={rule} style={{ margin: "0 0 5px", fontSize: "13px", color: "#64748B" }}>• {rule}</p>
        ))}
      </div>

      
      <button
        onClick={onComplete}
        style={{
          width: "100%", padding: "14px", backgroundColor: "#0852C9",
          color: "white", border: "none", borderRadius: "8px",
          fontSize: "14px", fontWeight: "600", cursor: "pointer",
        }}
      >
        Complete Pension Validation
      </button>
    </div>
  );
}



export default function PensionCompliance() {
  const router = useRouter();
 const [employees, setEmployees] = useState<Employee[]>([]);
 const [step, setStep] = useState<string>("company");
const [companyRegistered, setCompanyRegistered] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("hr_employees");
      if (saved) setEmployees(JSON.parse(saved));
    } catch {}
  }, []);

  const handleTabClick = (tabId: string) => {
    if (tabId === "pension") return;
   const routes: Record<string, string> = {
  staff: "/employer/sections/hr-validation",
  rtw: "/employer/sections/hr-validation/rtw-compliance",
  auth: "/employer/sections/hr-validation/authorising-officer",
  contracts: "/employer/sections/hr-validation/contracts",
  financial: "/employer/sections/hr-validation/financial",
  summary: "/employer/sections/hr-validation/summary",
};
    if (!isTabUnlocked(tabId)) return;
    if (routes[tabId]) router.push(routes[tabId]);
  };

  const handleCompanyContinue = () => {
    if (companyRegistered === "yes") {
      setStep("eligibility");
    } else {
      
      router.push("/employer/sections/hr-validation");
    }
  };

  const handleComplete = () => {
    markComplete("pension");
    router.push("/employer/sections/authorising-officer");
  };

  const handleBack = () => router.back();

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", backgroundColor: "#F1F5F9", minHeight: "100vh" }}>

      <TopNav onBack={handleBack} onTabClick={handleTabClick} />

      <div style={{ maxWidth: "860px", margin: "30px auto", padding: "0 24px" }}>

       
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.3px" }}>
            Workflow 2: Pension Compliance
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: "13.5px", color: "#64748B" }}>
            Verify company pension registration and employee eligibility
          </p>
        </div>

     
        <StepPills
          activeStep={step}
          onStepClick={setStep}
          companyRegistered={companyRegistered}
        />

      
        {step === "company" ? (
          <CompanyRegistrationStep
            value={companyRegistered}
            onChange={setCompanyRegistered}
            onContinue={handleCompanyContinue}
          />
        ) : (
          <EmployeeEligibilityStep
            employees={employees}
            onComplete={handleComplete}
          />
        )}

        <div style={{ marginTop: "24px" }}>
          <button
            onClick={() => router.push("/employer/sections/rtw-compliance")}
            style={{
              padding: "10px 20px", backgroundColor: "white", color: "#374151",
              border: "1.5px solid #D1D5DB", borderRadius: "8px",
              fontSize: "14px", fontWeight: "500", cursor: "pointer",
            }}
          >
            Back to RTW Validation
          </button>
        </div>
      </div>
    </div>
  );
}