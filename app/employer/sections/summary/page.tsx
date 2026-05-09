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
  min_22_year_age?: boolean;
  earning_gbp_10k_above?: boolean;
  auto_enrollment_date?: string | null;
  opted_out?: boolean;
  [key: string]: any;
}

interface Workflow {
  key: string;
  title: string;
  subtitle: string;
  compliant: boolean;
  issues: string[];
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [savedHtml, setSavedHtml] = useState<string | null>(null);
  const [badgeDropdown, setBadgeDropdown] = useState<{ target: HTMLElement, x: number, y: number } | null>(null);
  const printContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recordId) {
      const html = sessionStorage.getItem(`report_edits_${recordId}`);
      if (html) setSavedHtml(html);
    }
  }, [recordId]);

  useEffect(() => {
    const closeDropdown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.editable-badge') || target.closest('.badge-dropdown-container')) return;
      setBadgeDropdown(null);
    };
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, []);
  useEffect(() => {
    if (savedHtml && printContainerRef.current) {
      if (!printContainerRef.current.innerHTML || printContainerRef.current.innerHTML.trim() === "") {
        printContainerRef.current.innerHTML = savedHtml;
      }
    }
  }, [savedHtml]);

  useEffect(() => {
    if (printContainerRef.current) {
      printContainerRef.current.contentEditable = isEditMode ? "true" : "false";
    }
  }, [isEditMode]);

  const greenCheckSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="workflow-status-icon"><circle cx="10" cy="10" r="9" stroke="#16A34A" stroke-width="1.4" fill="none"></circle><path d="M6.5 10l2.5 2.5L13.5 7" stroke="#16A34A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
  const redXSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="workflow-status-icon"><circle cx="10" cy="10" r="9" stroke="#DC2626" stroke-width="1.4" fill="none"></circle><path d="M7 7l6 6M13 7l-6 6" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round"></path></svg>`;

  const greenCheckBigSvg = `<svg width="52" height="52" viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="25" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.5"></circle><path d="M15 26l8 8 14-16" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
  const yellowWarnBigSvg = `<svg width="52" height="52" viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="25" fill="#FEF9C3" stroke="#F59E0B" stroke-width="1.5"></circle><path d="M26 14L10 40h32L26 14z" stroke="#F59E0B" stroke-width="2" fill="none" stroke-linejoin="round"></path><path d="M26 22v9M26 34v1.5" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"></path></svg>`;

  const allBadges = [
    { label: "Compliant", bg: "#16A34A", isPositive: true },
    { label: "Non-Compliant", bg: "#DC2626", isPositive: false },
    { label: "Pending", bg: "#F59E0B", isPositive: false },
    { label: "Migrant Worker", bg: "#7C3AED" },
    { label: "British/Irish", bg: "#0852C9" },
    { label: "Pension Checked", bg: "#0852C9", isPositive: true },
    { label: "Opted Out", bg: "#64748B" },
    { label: "High Risk", bg: "#991B1B", isPositive: false },
    { label: "Verified", bg: "#059669", isPositive: true }
  ];

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    const target = e.target as HTMLElement;
    if (target.classList.contains('editable-badge')) {
      e.stopPropagation();
      e.nativeEvent.stopPropagation();
      const rect = target.getBoundingClientRect();
      setBadgeDropdown({
        target,
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 4
      });
    }
  };

  const selectBadge = (badge: { label: string, bg: string, isPositive?: boolean }) => {
    if (badgeDropdown) {
      const { target } = badgeDropdown;
      target.innerText = badge.label;
      target.style.backgroundColor = badge.bg;

      const nextSibling = target.nextElementSibling;
      if (nextSibling && nextSibling.tagName.toLowerCase() === 'svg') {
        if (badge.isPositive !== undefined) {
          nextSibling.outerHTML = badge.isPositive ? greenCheckSvg : redXSvg;
        }
      }

      if (badge.isPositive !== undefined) {
        const overallCard = target.closest('.card-print');
        if (overallCard && overallCard.querySelector('h3')?.innerText.includes('Overall Status')) {
          (overallCard as HTMLElement).style.border = badge.isPositive ? "2px solid #E2E8F0" : "2px solid #FCA5A5";

          const headerDiv = overallCard.previousElementSibling;
          if (headerDiv && headerDiv.querySelector('h2')) {
            const h2 = headerDiv.querySelector('h2');
            const p = headerDiv.querySelector('p');
            const svg = headerDiv.querySelector('svg');
            if (h2) h2.innerText = badge.isPositive ? "Validation Complete" : "Validation Complete with Issues";
            if (p) p.innerText = badge.isPositive ? "All workflows passed. Your organisation is fully compliant." : "Some workflows require attention before full compliance.";
            if (svg) svg.outerHTML = badge.isPositive ? greenCheckBigSvg : yellowWarnBigSvg;
          }
        }

        const workflowItem = target.closest('.workflow-item-card');
        if (workflowItem) {
          (workflowItem as HTMLElement).style.border = badge.isPositive ? "1px solid transparent" : "1px solid #FEE2E2";
          const issuesList = workflowItem.querySelector('.workflow-issues-list') as HTMLElement;
          if (issuesList) {
            issuesList.style.display = badge.isPositive ? "none" : "block";
          }
        }
      }
    }
    setBadgeDropdown(null);
  };

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
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [activeCommentSection, setActiveCommentSection] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleToggleOverride = async (key: string) => {
    const newVal = !manualOverrides[key];
    const newOverrides = { ...manualOverrides, [key]: newVal };
    setManualOverrides(newOverrides);

    if (recordId) {
      const token = getClientToken();
      try {
        const res = await listHRValidationRecordsAction(token);
        if (res.success && res.data) {
          const record = res.data.find((r: any) => r.id === Number(recordId));
          const currentSections = record?.result_complete_sections || {};
          await updateHRValidationRecordAction(Number(recordId), {
            result_complete_sections: {
              ...currentSections,
              manual_overrides: newOverrides
            }
          }, token);
        }
      } catch (err) {
        console.error("Error toggling manual override:", err);
      }
    }
  };

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

      // Financial data and contracts are now hydrated solely from the fetchRecord API call below

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

              // 3. Summary HTML (server takes precedence over session cache)
              if (record.html_content_for_summary) {
                setSavedHtml(record.html_content_for_summary);
                if (id) sessionStorage.setItem(`report_edits_${id}`, record.html_content_for_summary);
              }

              // 4. Contracts & Pension (from result_complete_sections)
              const saved = record.result_complete_sections || {};
              if (saved.contracts) setContracts(saved.contracts);
              if (saved.pension) setPensionData(saved.pension);
              if (saved.manual_overrides) setManualOverrides(saved.manual_overrides);

              // 5. Financial Data
              const finRes = await listFinancialRecordsAction(token);
              if (finRes.success && finRes.data) {
                const finRecord = finRes.data.find((fr) => fr.HRValidationRecord_id === Number(id));
                if (finRecord) {
                  const incoming = finRecord.total_incoming_gbp_credits ? parseFloat(finRecord.total_incoming_gbp_credits) : undefined;
                  const outgoing = finRecord.total_outgoing_gbp_debits ? parseFloat(finRecord.total_outgoing_gbp_debits) : undefined;
                  const netCashFlow = incoming != null && outgoing != null ? incoming - outgoing : undefined;
                  setFinancialData((prev) => ({
                    ...prev,
                    balance: finRecord.current_closing_balance_gbp ? parseFloat(finRecord.current_closing_balance_gbp) : prev.balance,
                    incoming: incoming ?? prev.incoming,
                    outgoing: outgoing ?? prev.outgoing,
                    netCashFlow: netCashFlow ?? prev.netCashFlow,
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
    } catch { }
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

  // ── RTW: check if any migrant's RTW check date is on or after their employment start date ──
  const nonCompliantRTWEmployees = migrants.filter(e => {
    const checkDate = e.check_date;
    const startDate = e.employment_start_date || e.startDate;
    if (!checkDate || !startDate) return false;

    // Normalize to YYYY-MM-DD for reliable comparison
    const checkStr = checkDate.split('T')[0];
    const startStr = startDate.split('T')[0];

    return checkStr >= startStr; // non-compliant: check is on or after employment start
  });
  const hasNonCompliantRTW = nonCompliantRTWEmployees.length > 0;

  const rtwSubtitle = migrants.length === 0
    ? "No migrant workers — RTW checks skipped"
    : hasNonCompliantRTW
      ? `${nonCompliantRTWEmployees.length} RTW check(s) conducted after employment start date`
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

  // --- Calculate issues for each workflow ---
  const rtwIssues: string[] = [];
  if (!progress.rtw) rtwIssues.push("Section has not been reviewed or completed.");
  if (hasNonCompliantRTW) {
    nonCompliantRTWEmployees.forEach(e => {
      rtwIssues.push(
        `${e.employee_full_name}: RTW check (${e.check_date ? new Date(e.check_date).toLocaleDateString('en-GB') : 'N/A'}) was on or after employment start date (${e.employment_start_date || e.startDate ? new Date(e.employment_start_date || e.startDate).toLocaleDateString('en-GB') : 'N/A'}).`
      );
    });
  }

  const authIssues: string[] = [];
  if (!progress.auth) authIssues.push("Authorising Officer assessment has not been completed.");

  const pensionIssues: string[] = [];
  if (!progress.pension) pensionIssues.push("Pension section not completed.");
  if (pensionData.companyRegistered === "no") pensionIssues.push("Company is not registered with a qualifying pension scheme.");
  if (hasNonCompliantPension) pensionIssues.push("One or more eligible employees are not enrolled in auto-enrolment.");

  const contractsIssues: string[] = [];
  if (!progress.contracts) contractsIssues.push("Contracts section not completed.");
  if (contractsTotal > 0 && contractsPassed < contractsTotal) {
    contractsIssues.push(`${contractsTotal - contractsPassed} contract(s) failed validation checks.`);
  }

  const financialIssues: string[] = [];
  if (!progress.financial) financialIssues.push("Financial viability section not completed.");
  if ((financialData.balance ?? 0) < 10425) financialIssues.push(`Closing balance (£${(financialData.balance ?? 0).toLocaleString()}) is below the required £10,425.`);
  if (financialData.netCashFlow != null && financialData.netCashFlow <= 0) financialIssues.push(`Net cash flow is negative or zero (£${financialData.netCashFlow.toLocaleString()}).`);
  if (hasFlaggedTransactions) financialIssues.push("High-risk or failed transactions were identified in the bank statement.");
  if (financialData.paymentsReflected === "no" && financialData.futureEngagement !== "yes") {
    financialIssues.push("Payments are not reflected in bank statement and no evidence of future engagement was provided.");
  }

  const workflows: Workflow[] = [
    {
      key: "rtw",
      title: "RTW & Start Date Compliance",
      subtitle: rtwSubtitle,
      compliant: (!!progress.rtw && !hasNonCompliantRTW) || !!manualOverrides.rtw,
      issues: !!manualOverrides.rtw ? [] : rtwIssues,
    },
    {
      key: "pension",
      title: "Pension Compliance",
      subtitle: pensionSubtitle,
      compliant: pensionCompliant || !!manualOverrides.pension,
      issues: !!manualOverrides.pension ? [] : pensionIssues,
    },
    {
      key: "auth",
      title: "Authorising Officer",
      subtitle: companyName ? `Validated for ${companyName}` : "Authorising Officer assessed",
      compliant: !!progress.auth || !!manualOverrides.auth,
      issues: !!manualOverrides.auth ? [] : authIssues,
    },
    {
      key: "contracts",
      title: "Client Contracts",
      subtitle: contractsSubtitle,
      compliant: contractsCompliant || !!manualOverrides.contracts,
      issues: !!manualOverrides.contracts ? [] : contractsIssues,
    },
    {
      key: "financial",
      title: "Financial Viability",
      subtitle: financialSubtitle,
      compliant: financialCompliant || !!manualOverrides.financial,
      issues: !!manualOverrides.financial ? [] : financialIssues,
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
        sessionStorage.removeItem(`company_name_${recordId}`);
        sessionStorage.removeItem(`bank_name_${recordId}`);
        sessionStorage.removeItem(`pension_data_${recordId}`);
        sessionStorage.removeItem(`report_edits_${recordId}`);
      }
      sessionStorage.removeItem("current_hr_record_id");
    } catch { }
    router.push("/employer/sections/company");
  };

  const persistSummaryHtml = async (html: string) => {
    if (!recordId) return;
    try {
      const token = getClientToken();
      await updateHRValidationRecordAction(Number(recordId), { html_content_for_summary: html }, token);
    } catch (err) {
      console.error("Error saving summary HTML:", err);
    }
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
          .print-only {
            display: inline-block !important;
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
        .print-only {
          display: none !important;
        }
      `}</style>
      <div className="no-print">
        <HRValidationTabs currentTabId="summary" hrRecordId={recordId} onBack={() => router.back()} />
      </div>

      <div style={{ position: "relative", maxWidth: "860px", margin: "30px auto" }}>
        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "0 24px", marginBottom: "20px" }}>
          <button
            onClick={() => {
              if (isEditMode) {
                if (printContainerRef.current) {
                  const html = printContainerRef.current.innerHTML;
                  setSavedHtml(html);
                  if (recordId) sessionStorage.setItem(`report_edits_${recordId}`, html);
                  void persistSummaryHtml(html);
                }
                setIsEditMode(false);
              } else {
                setIsEditMode(true);
              }
            }}
            style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: isEditMode ? "#0852C9" : "white", color: isEditMode ? "white" : "#0852C9", border: "1.5px solid #0852C9", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px", transition: "all 0.2s" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            {isEditMode ? "Finish Editing" : "Edit"}
          </button>
          <button
            onClick={() => { setActiveCommentSection("General"); setCommentText(comments["General"] || ""); }}
            style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "white", color: "#0852C9", border: "1.5px solid #0852C9", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px", transition: "all 0.2s" }}
          >
            <MessageIcon /> Provide Feedback
          </button>
        </div>

        <div
          id="print-container-content"
          ref={printContainerRef}
          className="print-container"
          style={{ padding: "0 24px", outline: isEditMode ? "2px dashed #CBD5E1" : "none", borderRadius: "12px", transition: "outline 0.2s", minHeight: "100px" }}
          suppressContentEditableWarning={true}
          onClick={handleContainerClick}
        >
          {!savedHtml && (
            loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "28px", position: "relative" }}>
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
                    <span className="editable-badge" style={{
                      padding: "5px 14px", borderRadius: "20px", fontSize: "12.5px", fontWeight: "700",
                      backgroundColor: allCompliant ? "#16A34A" : "#DC2626", color: "white",
                      cursor: isEditMode ? "pointer" : "default"
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
                      {financialData.outgoing != null && (
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Total Outgoing</div>
                          <div style={{ fontSize: "20px", fontWeight: "700", color: "#DC2626" }}>
                            £{financialData.outgoing.toLocaleString()}
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
                      <div key={w.key} className="workflow-item-card" style={{
                        padding: "14px 16px", backgroundColor: "#F8FAFC", borderRadius: "8px",
                        marginBottom: i < workflows.length - 1 ? "8px" : 0,
                        border: w.compliant ? "1px solid transparent" : "1px solid #FEE2E2",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "white", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon />
                            </div>
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>{w.title}</div>
                              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>{w.subtitle}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }} contentEditable={false}>
                            <button
                              className="no-print"
                              onClick={() => { setActiveCommentSection(`Workflow: ${w.title}`); setCommentText(comments[`Workflow: ${w.title}`] || ""); }}
                              style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "600", padding: "4px", marginRight: "4px" }}
                              title="Add Comment"
                            >
                              <MessageIcon />
                            </button>
                            <span
                              className="no-print editable-badge"
                              onClick={(e) => { if (!isEditMode) handleToggleOverride(w.key); }}
                              style={{
                                padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
                                backgroundColor: w.compliant ? "#16A34A" : "#DC2626", color: "white",
                                cursor: "pointer",
                                userSelect: "none",
                                transition: "all 0.2s"
                              }}
                              onMouseOver={(e) => e.currentTarget.style.opacity = "0.8"}
                              onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
                              title={isEditMode ? "Click to select badge" : "Click to manually toggle compliance status"}
                            >
                              {w.compliant ? "Compliant" : "Non-Compliant"}
                            </span>
                            {w.compliant ? <GreenCircleCheck /> : <RedCircleX />}
                          </div>
                        </div>

                        {/* Issues list */}
                        <div className="workflow-issues-list" style={{ marginTop: "12px", borderTop: "1px solid #FEE2E2", paddingTop: "10px", display: w.compliant ? "none" : "block" }}>
                          {w.issues.length > 0 ? (
                            w.issues.map((issue, idx) => (
                              <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: idx < w.issues.length - 1 ? "4px" : 0 }}>
                                <div style={{ color: "#DC2626", fontSize: "12px", marginTop: "2px" }}>•</div>
                                <div style={{ fontSize: "12.5px", color: "#991B1B", lineHeight: "1.4" }}>{issue}</div>
                              </div>
                            ))
                          ) : (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                              <div style={{ color: "#DC2626", fontSize: "12px", marginTop: "2px" }}>•</div>
                              <div style={{ fontSize: "12.5px", color: "#991B1B", lineHeight: "1.4" }}>Type specific issue details here...</div>
                            </div>
                          )}
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
                            {(emp.employee_full_name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>{emp.employee_full_name}</div>
                            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>{emp.nationality}</div>
                          </div>
                        </div>
                        <span className="editable-badge" style={{
                          padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                          backgroundColor: !["british", "irish", "british/irish"].includes(emp.nationality?.toLowerCase() || "")
                            ? "#7C3AED" : "#0852C9",
                          color: "white",
                          cursor: isEditMode ? "pointer" : "default"
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

              </>
            )
          )}
        </div>

        {/* Actions */}
        {!loading && (
          <div className="no-print" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "0 24px", marginTop: "24px" }}>
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
        )}
      </div>

      {badgeDropdown && (
        <div className="badge-dropdown-container" style={{
          position: "absolute", top: badgeDropdown.y, left: badgeDropdown.x, zIndex: 10000,
          backgroundColor: "white", border: "1px solid #E2E8F0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          padding: "8px", display: "flex", flexDirection: "column", gap: "4px"
        }}>
          {allBadges.map((b, i) => (
            <button key={i} onClick={() => selectBadge(b)} style={{
              padding: "6px 12px", border: "none", background: "none", cursor: "pointer", textAlign: "left",
              fontSize: "13px", fontWeight: "600", borderRadius: "4px", color: "#334155",
            }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#F1F5F9"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
              <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: b.bg, marginRight: "8px" }}></span>
              {b.label}
            </button>
          ))}
        </div>
      )}

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