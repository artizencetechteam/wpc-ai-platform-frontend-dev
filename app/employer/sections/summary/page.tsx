'use client';

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HRValidationTabs from "../_components/HRValidationTabs";
import { listHRValidationRecordsAction, updateHRValidationRecordAction, listEmployeesAction, listFinancialRecordsAction } from "@/app/employer/sections/action/action";
import { getClientToken } from "@/app/employer/sections/company/page";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tab {
  label: string;
  id: string;
}

const SpinnerIcon = ({ color = "#0852C9" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="10" cy="10" r="8" stroke="#CBD5E1" strokeWidth="2.5" />
    <path d="M10 2a8 8 0 018 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

interface Progress {
  [key: string]: boolean;
}

interface Employee {
  id: string | number;
  employee_full_name: string;
  nationality: string;
  documentType?: string;
  pension_status?: string | null;
  [key: string]: any;
}

interface Workflow {
  key: string;
  title: string;
  subtitle: string;
  compliant: boolean;
}

interface StatItem {
  label: string;
  value: number;
}

interface TopNavProps {
  onBack: () => void;
  onTabClick: (tabId: string) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────



// ─── Icons ───────────────────────────────────────────────────────────────────

const YellowWarnBig = (): React.JSX.Element => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="25" fill="#FEF9C3" stroke="#F59E0B" strokeWidth="1.5" />
    <path d="M26 14L10 40h32L26 14z" stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinejoin="round" />
    <path d="M26 22v9M26 34v1.5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const GreenCheckBig = (): React.JSX.Element => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="25" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5" />
    <path d="M15 26l8 8 14-16" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GreenCircleCheck = (): React.JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="9" stroke="#16A34A" strokeWidth="1.4" fill="none" />
    <path d="M6.5 10l2.5 2.5L13.5 7" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RedCircleX = (): React.JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="9" stroke="#DC2626" strokeWidth="1.4" fill="none" />
    <path d="M7 7l6 6M13 7l-6 6" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MessageIcon = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const workflowIcons: Record<string, () => React.JSX.Element> = {
  rtw: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="1" width="14" height="18" rx="2" stroke="#64748B" strokeWidth="1.3" fill="none" /><path d="M6 7h8M6 10h8M6 13h5" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" /></svg>,
  pension: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="8" r="3.5" stroke="#64748B" strokeWidth="1.3" fill="none" /><path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#64748B" strokeWidth="1.3" strokeLinecap="round" fill="none" /></svg>,
  auth: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L3 5v5c0 4.418 3.134 7.891 7 8.944C16.866 17.891 20 14.418 20 10V5l-7-3H10z" stroke="#64748B" strokeWidth="1.3" fill="none" strokeLinejoin="round" /></svg>,
  contracts: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="2" width="18" height="16" rx="2" stroke="#64748B" strokeWidth="1.3" fill="none" /><path d="M5 9h10M5 13h6" stroke="#64748B" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  financial: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v16M6 5.5h5.5a2.5 2.5 0 010 5H8a2.5 2.5 0 000 5H14" stroke="#64748B" strokeWidth="1.3" strokeLinecap="round" /></svg>,
};

// ─── TopNav ───────────────────────────────────────────────────────────────────



// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SummaryPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>}>
      <SummaryPageImpl />
    </Suspense>
  );
}

function SummaryPageImpl(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [progress, setProgress] = useState<Progress>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic data from other sections
  const [companyName, setCompanyName] = useState<string>("");
  const [financialData, setFinancialData] = useState<{
    balance?: number;
    incoming?: number;
    outgoing?: number;
    netCashFlow?: number;
    paymentsReflected?: string | null;
    futureEngagement?: string | null;
    transactions?: Array<{ status: string }>;
  }>({});
  const [contracts, setContracts] = useState<Array<{ clientName?: string; exists?: string; aligns?: string }>>([]);
  const [pensionData, setPensionData] = useState<{ companyRegistered?: string; eligibilityChecks?: Record<string, unknown> }>({});

  // Feedback State
  const [comments, setComments] = useState<Record<string, string>>({});
  const [activeCommentSection, setActiveCommentSection] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [commentText, activeCommentSection]);

  useEffect(() => {
    const queryId = searchParams.get("recordId") || searchParams.get("id");
    const id = queryId || sessionStorage.getItem("current_hr_record_id");
    setRecordId(id);

    try {
      if (id) {
        // Employees
        const e = sessionStorage.getItem(`hr_employees_${id}`);
        if (e) setEmployees(JSON.parse(e) as Employee[]);

        // Progress flags
        const p = sessionStorage.getItem(`hr_progress_${id}`);
        if (p) setProgress(JSON.parse(p) as Progress);
      }

      // Company name
      if (id) {
        const savedName = sessionStorage.getItem(`company_name_${id}`);
        if (savedName) setCompanyName(savedName);
      }

      if (id) {
        // Financial data
        const f = sessionStorage.getItem(`hr_financial_data_${id}`);
        if (f) setFinancialData(JSON.parse(f));

        // Contracts
        const c = sessionStorage.getItem(`hr_contracts_${id}`);
        if (c) setContracts(JSON.parse(c));
      }

      // Pension data
      if (id) {
        const pen = sessionStorage.getItem(`pension_data_${id}`);
        if (pen) setPensionData(JSON.parse(pen));
      }

      // Fetch from server to fully hydrate state
      const fetchRecord = async () => {
        try {
          const token = getClientToken();
          const res = await listHRValidationRecordsAction(token);
          if (res.success && res.data) {
            const record = res.data.find((r: any) => r.id === Number(id));
            if (record) {
              // 1. Comments
              const serverComments: Record<string, string> = {};
              if (record.rtw_section_comments) serverComments["Workflow: RTW & Start Date Compliance"] = record.rtw_section_comments;
              if (record.pension_section_comments) serverComments["Workflow: Pension Compliance"] = record.pension_section_comments;
              if (record.authorising_officer_section_comments) serverComments["Workflow: Authorising Officer"] = record.authorising_officer_section_comments;
              if (record.contract_section_comments) serverComments["Workflow: Client Contracts"] = record.contract_section_comments;
              if (record.financial_section_comments) serverComments["Workflow: Financial Viability"] = record.financial_section_comments;
              if (record.employeee_sections_comments) serverComments["General"] = record.employeee_sections_comments;
              setComments(serverComments);

              // 2. Company Name
              if (record.company_name) setCompanyName(record.company_name);

              // 3. Contracts & Pension (from result_complete_sections)
              const saved = record.result_complete_sections || {};
              if (saved.contracts) setContracts(saved.contracts);
              if (saved.pension) setPensionData(saved.pension);

              // 4. Financial Data
              const finRes = await listFinancialRecordsAction(token);
              if (finRes.success && finRes.data) {
                const finRecord = finRes.data.find((fr) => fr.HRValidationRecord_id === Number(id));
                if (finRecord) {
                  setFinancialData((prev) => ({
                    ...prev,
                    balance: finRecord.current_closing_balance_gbp ? parseFloat(finRecord.current_closing_balance_gbp) : prev.balance,
                    incoming: finRecord.total_incoming_gbp_credits ? parseFloat(finRecord.total_incoming_gbp_credits) : prev.incoming,
                    outgoing: finRecord.total_outgoing_gbp_debits ? parseFloat(finRecord.total_outgoing_gbp_debits) : prev.outgoing,
                    paymentsReflected: finRecord.payments_reflected_in_bank === true ? "yes" : finRecord.payments_reflected_in_bank === false ? "no" : prev.paymentsReflected,
                    futureEngagement: finRecord.is_future_engagement === true ? "yes" : finRecord.is_future_engagement === false ? "no" : prev.futureEngagement,
                  }));
                }
              }
              if (record.transactions) {
                setFinancialData((prev) => ({
                  ...prev,
                  transactions: typeof record.transactions === "string" ? JSON.parse(record.transactions) : record.transactions,
                }));
              }
            }
          }

          const empRes = await listEmployeesAction(Number(id), token);
          if (empRes.success && empRes.data) {
            setEmployees(empRes.data);
          }
        } catch (err) {
          console.error("Error fetching summary record:", err);
        } finally {
          setLoading(false);
        }
      };
      if (id) {
        fetchRecord();
      } else {
        setLoading(false);
      }
    } catch {}
  }, [searchParams]);

  const migrants = employees.filter(
    (e) => !["british", "irish", "british/irish"].includes(e.nationality?.toLowerCase() || "")
  );

  // --- Derived values for subtitles ---
  const contractsPassed = contracts.filter(
    (c) => c.exists === "yes" && c.aligns === "yes"
  ).length;
  const contractsTotal = contracts.length;

  const balanceStr = financialData.balance != null
    ? `Balance: £${financialData.balance.toLocaleString()}`
    : "Balance: N/A";
  const cashFlowStr =
    financialData.netCashFlow != null
      ? financialData.netCashFlow > 0 ? "Cash flow: Positive" : "Cash flow: Negative"
      : "Cash flow: Not entered";
  const financialSubtitle = `${balanceStr}, ${cashFlowStr}`;

  const pensionRegistered = pensionData.companyRegistered;
  const pensionSubtitle = pensionRegistered === "yes"
    ? "Company registered, employee checks complete"
    : pensionRegistered === "no"
      ? "Company NOT registered with pension scheme"
      : "Pension registration not confirmed";

  const rtwSubtitle = migrants.length === 0
    ? "No migrant workers — RTW checks skipped"
    : `${migrants.length} migrant worker${migrants.length > 1 ? "s" : ""} — RTW verified`;

  const contractsSubtitle = contractsTotal === 0
    ? "No contracts added"
    : `${contractsPassed}/${contractsTotal} contract${contractsTotal > 1 ? "s" : ""} validated`;

  const hasFlaggedTransactions = financialData.transactions?.some(t => t.status === "fail") || false;
  const financialCompliant = !!progress.financial && 
    (financialData.balance ?? 0) >= 10425 &&
    (financialData.netCashFlow == null || financialData.netCashFlow > 0) &&
    !hasFlaggedTransactions &&
    (financialData.paymentsReflected === "yes" || (financialData.paymentsReflected === "no" && financialData.futureEngagement === "yes"));

  const hasNonCompliantPension = employees.some(e => {
    const eligible = e.min_22_year_age && e.earning_gbp_10k_above;
    const isCompliant = !!e.auto_enrollment_date || !!e.opted_out;
    return eligible && !isCompliant;
  });
  const pensionCompliant = !!progress.pension && pensionData.companyRegistered !== "no" && !hasNonCompliantPension;
  const contractsCompliant = !!progress.contracts && (contractsTotal === 0 || contractsPassed === contractsTotal);

  const workflows: Workflow[] = [
    {
      key: "rtw",
      title: "RTW & Start Date Compliance",
      subtitle: rtwSubtitle,
      compliant: !!progress.rtw,
    },
    {
      key: "pension",
      title: "Pension Compliance",
      subtitle: pensionSubtitle,
      compliant: pensionCompliant,
    },
    {
      key: "auth",
      title: "Authorising Officer",
      subtitle: companyName ? `Validated for ${companyName}` : "Authorising Officer assessed",
      compliant: !!progress.auth,
    },
    {
      key: "contracts",
      title: "Client Contracts",
      subtitle: contractsSubtitle,
      compliant: contractsCompliant,
    },
    {
      key: "financial",
      title: "Financial Viability",
      subtitle: financialSubtitle,
      compliant: financialCompliant,
    },
  ];

  const passedCount = workflows.filter((w) => w.compliant).length;
  const issuesCount = workflows.filter((w) => !w.compliant).length;
  const allCompliant = issuesCount === 0;

  const overallStats: StatItem[] = [
    { label: "Total Employees", value: employees.length },
    { label: "Migrants", value: migrants.length },
    { label: "Workflows Passed", value: passedCount },
    { label: "Issues Found", value: issuesCount },
    { label: "Contracts", value: contractsTotal },
  ];

  const handleStartNew = (): void => {
    setIsSubmitting(true);
    try {
      if (recordId) {
        sessionStorage.removeItem(`hr_employees_${recordId}`);
        sessionStorage.removeItem(`hr_progress_${recordId}`);
        sessionStorage.removeItem(`hr_financial_data_${recordId}`);
        sessionStorage.removeItem(`hr_contracts_${recordId}`);
        sessionStorage.removeItem(`company_name_${recordId}`);
        sessionStorage.removeItem(`bank_name_${recordId}`);
        sessionStorage.removeItem(`pension_data_${recordId}`);
      }
      sessionStorage.removeItem("current_hr_record_id");
    } catch {}
    router.push("/employer/sections/company");
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 20mm !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .card-print {
            border: 1px solid #E2E8F0 !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div className="no-print">
        <HRValidationTabs currentTabId="summary" hrRecordId={recordId} onBack={() => router.back()} />
      </div>

      <div className="print-container" style={{ maxWidth: "860px", margin: "30px auto", padding: "0 24px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>
        ) : (
          <>
            {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "28px", position: "relative" }}>
          <div className="no-print" style={{ position: "absolute", top: 0, right: 0 }}>
            <button 
              onClick={() => { setActiveCommentSection("General"); setCommentText(comments["General"] || ""); }}
              style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "white", color: "#0852C9", border: "1.5px solid #0852C9", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px", transition: "all 0.2s" }}
            >
              <MessageIcon /> Provide Feedback
            </button>
          </div>
          {allCompliant ? <GreenCheckBig /> : <YellowWarnBig />}
          {companyName && (
            <p style={{ margin: "8px 0 0", fontSize: "13px", fontWeight: "600", color: "#0852C9", letterSpacing: "0.3px" }}>
              {companyName}
            </p>
          )}
          <h2 style={{ margin: "10px 0 4px", fontSize: "22px", fontWeight: "700", color: "#0F172A" }}>
            {allCompliant ? "Validation Complete" : "Validation Complete with Issues"}
          </h2>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#64748B" }}>
            {allCompliant
              ? "All workflows passed. Your organisation is fully compliant."
              : "Some workflows require attention before full compliance."}
          </p>
        </div>

        {/* Overall status */}
        <div className="card-print" style={{
          backgroundColor: "white", borderRadius: "12px",
          border: `2px solid ${allCompliant ? "#E2E8F0" : "#FCA5A5"}`,
          padding: "20px 24px", marginBottom: "16px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>Overall Status</h3>

            </div>
            <span style={{
              padding: "5px 14px", borderRadius: "20px", fontSize: "12.5px", fontWeight: "700",
              backgroundColor: allCompliant ? "#16A34A" : "#DC2626", color: "white",
            }}>
              {allCompliant ? "Compliant" : "Non-Compliant"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${overallStats.length}, 1fr)`, gap: "10px" }}>
            {overallStats.map((s) => (
              <div key={s.label} style={{ backgroundColor: "#F8FAFC", borderRadius: "8px", padding: "14px 12px", textAlign: "center" }}>
                <div style={{ fontSize: "26px", fontWeight: "700", color: "#0F172A" }}>{s.value}</div>
                <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "3px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial highlight card (shown only if financial data exists) */}
        {(financialData.balance != null || financialData.incoming != null) && (
          <div className="card-print" style={{
            backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E8F0",
            padding: "18px 24px", marginBottom: "16px", position: "relative"
          }}>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px",
            }}>
            {financialData.balance != null && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Closing Balance</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: financialData.balance >= 10425 ? "#16A34A" : "#DC2626" }}>
                  £{financialData.balance.toLocaleString()}
                </div>
              </div>
            )}
            {financialData.incoming != null && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Total Incoming</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#166534" }}>
                  £{financialData.incoming.toLocaleString()}
                </div>
              </div>
            )}
            {financialData.netCashFlow != null && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Net Cash Flow</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: financialData.netCashFlow >= 0 ? "#166534" : "#DC2626" }}>
                  {financialData.netCashFlow >= 0 ? "+" : ""}£{Math.abs(financialData.netCashFlow).toLocaleString()}
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Workflow results */}
        <div className="card-print" style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px 24px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>Workflow Results</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>Detailed breakdown of each validation workflow</p>
            </div>
          </div>
          {workflows.map((w, i) => {
            const Icon = workflowIcons[w.key];
            return (
              <div key={w.key} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", backgroundColor: "#F8FAFC", borderRadius: "8px",
                marginBottom: i < workflows.length - 1 ? "8px" : 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "white", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>{w.title}</div>
                    <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>{w.subtitle}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button 
                    className="no-print"
                    onClick={() => { setActiveCommentSection(`Workflow: ${w.title}`); setCommentText(comments[`Workflow: ${w.title}`] || ""); }} 
                    style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "600", padding: "4px", marginRight: "4px" }}
                    title="Add Comment"
                  >
                    <MessageIcon />
                  </button>
                  <span style={{
                    padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
                    backgroundColor: w.compliant ? "#16A34A" : "#DC2626", color: "white",
                  }}>
                    {w.compliant ? "Compliant" : "Non-Compliant"}
                  </span>
                  {w.compliant ? <GreenCircleCheck /> : <RedCircleX />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Employee summary */}
        <div className="card-print" style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px 24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>Employee Summary</h3>
          </div>
          {employees.length === 0 ? (
            <p style={{ margin: 0, fontSize: "13px", color: "#94A3B8" }}>No employees found.</p>
          ) : (
            employees.map((emp) => (
              <div key={emp.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", backgroundColor: "#F8FAFC", borderRadius: "8px", marginBottom: "8px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "34px", height: "34px", borderRadius: "50%",
                    backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px", fontWeight: "700", color: "#0852C9", flexShrink: 0,
                  }}>
                    {(emp.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>{emp.name}</div>
                    <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>{emp.nationality}</div>
                  </div>
                </div>
                <span style={{
                  padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                  backgroundColor: !["british", "irish", "british/irish"].includes(emp.nationality?.toLowerCase() || "")
                    ? "#7C3AED" : "#0852C9",
                  color: "white",
                }}>
                  {!["british", "irish", "british/irish"].includes(emp.nationality?.toLowerCase() || "")
                    ? "Migrant Worker" : "Pension Checked"}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Comments Section (Visible in Report/Print) */}
        {Object.entries(comments).some(([_, text]) => text && text.trim() !== "") && (
          <div className="card-print" style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px 24px", marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>Validation Comments & Feedback</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {Object.entries(comments).map(([section, text]) => (
                text && text.trim() !== "" && (
                  <div key={section} style={{ paddingBottom: "12px", borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#0852C9", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{section}</div>
                    <div style={{ fontSize: "13.5px", color: "#334155", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>{text}</div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="no-print" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <button 
            onClick={handleStartNew} 
            disabled={isSubmitting}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "13px 20px", backgroundColor: isSubmitting ? "#F1F5F9" : "white", color: "#374151",
              border: "1.5px solid #D1D5DB", borderRadius: "8px",
              fontSize: "14px", fontWeight: "600", cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? <SpinnerIcon color="#0852C9" /> : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 016-6 6 6 0 015.5 3.6M14 8a6 6 0 01-6 6 6 6 0 01-5.5-3.6" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" /><path d="M14 4v3.5H10.5" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
            {isSubmitting ? "Starting..." : "Start New Validation"}
          </button>
          <button onClick={() => window.print()} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            padding: "13px 20px", backgroundColor: "#0852C9", color: "white",
            border: "none", borderRadius: "8px",
            fontSize: "14px", fontWeight: "600", cursor: "pointer",
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M8 10l-3-3M8 10l3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 13h12" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Download Report
          </button>
        </div>
        </>
        )}
      </div>

      {/* Feedback/Comment Modal */}
      {activeCommentSection && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: "20px"
        }}>
          <div style={{
            backgroundColor: "white", borderRadius: "12px", width: "100%", maxWidth: "500px",
            padding: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column"
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>
              Feedback: {activeCommentSection}
            </h3>
            <textarea
              ref={textareaRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Enter your feedback or comments here..."
              style={{
                width: "100%", minHeight: "120px", padding: "12px", borderRadius: "8px",
                border: "1px solid #CBD5E1", fontSize: "14px", fontFamily: "inherit",
                resize: "none", overflow: "hidden", outline: "none", marginBottom: "20px"
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setActiveCommentSection(null)}
                style={{
                  padding: "10px 16px", backgroundColor: "white", color: "#374151",
                  border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const newComments = { ...comments, [activeCommentSection]: commentText };
                  setComments(newComments);
                  setActiveCommentSection(null);

                  // Map to server fields
                  const mapping: Record<string, string> = {
                    "Workflow: RTW & Start Date Compliance": "rtw_section_comments",
                    "Workflow: Pension Compliance": "pension_section_comments",
                    "Workflow: Authorising Officer": "authorising_officer_section_comments",
                    "Workflow: Client Contracts": "contract_section_comments",
                    "Workflow: Financial Viability": "financial_section_comments",
                    "General": "employeee_sections_comments",
                  };

                  const updateData: any = {};
                  Object.entries(newComments).forEach(([section, text]) => {
                    const field = mapping[section];
                    if (field) updateData[field] = text;
                  });

                  if (recordId) {
                    const token = getClientToken();
                    await updateHRValidationRecordAction(Number(recordId), updateData, token);
                  }
                }}
                style={{
                  padding: "10px 16px", backgroundColor: "#0852C9", color: "white",
                  border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer"
                }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}