'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HRValidationTabs from "../_components/HRValidationTabs";
import { updateHRValidationRecordAction, updateEmployeeAction, listEmployeesAction, listHRValidationRecordsAction } from "@/app/employer/sections/action/action";
import { getClientToken } from "@/app/employer/sections/company/page";

const SpinnerIcon = ({ color = "#0852C9" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="10" cy="10" r="8" stroke="#CBD5E1" strokeWidth="2.5" />
    <path d="M10 2a8 8 0 018 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tab {
  label: string;
  id: string;
}

interface Employee {
  id: string | number;
  employee_full_name: string;
  [key: string]: any;
}

interface Progress {
  [key: string]: boolean;
}

interface Creds {
  seniorMost: boolean;
  director: boolean;
  onPayroll: boolean;
  holdsShares: boolean;
}

interface AOStatusResult {
  ok: boolean;
  reason: string | null;
}

interface CredItem {
  key: keyof Creds;
  label: string;
  desc: string;
}

interface SelectOption {
  id: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────



// ─── Session helpers ──────────────────────────────────────────────────────────

const getProgress = (): Progress => {
  try { return JSON.parse(sessionStorage.getItem("hr_progress") || "{}"); } catch { return {}; }
};

const markComplete = (key: string): void => {
  try {
    const p = getProgress();
    sessionStorage.setItem("hr_progress", JSON.stringify({ ...p, [key]: true }));
  } catch {}
};

const isTabUnlocked = (tabId: string): boolean => {
  if (tabId === "company") return true;
  const rid = typeof window !== "undefined" ? sessionStorage.getItem("current_hr_record_id") : null;
  const hasCompany = !!(rid && sessionStorage.getItem(`company_name_${rid}`));
  if (["staff", "rtw", "pension", "auth"].includes(tabId)) return hasCompany;
  const p = getProgress();
  if (tabId === "contracts") return !!p.auth && hasCompany;
  if (tabId === "financial") return !!p.contracts && hasCompany;
  if (tabId === "summary") return !!p.financial && hasCompany;
  return false;
};

// ─── AO status logic ─────────────────────────────────────────────────────────

function getAOStatus(creds: Creds): AOStatusResult | null {
  const { seniorMost, director, onPayroll, holdsShares } = creds;

  if (seniorMost) return { ok: true, reason: "Senior-most employee responsible for recruitment" };
  if (director && onPayroll) return { ok: true, reason: "Director on payroll" };
  if (director && holdsShares) return { ok: true, reason: "Director holding shares" };
  if (onPayroll && holdsShares) return { ok: true, reason: "Senior management employee on payroll" };

  if (director && !onPayroll && !holdsShares) return { ok: false, reason: null };
  if (Object.values(creds).every((v) => !v)) return null;
  return { ok: false, reason: null };
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const ShieldIcon = (): React.JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L3 5v5c0 4.418 3.134 7.891 7 8.944C16.866 17.891 20 14.418 20 10V5l-7-3H10z" stroke="#374151" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
  </svg>
);

const PersonSelectIcon = (): React.JSX.Element => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="11" r="5" stroke="#0852C9" strokeWidth="1.8" fill="none" />
    <path d="M4 25c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#0852C9" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);

const PlusIcon = (): React.JSX.Element => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M14 6v16M6 14h16" stroke="#0852C9" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const GreenCircleCheck = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="7" stroke="#16A34A" strokeWidth="1.4" fill="none" />
    <path d="M5 8l2 2 4-4" stroke="#16A34A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RedCircleX = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="7" stroke="#DC2626" strokeWidth="1.4" fill="none" />
    <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#DC2626" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// ─── TopNav ───────────────────────────────────────────────────────────────────

interface TopNavProps {
  onBack: () => void;
  onTabClick: (tabId: string) => void;
}

function TopNav({ onBack }: { onBack: () => void }) {
  const [recordId, setRecordId] = useState<string | null>(null);
  useEffect(() => {
    setRecordId(sessionStorage.getItem("current_hr_record_id"));
  }, []);
  return <HRValidationTabs currentTabId="auth" hrRecordId={recordId} onBack={onBack} />;
}

// ─── AOCriteriaBox ────────────────────────────────────────────────────────────

function AOCriteriaBox(): React.JSX.Element {
  return (
    <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "22px 26px" }}>
      <p style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>Acceptable AO Criteria:</p>
      {[
        "Senior-most employee responsible for recruitment",
        "Director on payroll",
        "Director holding shares",
        "Senior management employee on payroll",
      ].map((c) => (
        <div key={c} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <GreenCircleCheck />
          <span style={{ fontSize: "13.5px", color: "#374151" }}>{c}</span>
        </div>
      ))}
      <div style={{ borderTop: "1px solid #E2E8F0", marginTop: "12px", paddingTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <RedCircleX />
        <span style={{ fontSize: "13.5px", color: "#DC2626", fontWeight: "500" }}>
          Not Acceptable: Director not on payroll AND holding no shares
        </span>
      </div>
    </div>
  );
}

// ─── CredRow ──────────────────────────────────────────────────────────────────

interface CredRowProps {
  label: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}

function CredRow({ label, desc, checked, onChange }: CredRowProps): React.JSX.Element {
  return (
    <div
      onClick={onChange}
      style={{
        display: "flex", alignItems: "flex-start", gap: "12px",
        padding: "14px 16px", borderRadius: "8px", marginBottom: "10px",
        border: `1.5px solid ${checked ? "#0852C9" : "#E2E8F0"}`,
        backgroundColor: checked ? "#F0F6FF" : "white", cursor: "pointer",
      }}
    >
      <div style={{
        width: "18px", height: "18px", borderRadius: "4px", flexShrink: 0, marginTop: "1px",
        border: `2px solid ${checked ? "#0852C9" : "#D1D5DB"}`,
        backgroundColor: checked ? "#0852C9" : "white",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {checked && (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 5.5l2.5 2.5L9 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div>
        <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#0F172A" }}>{label}</div>
        <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>{desc}</div>
      </div>
    </div>
  );
}

// ─── AODetailsForm ────────────────────────────────────────────────────────────

interface AODetailsFormProps {
  mode: string;
  employees: Employee[];
  initialData?: {
    id?: number | string;
    name?: string;
    role?: string;
    creds?: Creds;
  };
  onValidate: (status: AOStatusResult | null, data?: { id?: number | string; role: string; creds: Creds }) => void;
  onContinue: () => void;
  onChangeMode: () => void;
}

function AODetailsForm({ mode, employees, initialData, onValidate, onContinue, onChangeMode }: AODetailsFormProps): React.JSX.Element {
  const [selectedEmp, setSelectedEmp] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [creds, setCreds] = useState<Creds>({ seniorMost: false, director: false, onPayroll: false, holdsShares: false });
  const [validated, setValidated] = useState<boolean>(false);

  // Populate from initialData on mount or when initialData changes
  useEffect(() => {
    if (initialData) {
      if (initialData.name) {
        setName(initialData.name);
        if (mode === "staff") setSelectedEmp(initialData.name);
      }
      if (initialData.role) setRole(initialData.role);
      if (initialData.creds) setCreds(initialData.creds);
      setValidated(true);
    }
  }, [initialData, mode]);

  const toggleCred = (key: keyof Creds): void => {
    setCreds((prev) => ({ ...prev, [key]: !prev[key] }));
    setValidated(false);
  };

  const handleEmpChange = (empName: string): void => {
    setSelectedEmp(empName);
    setName(empName);
    setValidated(false);
    
    // Check if this employee already has AO data
    const emp = employees.find(e => e.employee_full_name === empName);
    if (emp) {
      setRole(emp.role_in_company || "");
      setCreds({
        seniorMost: !!emp.AO_Credentials_senior_most_employee,
        director: !!emp.AO_Credentials_company_director,
        onPayroll: !!emp.AO_Credentials_on_payroll,
        holdsShares: !!emp.AO_Credentials_holds_shared,
      });
    } else {
      setCreds({ seniorMost: false, director: false, onPayroll: false, holdsShares: false });
    }
  };

  const status = getAOStatus(creds);

  const handleValidate = (): void => {
    setValidated(true);
    const empId = mode === "staff" ? employees.find(e => e.employee_full_name === name)?.id : undefined;
    onValidate(status, { id: empId, role, creds });
  };

  const credList: CredItem[] = [
    { key: "seniorMost", label: "Senior-most employee", desc: "Responsible for recruitment decisions" },
    { key: "director", label: "Director", desc: "Listed as company director" },
    { key: "onPayroll", label: "On Payroll", desc: "Receives regular salary from the company" },
    { key: "holdsShares", label: "Holds Shares", desc: "Has shareholding in the company" },
  ];

  const nameValid = name.trim().length > 0;
  const roleValid = role.trim().length > 0;
  const canValidate = nameValid && roleValid;

  const selectedEmployeeObj = mode === "staff" ? employees.find(e => e.employee_full_name === selectedEmp) : null;

  return (
    <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px 26px", marginBottom: "16px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldIcon />
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0F172A" }}>Authorising Officer Details</h3>
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748B" }}>
              {mode === "staff" ? "Select an employee and verify their credentials" : "Enter the new AO's details"}
            </p>
          </div>
        </div>
        <button onClick={onChangeMode} style={{ background: "none", border: "none", cursor: "pointer", color: "#0852C9", fontSize: "13.5px", fontWeight: "600" }}>
          Change
        </button>
      </div>

      {/* Employee select (staff mode) */}
      {mode === "staff" && (
        <div style={{ marginBottom: "16px" }}>
          <label style={lbl}>Select Employee</label>
          <div style={{ position: "relative" }}>
            <select
              value={selectedEmp}
              onChange={(e) => handleEmpChange(e.target.value)}
              style={{ ...inputStyle, appearance: "none", paddingRight: "36px" }}
            >
              <option value="">-- Select employee --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.employee_full_name}>{e.employee_full_name}</option>
              ))}
            </select>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <path d="M3 5l4 4 4-4" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          {selectedEmployeeObj && (
            <div style={{ marginTop: "6px", fontSize: "12px", color: "#64748B", display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: selectedEmployeeObj.status === "approved" ? "#16A34A" : "#F59E0B" }} />
              Current Status: <span style={{ fontWeight: "600", color: "#0F172A" }}>{selectedEmployeeObj.status || "Pending"}</span>
            </div>
          )}
        </div>
      )}

      {/* Full Name */}
      <div style={{ marginBottom: "16px" }}>
        <label style={lbl}>Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setValidated(false); }}
          placeholder={mode === "staff" ? "" : "Enter full name"}
          readOnly={mode === "staff" && !!selectedEmp}
          style={{ ...inputStyle, backgroundColor: (mode === "staff" && !!selectedEmp) ? "#F8FAFC" : "white", color: "#6B7280" }}
        />
      </div>

      {/* Role */}
      <div style={{ marginBottom: "20px" }}>
        <label style={lbl}>Role / Position</label>
        <input
          type="text"
          value={role}
          onChange={(e) => { setRole(e.target.value); setValidated(false); }}
          placeholder="Enter role or position"
          style={{ ...inputStyle, borderColor: role.trim() ? "#D1D5DB" : role === "" ? "#D1D5DB" : "#FCA5A5" }}
        />
      </div>

      {/* Credentials */}
      <p style={{ margin: "0 0 12px", fontSize: "13.5px", fontWeight: "600", color: "#0F172A" }}>AO Credentials</p>
      {credList.map((c) => (
        <CredRow key={c.key} label={c.label} desc={c.desc} checked={creds[c.key]} onChange={() => toggleCred(c.key)} />
      ))}

      {/* Validation result */}
      {validated && status !== null && (
        <div style={{ marginTop: "12px" }}>
          {status.ok ? (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "10px",
              padding: "14px 16px", backgroundColor: "#F0FDF4",
              borderRadius: "8px", border: "1.5px solid #86EFAC",
            }}>
              <GreenCircleCheck />
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#166534" }}>AO Acceptable</div>
                <div style={{ fontSize: "13px", color: "#166534", marginTop: "2px" }}>✓ {status.reason}</div>
              </div>
            </div>
          ) : (
            <div style={{
              padding: "14px 16px", backgroundColor: "#FFF5F5",
              borderRadius: "8px", border: "1.5px solid #FCA5A5",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <RedCircleX />
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#DC2626" }}>AO Not Acceptable</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <button
          onClick={handleValidate}
          disabled={!canValidate}
          style={{
            width: "100%", padding: "13px", backgroundColor: "#0852C9",
            color: "white", border: "none", borderRadius: "8px",
            fontSize: "14px", fontWeight: "600", cursor: canValidate ? "pointer" : "not-allowed",
            opacity: canValidate ? 1 : 0.5,
          }}
        >
          Validate Authorising Officer
        </button>

        <button
          onClick={onContinue}
          style={{
            width: "100%", padding: "13px", 
            backgroundColor: (validated && status?.ok) ? "#0852C9" : "white",
            color: (validated && status?.ok) ? "white" : "#374151",
            border: (validated && status?.ok) ? "none" : "1.5px solid #D1D5DB",
            borderRadius: "8px",
            fontSize: "14px", fontWeight: "600", cursor: "pointer",
          }}
        >
          {(validated && status?.ok) ? "Continue to Contract Validation" : "Skip / Continue Anyway"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuthorisingOfficer() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>}>
      <AuthorisingOfficerImpl />
    </Suspense>
  );
}

function AuthorisingOfficerImpl(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [mode, setMode] = useState<string | null>(null);
  const [aoStatus, setAOStatus] = useState<AOStatusResult | null>(null);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [aoData, setAoData] = useState<{ id?: number | string; role?: string; creds?: Creds } | null>(null);

  useEffect(() => {
    const queryId = searchParams.get("recordId") || searchParams.get("id");
    const id = queryId || sessionStorage.getItem("current_hr_record_id");
    if (id) {
      const numId = Number(id);
      setRecordId(numId);
      loadEmployees(numId);

      // Hydrate AO state from server
      (async () => {
        try {
          const token = getClientToken();
          const res = await listHRValidationRecordsAction(token);
          if (res.success && res.data) {
            const record = res.data.find((r) => r.id === numId);
            if (record && record.result_complete_sections) {
              const saved = record.result_complete_sections;
              if (saved.ao_mode) setMode(saved.ao_mode);
              if (saved.ao_status) setAOStatus(saved.ao_status);
            }
          }
        } catch (err) {
          console.error("Error hydrating AO state:", err);
        }
      })();
    }

    try {
      const saved = sessionStorage.getItem("hr_employees");
      if (saved) setEmployees(JSON.parse(saved) as Employee[]);
    } catch {}
  }, [searchParams]);

  async function loadEmployees(recordId: number) {
    try {
      const token = getClientToken();
      const res = await listEmployeesAction(recordId, token);
      if (res.success && res.data) {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error("Error loading employees in AO:", err);
    }
  }

  const handleTabClick = (tabId: string) => {
    if (tabId === "auth") return;
  };

  const handleContinue = async (): Promise<void> => {
    markComplete("auth");

    if (recordId) {
      const token = getClientToken();
      
      // 1. Save record status
      await updateHRValidationRecordAction(recordId, {
        result_complete_sections: {
          ...(await getSavedResults(recordId)),
          ao_status: aoStatus,
          ao_mode: mode,
        }
      }, token);

      // 2. Save employee AO data if applicable
      if (aoData && aoData.id) {
        await updateEmployeeAction(Number(aoData.id), {
          role_in_company: aoData.role,
          AO_Credentials_senior_most_employee: !!aoData.creds?.seniorMost,
          AO_Credentials_company_director: !!aoData.creds?.director,
          AO_Credentials_on_payroll: !!aoData.creds?.onPayroll,
          AO_Credentials_holds_shared: !!aoData.creds?.holdsShares,
        }, token);
      }
    }

    router.push(`/employer/sections/contracts?recordId=${recordId}`);
  };

  async function getSavedResults(id: number) {
    try {
      const token = getClientToken();
      const res = await listHRValidationRecordsAction(token);
      if (res.success && res.data) {
        const record = res.data.find(r => r.id === id);
        return record?.result_complete_sections || {};
      }
      return {};
    } catch { return {}; }
  }

  const selectOptions: SelectOption[] = [
    { id: "staff", icon: <PersonSelectIcon />, title: "Select from Staff", desc: "Choose an existing employee as Authorising Officer" },
    { id: "new", icon: <PlusIcon />, title: "Add New Individual", desc: "Add a new person as Authorising Officer" },
  ];

  const initialAO = employees.find(e =>
    e.role_in_company ||
    e.AO_Credentials_senior_most_employee ||
    e.AO_Credentials_company_director ||
    e.AO_Credentials_on_payroll ||
    e.AO_Credentials_holds_shared
  );

  const initialFormData = initialAO ? {
    id: initialAO.id,
    name: initialAO.employee_full_name,
    role: initialAO.role_in_company || "",
    creds: {
      seniorMost: !!initialAO.AO_Credentials_senior_most_employee,
      director: !!initialAO.AO_Credentials_company_director,
      onPayroll: !!initialAO.AO_Credentials_on_payroll,
      holdsShares: !!initialAO.AO_Credentials_holds_shared,
    }
  } : undefined;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", backgroundColor: "#F1F5F9", minHeight: "100vh" }}>

      <TopNav onBack={() => router.back()} />

      <div style={{ maxWidth: "860px", margin: "30px auto", padding: "0 24px" }}>

        {/* Page heading */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.3px" }}>
            Workflow 3: Authorising Officer Assessment
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: "13.5px", color: "#64748B" }}>
            Select and validate the Authorising Officer for sponsor licence compliance
          </p>
        </div>

        {/* Mode selection or form */}
        {!mode ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              {selectOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setMode(opt.id)}
                  style={{
                    backgroundColor: "white", border: "1.5px solid #E2E8F0",
                    borderRadius: "10px", padding: "28px 24px", textAlign: "left",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = "#0852C9"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(8,82,201,0.08)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ width: "44px", height: "44px", borderRadius: "10px", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                    {opt.icon}
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", marginBottom: "6px" }}>{opt.title}</div>
                  <div style={{ fontSize: "13px", color: "#64748B", lineHeight: "1.5" }}>{opt.desc}</div>
                </button>
              ))}
            </div>
            <AOCriteriaBox />
          </>
        ) : (
          <>
            <AODetailsForm
              mode={mode}
              employees={employees}
              initialData={initialFormData}
              onValidate={(status, data) => {
                setAOStatus(status);
                if (data) setAoData(data);
              }}
              onContinue={handleContinue}
              onChangeMode={() => { setMode(null); setAOStatus(null); setAoData(null); }}
            />
            <AOCriteriaBox />
          </>
        )}

        {/* Back button */}
        <div style={{ marginTop: "24px" }}>
          <button
            onClick={() => router.push(`/employer/sections/pension?recordId=${recordId}`)}
            style={{
              padding: "10px 20px", backgroundColor: "white", color: "#374151",
              border: "1.5px solid #D1D5DB", borderRadius: "8px",
              fontSize: "14px", fontWeight: "500", cursor: "pointer",
            }}
          >
            Back to Pension Compliance
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const lbl: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #D1D5DB", fontSize: "14px", outline: "none", boxSizing: "border-box", color: "#0F172A", backgroundColor: "white" };