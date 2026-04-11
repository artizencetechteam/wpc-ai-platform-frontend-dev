'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
}

interface CashFlowStepProps {
  onNext: () => void;
  onPrev: () => void;
  onSave: (data: Partial<FinancialData>) => void;
}

interface InvestmentsStepProps {
  onNext: () => void;
  onPrev: () => void;
  onSave: (data: Partial<FinancialData>) => void;
}

interface ContractsSyncStepProps {
  onComplete: () => void;
  onPrev: () => void;
  savedContracts: SavedContract[];
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
  } catch {}
};

function getTransactionStatus(ref: string): "ok" | "fail" {
  const lower = (ref || "").toLowerCase();
  if (NON_COMPLIANT_REFS.some((r) => lower.includes(r))) return "fail";
  return "ok";
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

function BalanceStep({ onNext, onSave }: BalanceStepProps): React.JSX.Element {
  const [balance, setBalance] = useState<string>("");
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

function CashFlowStep({ onNext, onPrev, onSave }: CashFlowStepProps): React.JSX.Element {
  const [incoming, setIncoming] = useState<string>("");
  const [outgoing, setOutgoing] = useState<string>("");
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

function InvestmentsStep({ onNext, onPrev, onSave }: InvestmentsStepProps): React.JSX.Element {
  const [amount, setAmount] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [type, setType] = useState<"incoming" | "outgoing">("incoming");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleAdd = (): void => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num < 2000 || !reference.trim()) return;
    setTransactions((prev) => [...prev, { id: Date.now(), amount: num, reference: reference.trim(), type, status: getTransactionStatus(reference) }]);
    setAmount(""); setReference(""); setType("incoming");
  };

  const handleNext = (): void => { onSave({ transactions }); onNext(); };

  return (
    <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "28px 30px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <DollarIcon />
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>Step 3: Large Transaction / Investment Check</h3>
      </div>
      <p style={{ margin: "0 0 18px", fontSize: "13px", color: "#64748B" }}>Transactions ≥ £2,000 require reference verification</p>

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
        <p style={{ margin: "0 0 12px", fontSize: "13.5px", fontWeight: "600", color: "#0F172A" }}>Add Large Transaction</p>
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
        <button onClick={handleAdd} style={{ marginTop: "12px", padding: "8px 16px", backgroundColor: "white", border: "1.5px solid #D1D5DB", borderRadius: "6px", fontSize: "13px", cursor: "pointer", color: "#374151" }}>
          Add Transaction
        </button>
      </div>

      {/* Transactions table */}
      {transactions.length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr", padding: "8px 4px", borderBottom: "1px solid #E2E8F0" }}>
            {["Amount", "Type", "Reference", "Status"].map((h) => <div key={h} style={{ fontSize: "12.5px", color: "#94A3B8", fontWeight: "500" }}>{h}</div>)}
          </div>
          {transactions.map((t) => (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr", padding: "12px 4px", borderBottom: "1px solid #F1F5F9", alignItems: "center" }}>
              <div style={{ fontSize: "14px", color: "#0F172A", fontWeight: "500" }}>£{t.amount.toLocaleString()}</div>
              <div style={{ fontSize: "13.5px", color: "#374151", textTransform: "capitalize" }}>{t.type}</div>
              <div style={{ fontSize: "13.5px", color: "#374151" }}>{t.reference}</div>
              <div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: t.status === "ok" ? "#0852C9" : "#DC2626", color: "white" }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="white" strokeWidth="1.2" fill="none" />{t.status === "ok" ? <path d="M3 5l1.5 1.5L7 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" /> : <path d="M3.5 3.5l3 3M6.5 3.5l-3 3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />}</svg>
                  {t.status === "ok" ? "OK" : "Flag"}
                </span>
              </div>
            </div>
          ))}
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

function ContractsSyncStep({ onComplete, onPrev, savedContracts }: ContractsSyncStepProps): React.JSX.Element {
  const [paymentsReflected, setPaymentsReflected] = useState<string | null>(null);
  const [futureEngagement, setFutureEngagement] = useState<string | null>(null);

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
      <RadioRow value="yes" selected={paymentsReflected} onChange={setPaymentsReflected} label="Yes - Payments reflected" desc="Paid in full, or initial deposit with subsequent monthly payments visible" />
      <RadioRow value="no" selected={paymentsReflected} onChange={(v) => { setPaymentsReflected(v); setFutureEngagement(null); }} label="No - Payments not visible" desc="Contract payments are not reflected in bank statements" />

      {/* Future engagement */}
      {paymentsReflected === "no" && (
        <div style={{ marginTop: "16px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "13.5px", fontWeight: "600", color: "#0F172A" }}>Is this for future engagement?</p>
          <RadioRow value="yes" selected={futureEngagement} onChange={setFutureEngagement} label="Yes - Future engagement dates" />
          <RadioRow value="no" selected={futureEngagement} onChange={setFutureEngagement} label="No - Dates have expired" />
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

  useEffect(() => {
    const queryId = searchParams.get("recordId") || searchParams.get("id");
    const id = queryId || sessionStorage.getItem("current_hr_record_id");
    if (id) setRecordId(Number(id));

    try {
      const c = sessionStorage.getItem("hr_contracts");
      if (c) setSavedContracts(JSON.parse(c) as SavedContract[]);
    } catch {}
  }, [searchParams]);

  const stepIds = ["balance", "cashflow", "investments", "contracts"];

  const handleTabClick = (tabId: string): void => {
    if (tabId === "financial") return;
  };

  const goToStep = (id: string): void => setStep(id);

  const handleNext = (currentStep: string): void => {
    const idx = stepIds.indexOf(currentStep);
    if (idx < stepIds.length - 1) {
      const nextStep = stepIds[idx + 1];
      setStep(nextStep);
      setUnlockedUpTo(Math.max(unlockedUpTo, idx + 1));
    }
  };

  const handleSave = (data: Partial<FinancialData>): void => setFinancialData((prev) => ({ ...prev, ...data }));

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

        {step === "balance" && <BalanceStep onNext={() => { handleNext("balance"); }} onSave={handleSave} />}
        {step === "cashflow" && <CashFlowStep onNext={() => handleNext("cashflow")} onPrev={() => setStep("balance")} onSave={handleSave} />}
        {step === "investments" && <InvestmentsStep onNext={() => handleNext("investments")} onPrev={() => setStep("cashflow")} onSave={handleSave} />}
        {step === "contracts" && <ContractsSyncStep onComplete={handleComplete} onPrev={() => setStep("investments")} savedContracts={savedContracts} />}

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