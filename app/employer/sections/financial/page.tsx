'use client';

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import HRValidationTabs from "../_components/HRValidationTabs";
import {
  updateHRValidationRecordAction,
  listFinancialRecordsAction,
  createFinancialRecordAction,
  updateFinancialRecordAction,
  listHRValidationRecordsAction,
  listEmployeesAction,
} from "@/app/employer/sections/action/action";
import { getClientToken } from "@/app/employer/sections/company/page";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tab {
  label: string;
  id: string;
}

interface Step {
  id: string;
  label: string;
}

interface Progress {
  [key: string]: boolean;
}

interface Transaction {
  id: number;
  date?: string;
  amount: number;
  reference: string;
  type: "incoming" | "outgoing";
  status: "ok" | "fail";
  flags?: {
    is_large?: boolean;
    is_salary?: boolean;
    is_contractor?: boolean;
  };
}

interface VerificationResult {
  contract: string;
  status: string;
  match_details: string | null;
}

interface FinancialData {
  balance?: number | null;
  Opening_Balance?: number | null;
  Closing_Balance?: number | null;
  incoming?: number | null;
  outgoing?: number | null;
  netCashFlow?: number | null;
  transactions?: Transaction[];
  payment_incoming_total?: number | null;
  payment_outgoing_total?: number | null;
  paymentsReflected?: string | null;
  futureEngagement?: string | null;
  bank_statement_url?: string | null;
  contract_verification_results?: VerificationResult[] | null;
}

interface SavedContract {
  clientName?: string;
  contract_amount?: string;
  period?: string;
  [key: string]: unknown;
}

interface TopNavProps {
  onBack: () => void;
  onTabClick: (tabId: string) => void;
}

interface StepPillsProps {
  active: string;
  onStepClick: (id: string) => void;
  unlockedUpTo: number;
}

interface RadioRowProps {
  value: string;
  selected: string | null;
  onChange: (value: string) => void;
  label: string;
  desc?: string;
}

interface BalanceStepProps {
  onNext: () => void;
  onSave: (data: Partial<FinancialData>) => void;
  initialBalance?: number | null;
}

interface CashFlowStepProps {
  onNext: () => void;
  onPrev: () => void;
  onSave: (data: Partial<FinancialData>) => void;
  initialIncoming?: number | null;
  initialOutgoing?: number | null;
}

interface InvestmentsStepProps {
  onNext: () => void;
  onPrev: () => void;
  onSave: (data: Partial<FinancialData>) => void;
  initialTransactions?: Transaction[];
  initialOpening?: number | null;
  initialClosing?: number | null;
  employees?: any[];
  bankStatementUrl?: string | null;
}

interface ContractsSyncStepProps {
  onComplete: () => void;
  onPrev: () => void;
  savedContracts: SavedContract[];
  onSave: (data: Partial<FinancialData>) => void;
  initialPaymentsReflected?: string | null;
  initialFutureEngagement?: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────



const STEPS: Step[] = [
  { id: "balance", label: "1. Balance" },
  { id: "cashflow", label: "2. Cash Flow" },
  { id: "investments", label: "3. Investments" },
  { id: "contracts", label: "4. Contracts" },
];

const MIN_BALANCE = 10425;
const NON_COMPLIANT_REFS = ["loan", "gift", "director investment", "director's loan", "personal"];

// ─── Session helpers ──────────────────────────────────────────────────────────

function TopNav({ onBack }: { onBack: () => void }) {
  const searchParams = useSearchParams();
  const [recordId, setRecordId] = useState<number | null>(null);
  useEffect(() => {
    const queryId = searchParams.get("recordId") || searchParams.get("id");
    const id = queryId || sessionStorage.getItem("current_hr_record_id");
    if (id) setRecordId(Number(id));
  }, [searchParams]);
  return <HRValidationTabs currentTabId="financial" hrRecordId={recordId} onBack={onBack} />;
}

const markComplete = (recordId: number | null, key: string): void => {
  if (!recordId) return;
  try {
    const p = JSON.parse(sessionStorage.getItem(`hr_progress_${recordId}`) || "{}");
    sessionStorage.setItem(`hr_progress_${recordId}`, JSON.stringify({ ...p, [key]: true }));
  } catch { }
};

function getTransactionStatus(ref: string): "ok" | "fail" {
  const lower = (ref || "").toLowerCase();
  if (NON_COMPLIANT_REFS.some((r) => lower.includes(r))) return "fail";
  return "ok";
}

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

function formatDate(raw: string | null | undefined): string {
  if (!raw) return "";
  // Expected format: "DD Mon YY" e.g. "16 Jan 26"
  const parts = raw.trim().split(/\s+/);
  if (parts.length !== 3) return raw;
  const [dd, mon, yy] = parts;
  const mm = MONTH_MAP[mon.toLowerCase()];
  if (!mm) return raw;
  const year = parseInt(yy, 10) + 2000;
  return `${dd.padStart(2, "0")}-${mm}-${year}`;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const DollarIcon = (): React.JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    <path d="M10 2v16M6 5.5h5.5a2.5 2.5 0 010 5H8a2.5 2.5 0 000 5H14" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ArrowsIcon = (): React.JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    <path d="M4 7l3-3 3 3M7 4v12M16 13l-3 3-3-3M13 16V4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FileIcon = (): React.JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    <rect x="3" y="1" width="14" height="18" rx="2" stroke="#374151" strokeWidth="1.4" fill="none" />
    <path d="M6 7h8M6 10h8M6 13h5" stroke="#374151" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const WarnIcon = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M8 2L1 14h14L8 2z" stroke="#D97706" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
    <path d="M8 7v3M8 12v.5" stroke="#D97706" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const AlertRedIcon = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}>
    <path d="M8 2L1 14h14L8 2z" stroke="#DC2626" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
    <path d="M8 7v3M8 12v.5" stroke="#DC2626" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const GreenCircleCheck = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="9" cy="9" r="8" stroke="#16A34A" strokeWidth="1.4" fill="none" />
    <path d="M5.5 9l2.5 2.5L12.5 6" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SpinnerIcon = ({ color = "#0852C9" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="10" cy="10" r="8" stroke="#CBD5E1" strokeWidth="2.5" />
    <path d="M10 2a8 8 0 018 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const ArrowUpGreen = (): React.JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 11V3M7 3l-3 3M7 3l3 3" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowDownRed = (): React.JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 3v8M7 11l-3-3M7 11l3-3" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


const CloudIcon = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19L19 19C21.2091 19 23 17.2091 23 15C23 12.7909 21.2091 11 19 11C18.8296 11 18.6625 11.0107 18.4988 11.0317C17.7412 8.14811 15.1182 6 12 6C9.11584 6 6.6247 7.8258 5.67232 10.3957C3.12061 10.7483 1 12.9163 1 15.5C1 18.5376 3.46243 21 6.5 21L8 21" />
    <path d="M12 11V21M12 11L9 14M12 11L15 14" />
  </svg>
);

const TrashIcon = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
  </svg>
);

const PencilIcon = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const CheckIcon = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── StepPills ────────────────────────────────────────────────────────────────

function StepPills({ active, onStepClick, unlockedUpTo }: StepPillsProps): React.JSX.Element {
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "22px" }}>
      {STEPS.map((s, i) => {
        const isActive = s.id === active;
        const clickable = i <= unlockedUpTo;
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

// ─── RadioRow ─────────────────────────────────────────────────────────────────

function RadioRow({ value, selected, onChange, label, desc }: RadioRowProps): React.JSX.Element {
  const isSelected = selected === value;
  return (
    <div onClick={() => onChange(value)} style={{
      display: "flex", alignItems: "flex-start", gap: "12px",
      padding: "14px 16px", borderRadius: "8px", marginBottom: "8px",
      border: `1.5px solid ${isSelected ? "#0852C9" : "#E2E8F0"}`,
      backgroundColor: isSelected ? "#F0F6FF" : "white", cursor: "pointer",
    }}>
      <div style={{
        width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0, marginTop: "2px",
        border: `2px solid ${isSelected ? "#0852C9" : "#D1D5DB"}`,
        backgroundColor: isSelected ? "#0852C9" : "white",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isSelected && <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "white" }} />}
      </div>
      <div>
        <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#0F172A" }}>{label}</div>
        {desc && <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>{desc}</div>}
      </div>
    </div>
  );
}

// ─── BalanceStep ──────────────────────────────────────────────────────────────

function BalanceStep({ onNext, onSave, initialBalance, isSubmitting = false }: BalanceStepProps & { isSubmitting?: boolean }): React.JSX.Element {
  const [balance, setBalance] = useState<string>(initialBalance != null ? String(initialBalance) : "");

  // Sync internal state with prop if it changes (e.g. after async fetch)
  useEffect(() => {
    if (initialBalance != null) {
      setBalance(String(initialBalance));
    }
  }, [initialBalance]);
  // Sync manual input to parent state
  useEffect(() => {
    const n = balance !== "" ? parseFloat(balance) : null;
    onSave({ balance: n, Closing_Balance: n });
  }, [balance]);

  const num = balance !== "" ? parseFloat(balance) : null;
  const isCompliant = num !== null && !isNaN(num) && num >= MIN_BALANCE;
  const isInsufficient = num !== null && !isNaN(num) && num < MIN_BALANCE && balance !== "";

  const handleNext = (): void => { 
    onSave({ balance: num, Closing_Balance: num }); 
    onNext(); 
  };

  return (
    <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "28px 30px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <DollarIcon />
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>Step 1: Closing Balance Check</h3>
      </div>
      <p style={{ margin: "0 0 22px", fontSize: "13px", color: "#64748B" }}>Closing balance must be at least 3 months of Skilled Worker salary (£10,425)</p>

      <div style={{ marginBottom: "16px" }}>
        <label style={lbl}>Current Closing Balance (£)</label>
        <input
          type="number" value={balance} onChange={(e) => setBalance(e.target.value)}
          style={{ ...inputStyle, borderColor: balance && isInsufficient ? "#FCA5A5" : "#0852C9" }}
        />
      </div>

      {isCompliant && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "14px 16px", backgroundColor: "#F0FDF4", borderRadius: "8px", border: "1.5px solid #86EFAC", marginBottom: "16px" }}>
          <GreenCircleCheck />
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#166534" }}>Balance Compliant</div>
            <div style={{ fontSize: "13px", color: "#166534", marginTop: "2px" }}>£{num.toLocaleString()} exceeds the minimum threshold of £{MIN_BALANCE.toLocaleString()}</div>
          </div>
        </div>
      )}
      {isInsufficient && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "14px 16px", backgroundColor: "#FFF5F5", borderRadius: "8px", border: "1.5px solid #FCA5A5", marginBottom: "16px" }}>
          <AlertRedIcon />
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#DC2626" }}>Insufficient Balance</div>
            <div style={{ fontSize: "13px", color: "#DC2626", marginTop: "2px" }}>Balance of £{num.toLocaleString()} is below the required £{MIN_BALANCE.toLocaleString()}(3 months of £41,700 annual salary)</div>
          </div>
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={!balance || isSubmitting}
        style={{
          ...primaryBtn, width: "100%",
          backgroundColor: (balance && !isSubmitting) ? "#0852C9" : "#93ABDE",
          opacity: balance ? 1 : 0.5,
          cursor: (balance && !isSubmitting) ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
        }}
      >
        {isSubmitting && <SpinnerIcon color="#fff" />}
        {isSubmitting ? "Processing..." : "Continue to Cash Flow Check"}
      </button>
    </div>
  );
}

// ─── CashFlowStep ─────────────────────────────────────────────────────────────

function CashFlowStep({ onNext, onPrev, onSave, initialIncoming, initialOutgoing, isSubmitting = false }: CashFlowStepProps & { isSubmitting?: boolean }): React.JSX.Element {
  const [incoming, setIncoming] = useState<string>(initialIncoming != null ? String(initialIncoming) : "");
  const [outgoing, setOutgoing] = useState<string>(initialOutgoing != null ? String(initialOutgoing) : "");
  const inNum = incoming !== "" ? parseFloat(incoming) : null;
  const outNum = outgoing !== "" ? parseFloat(outgoing) : null;
  const net = (inNum !== null && outNum !== null) ? inNum - outNum : null;
  const positive = inNum !== null && outNum !== null && net !== null && net > 0;
  const negative = inNum !== null && outNum !== null && net !== null && net <= 0;
  const canContinue = incoming && outgoing;

  const handleNext = (): void => { onSave({ incoming: inNum, outgoing: outNum, netCashFlow: net }); onNext(); };

  return (
    <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "28px 30px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <ArrowsIcon />
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>Step 2: Cash Flow Pattern (Last 3 Months)</h3>
      </div>
      <p style={{ margin: "0 0 22px", fontSize: "13px", color: "#64748B" }}>Incoming must exceed outgoing for positive cash flow</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={lbl}><span style={{ display: "flex", alignItems: "center", gap: "6px" }}><ArrowUpGreen /> Total Incoming (£)</span></label>
          <input type="number" value={incoming} onChange={(e) => setIncoming(e.target.value)} placeholder="Total credits" style={inputStyle} />
        </div>
        <div>
          <label style={lbl}><span style={{ display: "flex", alignItems: "center", gap: "6px" }}><ArrowDownRed /> Total Outgoing (£)</span></label>
          <input type="number" value={outgoing} onChange={(e) => setOutgoing(e.target.value)} placeholder="Total debits" style={inputStyle} />
        </div>
      </div>

      {positive && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", backgroundColor: "#F0FDF4", borderRadius: "8px", border: "1.5px solid #86EFAC", marginBottom: "16px" }}>
          <ArrowsIcon />
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#166534" }}>Positive Cash Flow</div>
            <div style={{ fontSize: "13px", color: "#166534", marginTop: "2px" }}>Net cash flow: +£{net.toLocaleString()}</div>
          </div>
        </div>
      )}
      {negative && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", backgroundColor: "#FFF5F5", borderRadius: "8px", border: "1.5px solid #FCA5A5", marginBottom: "16px" }}>
          <AlertRedIcon />
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#DC2626" }}>Negative Cash Flow</div>
            <div style={{ fontSize: "13px", color: "#DC2626", marginTop: "2px" }}>Net cash flow: -£{Math.abs(net).toLocaleString()}</div>
          </div>
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={!canContinue || isSubmitting}
        style={{
          ...primaryBtn, width: "100%",
          backgroundColor: (canContinue && !isSubmitting) ? "#0852C9" : "#93ABDE",
          opacity: canContinue ? 1 : 0.5,
          cursor: (canContinue && !isSubmitting) ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
        }}
      >
        {isSubmitting && <SpinnerIcon color="#fff" />}
        {isSubmitting ? "Processing..." : "Continue to Investment Check"}
      </button>
    </div>
  );
}

// ─── InvestmentsStep ──────────────────────────────────────────────────────────

function InvestmentsStep({ onNext, onPrev, onSave, initialTransactions, initialOpening, initialClosing, isSubmitting = false, employees, bankStatementUrl }: InvestmentsStepProps & { isSubmitting?: boolean }): React.JSX.Element {
  const [amount, setAmount] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [type, setType] = useState<"incoming" | "outgoing">("incoming");
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions || []);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualOpening, setManualOpening] = useState(initialOpening != null ? String(initialOpening) : "");
  const [manualClosing, setManualClosing] = useState(initialClosing != null ? String(initialClosing) : "");

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Transaction | null>(null);

  // Search state
  const [searchDate, setSearchDate] = useState("");
  const [searchAmount, setSearchAmount] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchReference, setSearchReference] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset balances to null/empty so extracted data from PDF is used
    setManualOpening("");
    setManualClosing("");

    setIsUploading(true);
    const loadingToast = toast.loading("Uploading to secure storage...");

    try {
      // 1. Get presigned URL and upload to R2
      const presignRes = await axios.post("/api/upload-presign", {
        fileName: `Bank statements/${file.name}`,
        fileType: file.type || "application/pdf",
      });
      const { presignedUrl, publicUrl } = presignRes.data;

      await axios.put(presignedUrl, file, {
        headers: { "Content-Type": file.type || "application/pdf" },
      });

      setUploadedFileName(file.name);
      setIsUploading(false);
      toast.dismiss(loadingToast);
      setIsParsing(true);
      const parseToast = toast.loading("AI analysis in progress...");

      // 2. Call the AI parser with the public URL
      const response = await axios.post("/api/parse-bank-statement", {
        file_url: publicUrl,
        employee_name: (employees || []).map((e) => e.employee_full_name),
      });

      const resData = response.data;
      const bankStatement = resData.bank_statement || {};
      const extractionResult = resData.data || resData || {};
      const fetchedTransactions = bankStatement.all_transactions || extractionResult.transactions || [];

      if (!Array.isArray(fetchedTransactions)) {
        toast.error("Invalid response format from bank statement parser.");
        return;
      }

      const mapped: Transaction[] = fetchedTransactions.map((t: any, idx: number) => {
        const hasPaidOut = t.paid_out !== null && t.paid_out !== undefined && t.paid_out !== "" && String(t.paid_out).trim() !== "0";
        const hasPaidIn = t.paid_in !== null && t.paid_in !== undefined && t.paid_in !== "" && String(t.paid_in).trim() !== "0";

        const amtValue = hasPaidOut ? t.paid_out : (hasPaidIn ? t.paid_in : (t.amount || t.value || 0));
        const amt = typeof amtValue === 'string' ? parseFloat(amtValue.replace(/[^\d.-]/g, '')) : amtValue;

        const isIncoming = hasPaidIn || (!hasPaidOut && (t.type === "credit" || t.direction === "in" || (typeof amt === "number" && amt >= 0)));

        return {
          id: Date.now() + idx,
          date: formatDate(t.date),
          amount: Math.abs(amt || 0),
          reference: t.description || t.reference || t.memo || "Unknown",
          type: isIncoming ? "incoming" : "outgoing",
          status: getTransactionStatus(t.description || t.reference || t.memo || ""),
          flags: t.flags || {}
        };
      });

      // Auto-fill opening/closing balance
      const extractedOpening = bankStatement.opening_balance ?? extractionResult.opening_balance ?? extractionResult.openingBalance ?? null;
      const extractedClosing = bankStatement.closing_balance ?? extractionResult.closing_balance ?? extractionResult.closingBalance ?? null;
      if (extractedOpening !== null) setManualOpening(String(extractedOpening));
      if (extractedClosing !== null) setManualClosing(String(extractedClosing));

      const extractedPaidIn = bankStatement.total_paid_in ?? extractionResult.total_paid_in ?? null;
      const extractedPaidOut = bankStatement.total_paid_out ?? extractionResult.total_paid_out ?? null;

      onSave({ 
        bank_statement_url: publicUrl,
        payment_incoming_total: extractedPaidIn,
        payment_outgoing_total: extractedPaidOut,
        incoming: extractedPaidIn !== null ? Number(extractedPaidIn) : undefined,
        outgoing: extractedPaidOut !== null ? Number(extractedPaidOut) : undefined
      });

      if (mapped.length === 0) {
        toast.success("Parsed, but no transactions found in the statement.");
      } else {
        setTransactions(mapped);
        const largeCount = mapped.filter(t => t.amount >= 2000 || t.flags?.is_large).length;
        toast.success(`Successfully parsed ${mapped.length} transactions (${largeCount} high-value).`);
      }
      toast.dismiss(parseToast);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.details || "Failed to parse bank statement.");
    } finally {
      setIsUploading(false);
      setIsParsing(false);
      toast.dismiss(loadingToast);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAdd = (): void => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num < 2000 || !reference.trim()) return;
    setTransactions((prev) => [...prev, { id: Date.now(), amount: num, reference: reference.trim(), type, status: getTransactionStatus(reference) }]);
    setAmount(""); setReference(""); setType("incoming");
  };

  const handleDelete = (id: number): void => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success("Transaction deleted");
  };

  const handleEditStart = (t: Transaction): void => {
    setEditingId(t.id);
    setEditValues({ ...t });
  };

  const handleEditSave = (): void => {
    if (!editValues) return;
    setTransactions(prev => prev.map(t =>
      t.id === editingId
        ? { ...editValues, status: getTransactionStatus(editValues.reference) }
        : t
    ));
    setEditingId(null);
    setEditValues(null);
    toast.success("Transaction updated");
  };

  const handleEditCancel = (): void => {
    setEditingId(null);
    setEditValues(null);
  };

  // Sync manual balances with parent state in real-time
  useEffect(() => {
    const openingValue = manualOpening !== "" ? parseFloat(manualOpening) : null;
    const closingValue = manualClosing !== "" ? parseFloat(manualClosing) : null;
    onSave({
      Opening_Balance: openingValue,
      Closing_Balance: closingValue,
      balance: closingValue
    });
  }, [manualOpening, manualClosing]);

  const handleNext = (): void => {
    onSave({
      transactions,
      Opening_Balance: manualOpening !== "" ? parseFloat(manualOpening) : null,
      Closing_Balance: manualClosing !== "" ? parseFloat(manualClosing) : null
    });
    onNext();
  };

  return (
    <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "28px 30px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <DollarIcon />
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>Step 3: Large Transaction / Investment Check</h3>
        </div>

        {/* Upload Button */}
        <div>
          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing || isUploading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "#F0F9FF",
              border: "1.5px solid #0EA5E9",
              borderRadius: "8px",
              color: "#0369A1",
              fontSize: "13.5px",
              fontWeight: "600",
              cursor: (isParsing || isUploading) ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            {(isParsing || isUploading) ? <SpinnerIcon color="#0EA5E9" /> : <CloudIcon />}
            {isUploading ? "Uploading..." : isParsing ? "Analyzing..." : (uploadedFileName || bankStatementUrl) ? `Re-upload ${uploadedFileName ? `(${uploadedFileName})` : "Statement"}` : "Upload Bank Statement"}
          </button>
        </div>
      </div>

      {bankStatementUrl && (
        <div style={{ marginBottom: "20px", padding: "12px 16px", backgroundColor: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div style={{ flexShrink: 0, backgroundColor: "#DCFCE7", padding: "6px", borderRadius: "6px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <polyline points="9 15 12 18 15 15" />
                <line x1="12" y1="10" x2="12" y2="18" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#166534" }}>File stored successfully</p>
              <a href={bankStatementUrl} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#0852C9", textDecoration: "underline", wordBreak: "break-all" }}>
                {bankStatementUrl}
              </a>
            </div>
          </div>
        </div>
      )}
      <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748B" }}>Transactions ≥ £2,000 require reference verification. You can upload a PDF to auto-populate high-value items.</p>

      {/* Opening & Closing Balance */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" }}>
        <div>
          <label style={{ ...lbl }}>
            Opening Balance
            <span style={{ marginLeft: "6px", fontSize: "11px", fontWeight: "400", color: "#94A3B8" }}>(auto-filled on upload)</span>
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "#64748B", pointerEvents: "none" }}>£</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={manualOpening}
              onChange={(e) => setManualOpening(e.target.value)}
              placeholder="0.00"
              style={{
                ...inputStyle,
                paddingLeft: "26px",
                backgroundColor: manualOpening ? "#F0FDF4" : "white",
                transition: "border-color 0.2s, background-color 0.2s",
              }}
            />
          </div>
        </div>
        <div>
          <label style={{ ...lbl }}>
            Closing Balance
            <span style={{ marginLeft: "6px", fontSize: "11px", fontWeight: "400", color: "#94A3B8" }}>(auto-filled on upload)</span>
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "#64748B", pointerEvents: "none" }}>£</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={manualClosing}
              onChange={(e) => setManualClosing(e.target.value)}
              placeholder="0.00"
              style={{
                ...inputStyle,
                paddingLeft: "26px",
                backgroundColor: manualClosing ? "#F0FDF4" : "white",
                transition: "border-color 0.2s, background-color 0.2s",
              }}
            />
          </div>
        </div>
      </div>

      {/* Rules box */}
      <div style={{ backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "14px 18px", marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <WarnIcon />
          <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#374151" }}>Reference Check Rules</span>
        </div>
        <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "4px" }}>References flagging non-compliance:</div>
        <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "8px", paddingLeft: "12px" }}>• Loan, Gift, Director Investment, Director's Loan, Personal</div>
        <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "4px" }}>References indicating compliance:</div>
        <div style={{ fontSize: "13px", color: "#64748B", paddingLeft: "12px" }}>• Business Name, Invoice Number, Client Payment</div>
      </div>

      {/* Add transaction */}
      <div style={{ backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "16px 18px", marginBottom: "18px" }}>
        <p style={{ margin: "0 0 12px", fontSize: "13.5px", fontWeight: "600", color: "#0F172A" }}>Add Large Transaction Manually</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", alignItems: "end" }}>
          <div>
            <label style={lbl}>Amount (£)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="≥ 2000" style={inputStyle} />
          </div>
          <div>
            <label style={lbl}>Reference</label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction reference" style={inputStyle} />
          </div>
          <div>
            <label style={lbl}>Type</label>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", paddingTop: "4px" }}>
              {(["incoming", "outgoing"] as const).map((t) => (
                <label key={t} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", cursor: "pointer" }}>
                  <input type="radio" checked={type === t} onChange={() => setType(t)} style={{ accentColor: "#0852C9" }} /> {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", marginTop: "12px" }}>
          <button onClick={handleAdd} style={{ padding: "8px 16px", backgroundColor: "white", border: "1.5px solid #D1D5DB", borderRadius: "6px", fontSize: "13px", cursor: "pointer", color: "#374151" }}>
            Add Transaction
          </button>
        </div>
      </div>

      {/* Transactions table */}
      {transactions.length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
              <div style={{ position: "relative" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" placeholder="Date..." value={searchDate} onChange={(e) => setSearchDate(e.target.value)} style={{ padding: "8px 12px 8px 30px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" }} />
              </div>
              <div style={{ position: "relative" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" placeholder="Amount..." value={searchAmount} onChange={(e) => setSearchAmount(e.target.value)} style={{ padding: "8px 12px 8px 30px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" }} />
              </div>
              <div style={{ position: "relative" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" placeholder="Type..." value={searchType} onChange={(e) => setSearchType(e.target.value)} style={{ padding: "8px 12px 8px 30px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" }} />
              </div>
              <div style={{ position: "relative" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" placeholder="Reference / Note..." value={searchReference} onChange={(e) => setSearchReference(e.target.value)} style={{ padding: "8px 12px 8px 30px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>
          <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 2fr 1fr 1fr", padding: "10px 14px", backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              {["Date", "Amount", "Type", "Reference", "Status", "Actions"].map((h) => <div key={h} style={{ fontSize: "12.5px", color: "#64748B", fontWeight: "600" }}>{h}</div>)}
            </div>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {transactions.filter(t => {
                if (searchDate && (!t.date || !t.date.toLowerCase().includes(searchDate.toLowerCase()))) return false;
                if (searchAmount && !String(t.amount).includes(searchAmount)) return false;
                if (searchType && !t.type.toLowerCase().includes(searchType.toLowerCase())) return false;
                if (searchReference && !t.reference.toLowerCase().includes(searchReference.toLowerCase())) return false;
                return true;
              }).map((t) => {
                const isEditing = editingId === t.id;
                return (
                  <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 2fr 1fr 1fr", padding: "12px 4px", borderBottom: "1px solid #F1F5F9", alignItems: "center" }}>
                    {isEditing ? (
                      <>
                        <div style={{ fontSize: "13px", color: "#374151", padding: "4px" }}>{editValues?.date || "—"}</div>
                        <div><input type="number" value={editValues?.amount} onChange={(e) => setEditValues(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)} style={{ ...inputStyle, padding: "4px 8px" }} /></div>
                        <div>
                          <select value={editValues?.type} onChange={(e) => setEditValues(prev => prev ? { ...prev, type: e.target.value as "incoming" | "outgoing" } : null)} style={{ ...inputStyle, padding: "4px 8px" }}>
                            <option value="incoming">Incoming</option>
                            <option value="outgoing">Outgoing</option>
                          </select>
                        </div>
                        <div><input type="text" value={editValues?.reference} onChange={(e) => setEditValues(prev => prev ? { ...prev, reference: e.target.value } : null)} style={{ ...inputStyle, padding: "4px 8px" }} /></div>
                        <div />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={handleEditSave} title="Save" style={iconBtn}><CheckIcon /></button>
                          <button onClick={handleEditCancel} title="Cancel" style={iconBtn}><XIcon /></button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          style={{ fontSize: "13px", color: "#374151", padding: "4px", fontVariantNumeric: "tabular-nums" }}
                        >
                          {t.date || "—"}
                        </div>
                        <div
                          onClick={() => handleEditStart(t)}
                          title="Click to edit"
                          style={{ fontSize: "14px", color: "#0F172A", fontWeight: "500", cursor: "pointer", padding: "4px", borderRadius: "4px", transition: "background 0.2s" }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#F1F5F9"}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          £{t.amount.toLocaleString()}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                            {t.flags?.is_large && (
                              <span style={{ fontSize: "9px", backgroundColor: "#FEF2F2", color: "#DC2626", padding: "1px 6px", borderRadius: "4px", border: "1px solid #FECACA", fontWeight: "600", textTransform: "uppercase" }}>Large</span>
                            )}
                            {t.flags?.is_salary && (
                              <span style={{ fontSize: "9px", backgroundColor: "#F0FDF4", color: "#166534", padding: "1px 6px", borderRadius: "4px", border: "1px solid #BBF7D0", fontWeight: "600", textTransform: "uppercase" }}>Salary</span>
                            )}
                            {t.flags?.is_contractor && (
                              <span style={{ fontSize: "9px", backgroundColor: "#EFF6FF", color: "#1D4ED8", padding: "1px 6px", borderRadius: "4px", border: "1px solid #BFDBFE", fontWeight: "600", textTransform: "uppercase" }}>Contractor</span>
                            )}
                            {(!t.flags || Object.keys(t.flags).length === 0) && t.amount >= 2000 && (
                              <span style={{ fontSize: "9px", backgroundColor: "#F1F5F9", color: "#475569", padding: "1px 6px", borderRadius: "4px", border: "1px solid #E2E8F0", fontWeight: "600", textTransform: "uppercase" }}>Large</span>
                            )}
                          </div>
                        </div>
                        <div
                          onClick={() => handleEditStart(t)}
                          title="Click to edit"
                          style={{ fontSize: "13.5px", color: "#374151", textTransform: "capitalize", cursor: "pointer", padding: "4px", borderRadius: "4px", transition: "background 0.2s" }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#F1F5F9"}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          {t.type}
                        </div>
                        <div
                          onClick={() => handleEditStart(t)}
                          title="Click to edit"
                          style={{ fontSize: "13.5px", color: "#374151", cursor: "pointer", padding: "4px", borderRadius: "4px", transition: "background 0.2s" }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#F1F5F9"}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          {t.reference}
                        </div>
                        <div>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: t.status === "ok" ? "#0852C9" : "#DC2626", color: "white" }}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="white" strokeWidth="1.2" fill="none" />{t.status === "ok" ? <path d="M3 5l1.5 1.5L7 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" /> : <path d="M3.5 3.5l3 3M6.5 3.5l-3 3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />}</svg>
                            {t.status === "ok" ? "OK" : "Flag"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => handleDelete(t.id)} title="Delete" style={{ ...iconBtn, color: "#DC2626" }}><TrashIcon /></button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={isSubmitting}
        style={{
          ...primaryBtn, width: "100%",
          backgroundColor: isSubmitting ? "#93ABDE" : "#0852C9",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
        }}
      >
        {isSubmitting && <SpinnerIcon color="#fff" />}
        {isSubmitting ? "Processing..." : "Continue to Contract Payment Sync"}
      </button>
    </div>
  );
}

// ─── ContractsSyncStep ────────────────────────────────────────────────────────

interface SyncStatus {
  ok: boolean;
  label: string | null;
  desc?: string;
}

function ContractsSyncStep({ onComplete, onPrev, savedContracts, onSave, initialPaymentsReflected, initialFutureEngagement, isSubmitting = false, financialData }: ContractsSyncStepProps & { isSubmitting?: boolean, financialData: FinancialData }): React.JSX.Element {
  const [paymentsReflected, setPaymentsReflected] = useState<string | null>(initialPaymentsReflected ?? null);
  const [futureEngagement, setFutureEngagement] = useState<string | null>(initialFutureEngagement ?? null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[] | null>(financialData.contract_verification_results ?? null);

  const persistSelection = (payments: string | null, future: string | null, results: VerificationResult[] | null = null): void => {
    onSave({ 
      paymentsReflected: payments, 
      futureEngagement: future,
      contract_verification_results: results || verificationResults
    });
  };

  const handleVerify = async () => {
    if (!savedContracts || savedContracts.length === 0) {
      toast.error("No contracts found to verify.");
      return;
    }

    setIsVerifying(true);
    const loadingToast = toast.loading("Verifying contracts with bank statements...");

    try {
      const payload = {
        contract_result: {
          contracts: savedContracts.map(c => ({
            contract_amount: c.contract_amount || "0 GBP",
            period: c.period || "monthly"
          })),
          parties: Array.from(new Set(savedContracts.map(c => c.clientName).filter(Boolean)))
        },
        bank_result: {
          data: {
            transactions: financialData.transactions?.map(t => ({
              date: t.date,
              description: t.reference,
              paid_in: t.type === "incoming" ? t.amount : 0,
              paid_out: t.type === "outgoing" ? t.amount : 0
            })) || []
          }
        }
      };

      const response = await axios.post("/api/verify-contracts", payload);
      const results = response.data.verification_summary || [];
      setVerificationResults(results);
      
      if (response.data.total_verified > 0) {
        toast.success(`Successfully verified ${response.data.total_verified} contract(s)!`);
        setPaymentsReflected("yes");
        persistSelection("yes", futureEngagement, results);
      } else {
        toast.error("No matching transactions found for the contracts.");
        persistSelection(paymentsReflected, futureEngagement, results);
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error("Failed to verify contracts.");
    } finally {
      setIsVerifying(false);
      toast.dismiss(loadingToast);
    }
  };

  const getStatus = (): SyncStatus | null => {
    if (paymentsReflected === "yes") return { ok: true, label: null };
    if (paymentsReflected === "no" && futureEngagement === "yes") return { ok: true, label: "Compliant", desc: "Future engagement is acceptable - payments expected in future." };
    if (paymentsReflected === "no" && futureEngagement === "no") return { ok: false, label: "Non-Compliant", desc: "Contract dates have expired and payments are not reflected. This flags non-compliance." };
    return null;
  };

  const status = getStatus();
  const canComplete = paymentsReflected === "yes" || (paymentsReflected === "no" && futureEngagement !== null);

  return (
    <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "28px 30px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FileIcon />
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>Step 4: Synchronize with Client Agreements</h3>
        </div>
        <button
          onClick={handleVerify}
          disabled={isVerifying || !savedContracts?.length}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 16px", backgroundColor: "#F0F9FF",
            border: "1.5px solid #0EA5E9", borderRadius: "8px",
            color: "#0369A1", fontSize: "13px", fontWeight: "600",
            cursor: (isVerifying || !savedContracts?.length) ? "not-allowed" : "pointer"
          }}
        >
          {isVerifying ? <SpinnerIcon color="#0EA5E9" /> : <CheckIcon />}
          {isVerifying ? "Verifying..." : "Verify via AI"}
        </button>
      </div>
      <p style={{ margin: "0 0 18px", fontSize: "13px", color: "#64748B" }}>Verify that contract payments are reflected in bank statements</p>

      {/* Contracts list */}
      {savedContracts && savedContracts.length > 0 && (
        <div style={{ backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "14px 18px", marginBottom: "18px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "13.5px", fontWeight: "600", color: "#374151" }}>Contracts to verify:</p>
          <div style={{ display: "grid", gap: "8px" }}>
            {savedContracts.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "white", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FileIcon />
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#0F172A" }}>{c.clientName || "Unknown Client"}</div>
                    <div style={{ fontSize: "12px", color: "#64748B" }}>{c.contract_amount || "N/A"} • {c.period || "N/A"}</div>
                  </div>
                </div>
                {verificationResults?.find(r => r.contract.includes(c.contract_amount || "")) && (
                  <span style={{
                    fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "12px",
                    backgroundColor: verificationResults.find(r => r.contract.includes(c.contract_amount || ""))?.status === "Verified" ? "#DCFCE7" : "#FEE2E2",
                    color: verificationResults.find(r => r.contract.includes(c.contract_amount || ""))?.status === "Verified" ? "#166534" : "#991B1B"
                  }}>
                    {verificationResults.find(r => r.contract.includes(c.contract_amount || ""))?.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Details */}
      {verificationResults && verificationResults.some(r => r.match_details) && (
        <div style={{ marginBottom: "18px", padding: "14px", backgroundColor: "#F0FDF4", borderRadius: "8px", border: "1.5px solid #86EFAC" }}>
          <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: "700", color: "#166534" }}>AI Match Findings:</p>
          {verificationResults.map((r, i) => r.match_details && (
            <div key={i} style={{ fontSize: "12.5px", color: "#166534", marginBottom: "4px" }}>
              • <strong>{r.contract}</strong>: {r.match_details}
            </div>
          ))}
        </div>
      )}

      {/* Payments reflected */}
      <p style={{ margin: "0 0 10px", fontSize: "13.5px", fontWeight: "600", color: "#0F172A" }}>Are contract payments reflected in bank statements?</p>
      <RadioRow value="yes" selected={paymentsReflected} onChange={(v) => { setPaymentsReflected(v); persistSelection(v, futureEngagement); }} label="Yes - Payments reflected" desc="Paid in full, or initial deposit with subsequent monthly payments visible" />
      <RadioRow value="no" selected={paymentsReflected} onChange={(v) => { setPaymentsReflected(v); setFutureEngagement(null); persistSelection(v, null); }} label="No - Payments not visible" desc="Contract payments are not reflected in bank statements" />

      {/* Future engagement */}
      {paymentsReflected === "no" && (
        <div style={{ marginTop: "16px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "13.5px", fontWeight: "600", color: "#0F172A" }}>Is this for future engagement?</p>
          <RadioRow value="yes" selected={futureEngagement} onChange={(v) => { setFutureEngagement(v); persistSelection(paymentsReflected, v); }} label="Yes - Future engagement dates" />
          <RadioRow value="no" selected={futureEngagement} onChange={(v) => { setFutureEngagement(v); persistSelection(paymentsReflected, v); }} label="No - Dates have expired" />
        </div>
      )}

      {/* Status */}
      {status && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "16px",
          padding: "14px 16px", borderRadius: "8px",
          backgroundColor: status.ok ? "#F0FDF4" : "#FFF5F5",
          border: `1.5px solid ${status.ok ? "#86EFAC" : "#FCA5A5"}`,
        }}>
          {status.ok ? <GreenCircleCheck /> : <AlertRedIcon />}
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: status.ok ? "#166534" : "#DC2626" }}>{status.label}</div>
            {status.desc && <div style={{ fontSize: "13px", color: status.ok ? "#166534" : "#DC2626", marginTop: "2px" }}>{status.desc}</div>}
          </div>
        </div>
      )}

      <button
        onClick={onComplete}
        disabled={!canComplete || isSubmitting}
        style={{
          ...primaryBtn, width: "100%", marginTop: "16px",
          backgroundColor: (canComplete && !isSubmitting) ? "#0852C9" : "#93ABDE",
          opacity: canComplete ? 1 : 0.5,
          cursor: (canComplete && !isSubmitting) ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
        }}
      >
        {isSubmitting && <SpinnerIcon color="#fff" />}
        {isSubmitting ? "Completing..." : "Complete Financial Viability Check"}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancialPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>}>
      <FinancialPageImpl />
    </Suspense>
  );
}

function FinancialPageImpl(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<string>("balance");
  const [unlockedUpTo, setUnlockedUpTo] = useState<number>(0);
  const [financialData, setFinancialData] = useState<FinancialData>({});
  const [savedContracts, setSavedContracts] = useState<SavedContract[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [financialRecordId, setFinancialRecordId] = useState<number | null>(null);
  // hydrated: true once sessionStorage has been read, so step components
  // always mount with the correct initial values (not empty defaults)
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    const queryId = searchParams.get("recordId") || searchParams.get("id");
    const id = queryId || sessionStorage.getItem("current_hr_record_id");
    if (id) setRecordId(Number(id));

    // Hydration now relies solely on API fetching in the useEffect below

    if (id) {
      const numId = Number(id);
      setRecordId(numId);

      // Fetch financial records from the backend
      (async () => {
        try {
          const token = getClientToken();

          // Fetch employees to pass their names to the AI parser
          const empRes = await listEmployeesAction(numId, token);
          if (empRes.success) {
            setEmployees(empRes.data || []);
          }

          // Fetch HR Validation Record to get transactions
          const hrRes = await listHRValidationRecordsAction(token);
          if (hrRes.success && hrRes.data) {
            const hrRecord = hrRes.data.find((r: any) => r.id === numId);
            if (hrRecord) {
              setSavedContracts(hrRecord.result_complete_sections?.contracts || []);
              setFinancialData(prev => ({
                ...prev,
                transactions: hrRecord.transactions 
                  ? (typeof hrRecord.transactions === 'string' ? JSON.parse(hrRecord.transactions) : hrRecord.transactions)
                  : prev.transactions,
                Opening_Balance: hrRecord.Opening_Balance ?? prev.Opening_Balance,
                Closing_Balance: hrRecord.Closing_Balance ?? prev.Closing_Balance,
                bank_statement_url: hrRecord.bank_statement_url ?? prev.bank_statement_url,
                payment_incoming_total: hrRecord.payment_incoming_total ?? prev.payment_incoming_total,
                payment_outgoing_total: hrRecord.payment_outgoing_total ?? prev.payment_outgoing_total,
                // Also sync Step 2 fields if they are missing
                incoming: hrRecord.payment_incoming_total != null ? parseFloat(hrRecord.payment_incoming_total) : prev.incoming,
                outgoing: hrRecord.payment_outgoing_total != null ? parseFloat(hrRecord.payment_outgoing_total) : prev.outgoing,
                contract_verification_results: hrRecord.result_complete_sections?.contract_verification_results || prev.contract_verification_results
              }));
            }
          }

          const res = await listFinancialRecordsAction(token);
          if (res.success && res.data) {
            const finRecord = res.data.find(r => r.HRValidationRecord_id === numId);
            if (finRecord) {
              setFinancialRecordId(finRecord.id);
              setFinancialData(prev => ({
                ...prev,
                // Use Closing_Balance from HR record (set above) as the source of truth for Step 1
                balance: prev.Closing_Balance != null ? prev.Closing_Balance : prev.balance,
                incoming: finRecord.payment_incoming_total != null ? parseFloat(finRecord.payment_incoming_total) : prev.incoming,
                outgoing: finRecord.payment_outgoing_total != null ? parseFloat(finRecord.payment_outgoing_total) : prev.outgoing,
                payment_incoming_total: finRecord.payment_incoming_total != null ? parseFloat(finRecord.payment_incoming_total) : prev.payment_incoming_total,
                payment_outgoing_total: finRecord.payment_outgoing_total != null ? parseFloat(finRecord.payment_outgoing_total) : prev.payment_outgoing_total,
                paymentsReflected: finRecord.payments_reflected_in_bank === true ? "yes" : finRecord.payments_reflected_in_bank === false ? "no" : prev.paymentsReflected,
                futureEngagement: finRecord.is_future_engagement === true ? "yes" : finRecord.is_future_engagement === false ? "no" : prev.futureEngagement,
              }));
            }
          }
        } catch (err) {
          console.error("Error fetching financial records:", err);
        } finally {
          setHydrated(true);
        }
      })();
    } else {
      setHydrated(true);
    }
  }, [searchParams]);

  const stepIds = ["balance", "cashflow", "investments", "contracts"];
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goToStep = (id: string): void => setStep(id);

  const handleNext = (currentStep: string): void => {
    const idx = stepIds.indexOf(currentStep);
    if (idx < stepIds.length - 1) {
      const nextStep = stepIds[idx + 1];
      setStep(nextStep);
      setUnlockedUpTo(Math.max(unlockedUpTo, idx + 1));
    }
  };

  const handleSave = (data: Partial<FinancialData>): void => {
    setFinancialData((prev) => {
      const merged = { ...prev, ...data };
      return merged;
    });
  };

  const handleComplete = async (): Promise<void> => {
    setIsSubmitting(true);
    markComplete(recordId, "financial");

    if (recordId) {
      const token = getClientToken();

      try {
        // Fetch latest saved results to preserve other sections
        const currentSaved = await getSavedResults(recordId);

        // Ensure we use the most up-to-date balance for both fields
        const finalBalance = financialData.balance ?? financialData.Closing_Balance;

        // Save global transactions in HR Validation Record
        await updateHRValidationRecordAction(recordId, {
          transactions: financialData.transactions,
          Opening_Balance: financialData.Opening_Balance,
          Closing_Balance: finalBalance,
          bank_statement_url: financialData.bank_statement_url,
          payment_incoming_total: financialData.incoming,
          payment_outgoing_total: financialData.outgoing,
          result_complete_sections: {
            ...currentSaved,
            contract_verification_results: financialData.contract_verification_results,
          }
        }, token);

        // Prepare payload for Financial Record
        const payload = {
          current_closing_balance_gbp: finalBalance != null ? String(finalBalance) : null,
          total_incoming_gbp_credits: financialData.incoming != null ? String(financialData.incoming) : null,
          total_outgoing_gbp_debits: financialData.outgoing != null ? String(financialData.outgoing) : null,
          payment_incoming_total: financialData.incoming != null ? String(financialData.incoming) : null,
          payment_outgoing_total: financialData.outgoing != null ? String(financialData.outgoing) : null,
          payments_reflected_in_bank: financialData.paymentsReflected === "yes" ? true : financialData.paymentsReflected === "no" ? false : null,
          is_future_engagement: financialData.futureEngagement === "yes" ? true : financialData.futureEngagement === "no" ? false : null,
          HRValidationRecord_id: recordId,
        };

        // Create or update Financial Record
        if (financialRecordId) {
          await updateFinancialRecordAction(financialRecordId, payload, token);
        } else {
          const res = await createFinancialRecordAction(payload, token);
          if (res.success && res.data) {
            setFinancialRecordId(res.data.id);
          }
        }
        router.push(`/employer/sections/summary?recordId=${recordId}`);
      } catch (err) {
        console.error("Error completing financial check:", err);
        setIsSubmitting(false);
      }
    } else {
      router.push(`/employer/sections/summary?recordId=${recordId}`);
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

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
      <TopNav onBack={() => router.back()} />

      <div style={{ maxWidth: "860px", margin: "30px auto", padding: "0 24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.3px" }}>Workflow 5: Bank Balance &amp; Financial Viability</h2>
          <p style={{ margin: "6px 0 0", fontSize: "13.5px", color: "#64748B" }}>Verify financial health and compliance for sponsor licence</p>
        </div>

        <StepPills active={step} onStepClick={goToStep} unlockedUpTo={unlockedUpTo} />

        {!hydrated && (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
            <SpinnerIcon />
          </div>
        )}
        {hydrated && step === "balance" && <BalanceStep onNext={() => { handleNext("balance"); }} onSave={handleSave} initialBalance={financialData.balance} isSubmitting={isSubmitting} />}
        {hydrated && step === "cashflow" && <CashFlowStep onNext={() => handleNext("cashflow")} onPrev={() => setStep("balance")} onSave={handleSave} initialIncoming={financialData.incoming} initialOutgoing={financialData.outgoing} isSubmitting={isSubmitting} />}
        {hydrated && step === "investments" && (
          <InvestmentsStep
            onNext={() => handleNext("investments")}
            onPrev={() => setStep("cashflow")}
            onSave={handleSave}
            initialTransactions={financialData.transactions}
            initialOpening={financialData.Opening_Balance}
            initialClosing={financialData.Closing_Balance}
            isSubmitting={isSubmitting}
            employees={employees}
            bankStatementUrl={financialData.bank_statement_url}
          />
        )}
        {hydrated && step === "contracts" && (
          <ContractsSyncStep
            onComplete={handleComplete}
            onPrev={() => setStep("investments")}
            savedContracts={savedContracts}
            onSave={handleSave}
            initialPaymentsReflected={financialData.paymentsReflected}
            initialFutureEngagement={financialData.futureEngagement}
            isSubmitting={isSubmitting}
            financialData={financialData}
          />
        )}

        <div style={{ marginTop: "20px" }}>
          {step === "balance" ? (
            <button onClick={() => router.push(`/employer/sections/contracts?recordId=${recordId}`)} style={backBtn}>Back to Contract Validation</button>
          ) : (
            <button onClick={() => { const idx = stepIds.indexOf(step); setStep(stepIds[idx - 1]); }} style={backBtn}>Previous Step</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const lbl: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #0852C9", fontSize: "14px", outline: "none", boxSizing: "border-box", color: "#0F172A", backgroundColor: "white" };
const primaryBtn: React.CSSProperties = { padding: "13px 20px", borderRadius: "8px", border: "none", backgroundColor: "#0852C9", color: "white", fontSize: "14px", fontWeight: "600" };
const backBtn: React.CSSProperties = { padding: "10px 20px", backgroundColor: "white", color: "#374151", border: "1.5px solid #D1D5DB", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer" };
const iconBtn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", backgroundColor: "transparent", border: "none", cursor: "pointer", color: "#64748B", transition: "color 0.2s" };