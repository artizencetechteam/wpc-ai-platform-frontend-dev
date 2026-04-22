'use client';

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import HRValidationTabs from "../_components/HRValidationTabs";

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
}

interface FinancialData {
  balance?: number;
  incoming?: number;
  outgoing?: number;
  netCashFlow?: number;
  transactions?: Transaction[];
  paymentsReflected?: string | null;
  futureEngagement?: string | null;
}

interface SavedContract {
  clientName?: string;
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
  initialBalance?: number;
}

interface CashFlowStepProps {
  onNext: () => void;
  onPrev: () => void;
  onSave: (data: Partial<FinancialData>) => void;
  initialIncoming?: number;
  initialOutgoing?: number;
}

interface InvestmentsStepProps {
  onNext: () => void;
  onPrev: () => void;
  onSave: (data: Partial<FinancialData>) => void;
  initialTransactions?: Transaction[];
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

const markComplete = (key: string): void => {
  try {
    const p = JSON.parse(sessionStorage.getItem("hr_progress") || "{}");
    sessionStorage.setItem("hr_progress", JSON.stringify({ ...p, [key]: true }));
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

function BalanceStep({ onNext, onSave, initialBalance }: BalanceStepProps): React.JSX.Element {
  const [balance, setBalance] = useState<string>(initialBalance != null ? String(initialBalance) : "");
  const num = parseFloat(balance);
  const isCompliant = !isNaN(num) && num >= MIN_BALANCE;
  const isInsufficient = !isNaN(num) && num < MIN_BALANCE && balance !== "";

  const handleNext = (): void => { onSave({ balance: num }); onNext(); };

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

      <button onClick={handleNext} disabled={!balance} style={{ ...primaryBtn, width: "100%", opacity: balance ? 1 : 0.5, cursor: balance ? "pointer" : "not-allowed" }}>
        Continue to Cash Flow Check
      </button>
    </div>
  );
}

// ─── CashFlowStep ─────────────────────────────────────────────────────────────

function CashFlowStep({ onNext, onPrev, onSave, initialIncoming, initialOutgoing }: CashFlowStepProps): React.JSX.Element {
  const [incoming, setIncoming] = useState<string>(initialIncoming != null ? String(initialIncoming) : "");
  const [outgoing, setOutgoing] = useState<string>(initialOutgoing != null ? String(initialOutgoing) : "");
  const inNum = parseFloat(incoming) || 0;
  const outNum = parseFloat(outgoing) || 0;
  const net = inNum - outNum;
  const positive = inNum > 0 && outNum > 0 && net > 0;
  const negative = inNum > 0 && outNum > 0 && net <= 0;
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

      <button onClick={handleNext} disabled={!canContinue} style={{ ...primaryBtn, width: "100%", opacity: canContinue ? 1 : 0.5, cursor: canContinue ? "pointer" : "not-allowed" }}>
        Continue to Investment Check
      </button>
    </div>
  );
}

// ─── InvestmentsStep ──────────────────────────────────────────────────────────

function InvestmentsStep({ onNext, onPrev, onSave, initialTransactions }: InvestmentsStepProps): React.JSX.Element {
  const [amount, setAmount] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [type, setType] = useState<"incoming" | "outgoing">("incoming");
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions || []);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const hrRecordId = sessionStorage.getItem("current_hr_record_id");
    const storedBankName = hrRecordId ? sessionStorage.getItem(`bank_name_${hrRecordId}`) : null;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bank_name", storedBankName || "Generic (AI Vision)");
    formData.append("manual_opening", "0");
    formData.append("manual_closing", "0");
    formData.append("employee_name", "string");

    setIsParsing(true);
    const loadingToast = toast.loading("Parsing bank statement...");

    try {
      const response = await axios.post("/api/extract-bank-statement", formData);

      const resData = response.data;
      // Handle different API response structures (e.g., { data: { transactions: [] } } or { transactions: [] })
      const extractionResult = resData.data || resData || {};
      const fetchedTransactions = extractionResult.transactions || [];

      if (!Array.isArray(fetchedTransactions)) {
        console.error("Fetched transactions is not an array:", fetchedTransactions);
        toast.error("Invalid response format from bank statement parser.");
        return;
      }

      const mapped: Transaction[] = fetchedTransactions.map((t: any, idx: number) => {
        // Handle various field names for amount
        const hasPaidOut = t.paid_out !== null && t.paid_out !== undefined && t.paid_out !== "" && String(t.paid_out).trim() !== "0";
        const hasPaidIn = t.paid_in !== null && t.paid_in !== undefined && t.paid_in !== "" && String(t.paid_in).trim() !== "0";

        const amtValue = hasPaidOut ? t.paid_out : (hasPaidIn ? t.paid_in : (t.amount || t.value || 0));
        const amt = typeof amtValue === 'string' ? parseFloat(amtValue.replace(/[^\d.-]/g, '')) : amtValue;

        // Handle various field names for type/direction
        let isIncoming = true;
        if (hasPaidOut) {
          isIncoming = false;
        } else if (hasPaidIn) {
          isIncoming = true;
        } else if (t.type === "debit" || t.direction === "out") {
          isIncoming = false;
        } else if (t.type === "credit" || t.direction === "in") {
          isIncoming = true;
        } else if (typeof amt === 'number') {
          isIncoming = amt >= 0;
        }

        return {
          id: Date.now() + idx,
          date: formatDate(t.date),
          amount: Math.abs(amt || 0),
          reference: t.description || t.reference || t.memo || "Unknown",
          type: isIncoming ? "incoming" : "outgoing",
          status: getTransactionStatus(t.description || t.reference || t.memo || ""),
        };
      });

      if (mapped.length === 0) {
        toast.success("Parsed, but no transactions found in the statement.");
      } else {
        setTransactions(prev => [...prev, ...mapped]);

        const largeCount = mapped.filter(t => t.amount >= 2000).length;
        if (largeCount > 0) {
          toast.success(`Successfully parsed ${mapped.length} transactions (${largeCount} high-value).`);
        } else {
          toast.success(`Successfully parsed ${mapped.length} transactions.`);
        }
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMsg = error.response?.data?.details || "Failed to parse bank statement.";
      toast.error(errorMsg);
    } finally {
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

  const handleNext = (): void => { onSave({ transactions }); onNext(); };

  return (
    <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "28px 30px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
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
            disabled={isParsing}
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
              cursor: isParsing ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            {isParsing ? <SpinnerIcon color="#0EA5E9" /> : <CloudIcon />}
            {isParsing ? "Analyzing..." : "Upload Bank Statement"}
          </button>
        </div>
      </div>
      <p style={{ margin: "0 0 18px", fontSize: "13px", color: "#64748B" }}>Transactions ≥ £2,000 require reference verification. You can upload a PDF to auto-populate high-value items.</p>

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
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Date..." value={searchDate} onChange={(e) => setSearchDate(e.target.value)} style={{ padding: "8px 12px 8px 30px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" }} />
              </div>
              <div style={{ position: "relative" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Amount..." value={searchAmount} onChange={(e) => setSearchAmount(e.target.value)} style={{ padding: "8px 12px 8px 30px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" }} />
              </div>
              <div style={{ position: "relative" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Type..." value={searchType} onChange={(e) => setSearchType(e.target.value)} style={{ padding: "8px 12px 8px 30px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" }} />
              </div>
              <div style={{ position: "relative" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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
                        {t.amount >= 2000 && (
                          <span style={{
                            marginLeft: "8px",
                            fontSize: "10px",
                            backgroundColor: "#F0F9FF",
                            color: "#0369A1",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid #B9E6FE",
                            verticalAlign: "middle"
                          }}>
                            Large
                          </span>
                        )}
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

      <button onClick={handleNext} style={{ ...primaryBtn, width: "100%" }}>
        Continue to Contract Payment Sync
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

function ContractsSyncStep({ onComplete, onPrev, savedContracts, onSave, initialPaymentsReflected, initialFutureEngagement }: ContractsSyncStepProps): React.JSX.Element {
  const [paymentsReflected, setPaymentsReflected] = useState<string | null>(initialPaymentsReflected ?? null);
  const [futureEngagement, setFutureEngagement] = useState<string | null>(initialFutureEngagement ?? null);

  const persistSelection = (payments: string | null, future: string | null): void => {
    onSave({ paymentsReflected: payments, futureEngagement: future });
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
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <FileIcon />
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>Step 4: Synchronize with Client Agreements</h3>
      </div>
      <p style={{ margin: "0 0 18px", fontSize: "13px", color: "#64748B" }}>Verify that contract payments are reflected in bank statements</p>

      {/* Contracts list */}
      {savedContracts && savedContracts.length > 0 && (
        <div style={{ backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "14px 18px", marginBottom: "18px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "13.5px", fontWeight: "600", color: "#374151" }}>Contracts to verify:</p>
          {savedContracts.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
              <FileIcon />
              <span style={{ fontSize: "13.5px", color: "#374151" }}>{c.clientName || String(c)}</span>
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

      <button onClick={onComplete} disabled={!canComplete} style={{ ...primaryBtn, width: "100%", marginTop: "16px", opacity: canComplete ? 1 : 0.5, cursor: canComplete ? "pointer" : "not-allowed" }}>
        Complete Financial Viability Check
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
  const [recordId, setRecordId] = useState<number | null>(null);
  // hydrated: true once sessionStorage has been read, so step components
  // always mount with the correct initial values (not empty defaults)
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    const queryId = searchParams.get("recordId") || searchParams.get("id");
    const id = queryId || sessionStorage.getItem("current_hr_record_id");
    if (id) setRecordId(Number(id));

    try {
      const c = sessionStorage.getItem("hr_contracts");
      if (c) setSavedContracts(JSON.parse(c) as SavedContract[]);
    } catch { }

    // Restore previously-saved financial data so it survives full-page navigation
    try {
      const f = sessionStorage.getItem("hr_financial_data");
      if (f) setFinancialData(JSON.parse(f) as FinancialData);
    } catch { }

    setHydrated(true);
  }, [searchParams]);

  const stepIds = ["balance", "cashflow", "investments", "contracts"];

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
      try {
        sessionStorage.setItem("hr_financial_data", JSON.stringify(merged));
      } catch { }
      return merged;
    });
  };

  const handleComplete = (): void => {
    markComplete("financial");
    router.push(`/employer/sections/summary?recordId=${recordId}`);
  };

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
        {hydrated && step === "balance" && <BalanceStep onNext={() => { handleNext("balance"); }} onSave={handleSave} initialBalance={financialData.balance} />}
        {hydrated && step === "cashflow" && <CashFlowStep onNext={() => handleNext("cashflow")} onPrev={() => setStep("balance")} onSave={handleSave} initialIncoming={financialData.incoming} initialOutgoing={financialData.outgoing} />}
        {hydrated && step === "investments" && <InvestmentsStep onNext={() => handleNext("investments")} onPrev={() => setStep("cashflow")} onSave={handleSave} initialTransactions={financialData.transactions} />}
        {hydrated && step === "contracts" && <ContractsSyncStep onComplete={handleComplete} onPrev={() => setStep("investments")} savedContracts={savedContracts} onSave={handleSave} initialPaymentsReflected={financialData.paymentsReflected} initialFutureEngagement={financialData.futureEngagement} />}

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