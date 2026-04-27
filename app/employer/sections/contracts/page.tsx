'use client';

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HRValidationTabs from "../_components/HRValidationTabs";
import { updateHRValidationRecordAction, listHRValidationRecordsAction } from "@/app/employer/sections/action/action";
import { getClientToken } from "@/app/employer/sections/company/page";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tab {
  label: string;
  id: string;
}

interface Progress {
  [key: string]: boolean;
}

interface Contract {
  id: number;
  clientName: string;
  exists: "yes" | "no";
  aligns: "yes" | "no" | null;
  document: string | null;
}

type ContractStatus = "pass" | "fail" | "pending";

interface ContractSummary {
  passed: number;
  failed: number;
  requireAction: number;
}

interface RadioRowProps {
  value: string;
  selected: string | null;
  onChange: (value: string) => void;
  label: string;
}

interface AddContractFormProps {
  onAdd: (contract: Contract) => void;
  onCancel: () => void;
}

// ─── Session helpers ──────────────────────────────────────────────────────────

const getProgress = (recordId: string | number | null): Progress => {
  try {
    const key = recordId ? `hr_progress_${recordId}` : "hr_progress";
    return JSON.parse(sessionStorage.getItem(key) || "{}");
  } catch { return {}; }
};

const markComplete = (recordId: string | number | null, key: string): void => {
  try {
    const p = getProgress(recordId);
    const storageKey = recordId ? `hr_progress_${recordId}` : "hr_progress";
    sessionStorage.setItem(storageKey, JSON.stringify({ ...p, [key]: true }));
  } catch {}
};

// ─── Status helpers ───────────────────────────────────────────────────────────

function getContractStatus(contract: Contract): ContractStatus {
  if (contract.exists === "yes" && contract.aligns === "yes") return "pass";
  if (contract.exists === "no" || contract.aligns === "no") return "fail";
  return "pending";
}

function getSummary(contracts: Contract[]): ContractSummary {
  let passed = 0, failed = 0;
  contracts.forEach((c) => {
    const s = getContractStatus(c);
    if (s === "pass") passed++;
    else if (s === "fail") failed++;
  });
  return { passed, failed, requireAction: 0 };
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const B2BIcon = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
    <rect x="1" y="2" width="16" height="14" rx="2" stroke="#374151" strokeWidth="1.4" fill="none" />
    <path d="M1 7h16M5 2v5M13 2v5" stroke="#374151" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const ContractFileIcon = (): React.JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    <rect x="3" y="1" width="14" height="18" rx="2" stroke="#374151" strokeWidth="1.4" fill="none" />
    <path d="M6 7h8M6 10h8M6 13h5" stroke="#374151" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const GreenCheck = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="8" stroke="#16A34A" strokeWidth="1.4" fill="none" />
    <path d="M5.5 9l2.5 2.5L12.5 6" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const YellowWarn = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 2L1.5 15.5h15L9 2z" stroke="#D97706" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
    <path d="M9 8v3M9 13v.5" stroke="#D97706" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const UploadIcon = (): React.JSX.Element => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 18V8M12 8l-4 4M12 8l4 4" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 20h16" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const SpinnerIcon = ({ color = "#0852C9" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="10" cy="10" r="8" stroke="#CBD5E1" strokeWidth="2.5" />
    <path d="M10 2a8 8 0 018 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

// ─── TopNav ───────────────────────────────────────────────────────────────────

function TopNav({ onBack }: { onBack: () => void }) {
  const searchParams = useSearchParams();
  const [recordId, setRecordId] = useState<number | null>(null);
  useEffect(() => {
    const queryId = searchParams.get("recordId") || searchParams.get("id");
    const id = queryId || sessionStorage.getItem("current_hr_record_id");
    if (id) setRecordId(Number(id));
  }, [searchParams]);
  return <HRValidationTabs currentTabId="contracts" hrRecordId={recordId} onBack={onBack} />;
}

// ─── AddContractForm ──────────────────────────────────────────────────────────

function AddContractForm({ onAdd, onCancel }: AddContractFormProps): React.JSX.Element {
  const [clientName, setClientName] = useState<string>("");
  const [exists, setExists] = useState<string | null>(null);
  const [aligns, setAligns] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAdd = clientName.trim() && exists;
  const showAligns = exists === "yes";
  const showUpload = exists === "yes";

  const handleAdd = (): void => {
    if (!canAdd) return;
    onAdd({
      id: Date.now(),
      clientName: clientName.trim(),
      exists: exists as "yes" | "no",
      aligns: exists === "no" ? "no" : (aligns as "yes" | "no" | null),
      document: fileName,
    });
  };

  const RadioRow = ({ value, selected, onChange, label }: RadioRowProps): React.JSX.Element => (
    <div
      onClick={() => onChange(value)}
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "14px 16px", borderRadius: "8px", marginBottom: "8px",
        border: `1.5px solid ${selected === value ? "#0852C9" : "#E2E8F0"}`,
        backgroundColor: selected === value ? "#F0F6FF" : "white",
        cursor: "pointer",
      }}
    >
      <div style={{
        width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${selected === value ? "#0852C9" : "#D1D5DB"}`,
        backgroundColor: selected === value ? "#0852C9" : "white",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected === value && <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "white" }} />}
      </div>
      <span style={{ fontSize: "13.5px", color: "#0F172A" }}>{label}</span>
    </div>
  );

  return (
    <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px 26px", marginBottom: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <ContractFileIcon />
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>Add Client Contract</h3>
      </div>

      {/* Client name */}
      <div style={{ marginBottom: "18px" }}>
        <label style={lbl}>Client / Company Name</label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Enter client or company name"
          style={inputStyle}
        />
      </div>

      {/* Contract exists */}
      <div style={{ marginBottom: "18px" }}>
        <label style={{ ...lbl, marginBottom: "10px" }}>Does the contract exist?</label>
        <RadioRow value="yes" selected={exists} onChange={setExists} label="Yes, contract exists" />
        <RadioRow value="no" selected={exists} onChange={setExists} label="No contract on file" />
      </div>

      {/* Aligns */}
      {showAligns && (
        <div style={{ marginBottom: "18px" }}>
          <label style={{ ...lbl, marginBottom: "10px" }}>Does the contract align with business activity?</label>
          <RadioRow value="yes" selected={aligns} onChange={setAligns} label="Yes, aligns with business activity" />
          <RadioRow value="no" selected={aligns} onChange={setAligns} label="No, does not align" />
        </div>
      )}

      {/* Upload */}
      {showUpload && (
        <div style={{ marginBottom: "20px" }}>
          <label style={lbl}>Upload Contract Document (Optional)</label>
          <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => setFileName(e.target.files?.[0]?.name || null)} />
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              border: "1.5px dashed #D1D5DB", borderRadius: "8px", padding: "24px 20px",
              textAlign: "center", cursor: "pointer", backgroundColor: "#F9FAFB",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}><UploadIcon /></div>
            <p style={{ margin: 0, fontSize: "13px", color: "#9CA3AF" }}>{fileName || "Upload contract PDF"}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <button onClick={onCancel} style={cancelBtn}>Cancel</button>
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          style={{ ...primaryBtn, opacity: canAdd ? 1 : 0.5, cursor: canAdd ? "pointer" : "not-allowed" }}
        >
          Add Contract
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>}>
      <ContractsPageImpl />
    </Suspense>
  );
}

function ContractsPageImpl(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [businessNature, setBusinessNature] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const queryId = searchParams.get("recordId") || searchParams.get("id");
    const id = queryId || sessionStorage.getItem("current_hr_record_id");
    const parsedId = id ? Number(id) : null;
    setRecordId(parsedId);

    if (parsedId) {
      // Load saved results
      (async () => {
        const saved = await getSavedResults(parsedId);
        if (saved.business_nature) setBusinessNature(saved.business_nature);
        if (saved.contracts && Array.isArray(saved.contracts)) setContracts(saved.contracts);
      })();
    }
  }, [searchParams]);

  const handleAddContract = (contract: Contract): void => {
    setContracts((prev) => [...prev, contract]);
    setShowForm(false);
  };

  const handleContinue = async (): Promise<void> => {
    setIsSubmitting(true);
    markComplete(recordId, "contracts");

    if (recordId) {
      const token = getClientToken();
      try {
        await updateHRValidationRecordAction(recordId, {
          result_complete_sections: {
            ...(await getSavedResults(recordId)),
            business_nature: businessNature,
            contracts_count: contracts.length,
            contracts: contracts,
          }
        }, token);
        router.push(`/employer/sections/financial?recordId=${recordId}`);
      } catch (err) {
        console.error("Error completing contracts validation:", err);
        setIsSubmitting(false);
      }
    } else {
      router.push(`/employer/sections/financial?recordId=${recordId}`);
    }
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

  const summary = getSummary(contracts);
  const hasContracts = contracts.length > 0;
  const hasIssues = summary.failed > 0;
  const needsContracts = businessNature === "b2b" || businessNature === "healthcare";
  const canContinue = !needsContracts || (needsContracts && hasContracts);

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
      <TopNav onBack={() => router.back()} />

      <div style={{ maxWidth: "860px", margin: "30px auto", padding: "0 24px" }}>

        {/* Business Nature */}
        <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px 24px", marginBottom: "20px" }}>
          <label style={{ ...lbl, fontSize: "16px", fontWeight: "600", color: "#0F172A" }}>Step 1: Select Business Nature</label>
          <p style={{ margin: "4px 0 12px", fontSize: "13.5px", color: "#64748B" }}>
            This determines whether client contracts are required for validation.
          </p>
          <select
            value={businessNature}
            onChange={(e) => setBusinessNature(e.target.value)}
            style={{ ...inputStyle, padding: "12px", fontSize: "14px" }}
          >
            <option value="" disabled>Choose from the dropdown</option>
            <option value="none">No B2B contract needed</option>
            <option value="b2b">B2B / Service-based business</option>
            <option value="healthcare">Healthcare service provider</option>
          </select>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.3px" }}>
            Workflow 4: Client Contract Validation
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: "13.5px", color: "#64748B" }}>
            Verify client contracts for B2B or service-based business activities
          </p>
        </div>

        {/* Info banner */}
        <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "16px 20px", marginBottom: "14px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <B2BIcon />
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>B2B / Service-Based Business</div>
            <div style={{ fontSize: "13px", color: "#64748B", marginTop: "3px" }}>Add all client contracts to verify existence and alignment with business activity.</div>
          </div>
        </div>

        {needsContracts && (
          <>
            {/* Contracts table */}
            {hasContracts && (
              <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px 24px", marginBottom: "14px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>Added Contracts</h3>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1.5fr 1fr 1fr", padding: "0 4px 10px", borderBottom: "1px solid #F1F5F9" }}>
                  {["Client Name", "Contract Exists", "Aligns with Activity", "Document", "Status"].map((h) => (
                    <div key={h} style={{ fontSize: "12.5px", color: "#94A3B8", fontWeight: "500" }}>{h}</div>
                  ))}
                </div>
                {contracts.map((c) => {
                  const status = getContractStatus(c);
                  return (
                    <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1.5fr 1fr 1fr", padding: "13px 4px", borderBottom: "1px solid #F8FAFC", alignItems: "center" }}>
                      <div style={{ fontSize: "14px", color: "#0F172A", fontWeight: "500" }}>{c.clientName}</div>
                      <div>{c.exists === "yes" ? <GreenCheck /> : <YellowWarn />}</div>
                      <div>{c.aligns === "yes" ? <GreenCheck /> : c.aligns === "no" ? <YellowWarn /> : <span style={{ color: "#94A3B8" }}>—</span>}</div>
                      <div style={{ fontSize: "14px", color: "#94A3B8" }}>{c.document ? "✓" : "—"}</div>
                      <div>
                        {status === "pass" ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#0852C9", color: "white" }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="white" strokeWidth="1.2" fill="none" /><path d="M3.5 6l2 2L8.5 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>
                            Pass
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#DC2626", color: "white" }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1.5L1 10h10L6 1.5z" stroke="white" strokeWidth="1.1" fill="none" /><path d="M6 5.5v2M6 9v.3" stroke="white" strokeWidth="1" strokeLinecap="round" /></svg>
                            Fail
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add form or add button */}
            {showForm ? (
              <AddContractForm onAdd={handleAddContract} onCancel={() => setShowForm(false)} />
            ) : (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  width: "100%", padding: "14px", backgroundColor: "white",
                  border: "1.5px solid #E2E8F0", borderRadius: "10px",
                  fontSize: "14px", fontWeight: "500", color: "#374151",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "8px", marginBottom: "14px",
                }}
              >
                <span style={{ fontSize: "16px" }}>+</span> Add Client Contract
              </button>
            )}
          </>
        )}

        {/* Summary bar */}
        {hasContracts && !showForm && (
          <div style={{
            backgroundColor: "white", borderRadius: "10px",
            border: `1.5px solid ${hasIssues ? "#FCA5A5" : "#E2E8F0"}`,
            padding: "16px 20px", marginBottom: "14px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>Contract Validation Summary</div>
              <div style={{ fontSize: "13px", color: "#64748B", marginTop: "3px" }}>
                {summary.passed} passed, {summary.failed} failed, {summary.requireAction} require action
              </div>
            </div>
            <span style={{
              padding: "5px 14px", borderRadius: "20px", fontSize: "12.5px", fontWeight: "700",
              backgroundColor: hasIssues ? "#DC2626" : "#0852C9", color: "white",
            }}>
              {hasIssues ? "Issues Found" : "All Valid"}
            </span>
          </div>
        )}

        {/* Continue */}
        <button
          onClick={canContinue && !isSubmitting ? handleContinue : undefined}
          disabled={!canContinue || isSubmitting}
          style={{
            width: "100%", padding: "14px", backgroundColor: (canContinue && !isSubmitting) ? "#0852C9" : "#93ABDE",
            color: "white", border: "none", borderRadius: "8px",
            fontSize: "14px", fontWeight: "600",
            cursor: (canContinue && !isSubmitting) ? "pointer" : "not-allowed",
            opacity: canContinue ? 1 : 0.5, marginBottom: "16px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}
        >
          {isSubmitting && <SpinnerIcon color="#fff" />}
          {isSubmitting ? "Processing..." : "Continue to Financial Viability Check"}
        </button>

        {/* Back */}
        <button
          onClick={() => router.push(`/employer/sections/authorising-officer?recordId=${recordId}`)}
          style={{
            padding: "10px 20px", backgroundColor: "white", color: "#374151",
            border: "1.5px solid #D1D5DB", borderRadius: "8px",
            fontSize: "14px", fontWeight: "500", cursor: "pointer",
          }}
        >
          Back to AO Assessment
        </button>
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const lbl: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #D1D5DB", fontSize: "14px", outline: "none", boxSizing: "border-box", color: "#0F172A", backgroundColor: "white" };
const cancelBtn: React.CSSProperties = { padding: "11px 20px", borderRadius: "8px", border: "1.5px solid #D1D5DB", backgroundColor: "white", fontSize: "14px", fontWeight: "500", cursor: "pointer", color: "#374151" };
const primaryBtn: React.CSSProperties = { padding: "11px 20px", borderRadius: "8px", border: "none", backgroundColor: "#0852C9", color: "white", fontSize: "14px", fontWeight: "600" };