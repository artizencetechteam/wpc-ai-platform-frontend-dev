'use client';

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  createHRValidationRecordAction,
  listHRValidationRecordsAction,
} from "@/app/employer/sections/action/action";
import HRValidationTabs from "../_components/HRValidationTabs";

function getClientToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("access-token="));
  if (!match) return "";
  const raw = decodeURIComponent(match.split("=").slice(1).join("="));
  return raw.replace(/\s+/g, "").replace(/^(Bearer|Token)\s*/i, "");
}



const SpinnerIcon = ({ color = "#0852C9" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="10" cy="10" r="8" stroke="#CBD5E1" strokeWidth="2.5" />
    <path d="M10 2a8 8 0 018 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const NON_COMPLIANT_REFS = ["loan", "gift", "director investment", "director's loan", "personal"];
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
  const parts = raw.trim().split(/\s+/);
  if (parts.length !== 3) return raw;
  const [dd, mon, yy] = parts;
  const mm = MONTH_MAP[mon.toLowerCase()];
  if (!mm) return raw;
  const year = parseInt(yy, 10) + 2000;
  return `${dd.padStart(2, "0")}-${mm}-${year}`;
}

export default function CompanyPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>}>
      <CompanyPageImpl />
    </Suspense>
  );
}

// ─── Shared styles & Icons for Transactions Table ─────────────────────────────

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #0852C9", fontSize: "14px", outline: "none", boxSizing: "border-box", color: "#0F172A", backgroundColor: "white" };
const iconBtn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", backgroundColor: "transparent", border: "none", cursor: "pointer", color: "#64748B", transition: "color 0.2s" };

const TrashIcon = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
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

function CompanyPageImpl() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hrRecordId, setHrRecordId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [bankName, setBankName] = useState("");
  const [tabProgress, setTabProgress] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [manualOpening, setManualOpening] = useState("");
  const [manualClosing, setManualClosing] = useState("");

  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchDate, setSearchDate] = useState("");
  const [searchAmount, setSearchAmount] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchReference, setSearchReference] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any | null>(null);

  const handleDelete = (id: number): void => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success("Transaction deleted");
    syncTransactionsToStorage(transactions.filter(t => t.id !== id));
  };

  const handleEditStart = (t: any): void => {
    setEditingId(t.id);
    setEditValues({ ...t });
  };

  const handleEditSave = (): void => {
    if (!editValues) return;
    const updated = transactions.map(t =>
      t.id === editingId
        ? { ...editValues, status: getTransactionStatus(editValues.reference) }
        : t
    );
    setTransactions(updated);
    setEditingId(null);
    setEditValues(null);
    toast.success("Transaction updated");
    syncTransactionsToStorage(updated);
  };

  const handleEditCancel = (): void => {
    setEditingId(null);
    setEditValues(null);
  };

  const syncTransactionsToStorage = (txs: any[]) => {
    try {
      const prevStr = sessionStorage.getItem("hr_financial_data");
      const prev = prevStr ? JSON.parse(prevStr) : {};
      prev.transactions = txs;
      sessionStorage.setItem("hr_financial_data", JSON.stringify(prev));
    } catch { }
  };

  useEffect(() => {
    initHRRecord();
    const p = sessionStorage.getItem("hr_progress");
    if (p) {
      try { setTabProgress(JSON.parse(p)); } catch { setTabProgress({}); }
    }
  }, [searchParams]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bank_name", bankName);
    formData.append("manual_opening", manualOpening.trim() || "");
    formData.append("manual_closing", manualClosing.trim() || "");
    formData.append("employee_name", "string");

    setIsParsing(true);
    const loadingToast = toast.loading("Parsing bank statement...");

    try {
      const response = await axios.post("/api/extract-bank-statement", formData);
      const resData = response.data;
      const extractionResult = resData.data || resData || {};
      const fetchedTransactions = extractionResult.transactions || [];

      if (!Array.isArray(fetchedTransactions)) {
        toast.error("Invalid response format from bank statement parser.");
        return;
      }

      const mapped = fetchedTransactions.map((t: any, idx: number) => {
        const hasPaidOut = t.paid_out !== null && t.paid_out !== undefined && t.paid_out !== "" && String(t.paid_out).trim() !== "0";
        const hasPaidIn = t.paid_in !== null && t.paid_in !== undefined && t.paid_in !== "" && String(t.paid_in).trim() !== "0";

        const amtValue = hasPaidOut ? t.paid_out : (hasPaidIn ? t.paid_in : (t.amount || t.value || 0));
        const amt = typeof amtValue === 'string' ? parseFloat(amtValue.replace(/[^\d.-]/g, '')) : amtValue;

        let isIncoming = true;
        if (hasPaidOut) isIncoming = false;
        else if (hasPaidIn) isIncoming = true;
        else if (t.type === "debit" || t.direction === "out") isIncoming = false;
        else if (t.type === "credit" || t.direction === "in") isIncoming = true;
        else if (typeof amt === 'number') isIncoming = amt >= 0;

        return {
          id: Date.now() + idx,
          date: formatDate(t.date),
          amount: Math.abs(amt || 0),
          reference: t.description || t.reference || t.memo || "Unknown",
          type: isIncoming ? "incoming" : "outgoing",
          status: getTransactionStatus(t.description || t.reference || t.memo || ""),
        };
      });

      // Auto-fill opening/closing balance from API response if not manually set
      const extractedOpening = extractionResult.opening_balance ?? extractionResult.openingBalance ?? null;
      const extractedClosing = extractionResult.closing_balance ?? extractionResult.closingBalance ?? null;
      if (extractedOpening !== null && !manualOpening.trim()) {
        setManualOpening(String(extractedOpening));
      }
      if (extractedClosing !== null && !manualClosing.trim()) {
        setManualClosing(String(extractedClosing));
      }

      if (mapped.length === 0) {
        toast.success("Parsed, but no transactions found in the statement.");
      } else {
        setUploadedFileName(file.name);
        setTransactions(mapped);
        toast.success(`Successfully parsed ${mapped.length} transactions.`);
        try {
          const prevStr = sessionStorage.getItem("hr_financial_data");
          const prev = prevStr ? JSON.parse(prevStr) : {};
          prev.transactions = mapped;
          prev.opening_balance = extractedOpening !== null && !manualOpening.trim() ? String(extractedOpening) : (manualOpening.trim() || "0");
          prev.closing_balance = extractedClosing !== null && !manualClosing.trim() ? String(extractedClosing) : (manualClosing.trim() || "0");
          sessionStorage.setItem("hr_financial_data", JSON.stringify(prev));
        } catch { }
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.details || "Failed to parse bank statement.");
    } finally {
      setIsParsing(false);
      toast.dismiss(loadingToast);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  async function initHRRecord() {
    setLoading(true);
    setApiError("");
    try {
      const token = getClientToken();
      const queryId = searchParams.get("recordId") || searchParams.get("id");
      const isNew = searchParams.get("action") === "new";

      const listRes = await listHRValidationRecordsAction(token);
      if (!listRes.success) {
        setApiError(listRes.message);
        setLoading(false);
        return;
      }

      const records = listRes.data ?? [];
      const sortedRecords = [...records].sort((a, b) => b.id - a.id);

      let recordId: number | null = null;

      if (isNew) {
        let userId: number | null = null;
        try {
          const raw = document.cookie
            .split("; ")
            .find((r) => r.startsWith("user-info="))
            ?.split("=")
            .slice(1)
            .join("=");
          if (raw) {
            const parsed = JSON.parse(decodeURIComponent(raw));
            userId = parsed?.id ?? null;
          }
        } catch { /* ignore */ }

        if (!userId) {
          setApiError("User session invalid. Please login again.");
          setLoading(false);
          return;
        }

        const createRes = await createHRValidationRecordAction(userId, token);
        if (!createRes.success) {
          setApiError(createRes.message);
          setLoading(false);
          return;
        }
        recordId = createRes.data?.id ?? null;
      } else if (queryId) {
        recordId = Number(queryId);
      } else if (sortedRecords.length > 0) {
        recordId = sortedRecords[0].id;
      } else {
        // Fallback: Create one if none exists
        let userId: number | null = null;
        try {
          const raw = document.cookie
            .split("; ")
            .find((r) => r.startsWith("user-info="))
            ?.split("=")
            .slice(1)
            .join("=");
          if (raw) {
            const parsed = JSON.parse(decodeURIComponent(raw));
            userId = parsed?.id ?? null;
          }
        } catch { /* ignore */ }
        if (userId) {
          const createRes = await createHRValidationRecordAction(userId, token);
          if (createRes.success) recordId = createRes.data?.id ?? null;
        }
      }

      setHrRecordId(recordId);
      if (recordId !== null) {
        sessionStorage.setItem("current_hr_record_id", String(recordId));
        // Retrieve company and bank name from storage if it exists for this record
        const savedName = sessionStorage.getItem(`company_name_${recordId}`);
        if (savedName) setCompanyName(savedName);

        const savedBank = sessionStorage.getItem(`bank_name_${recordId}`);
        if (savedBank) setBankName(savedBank);

        // Restore manual balances and transactions from shared financial data
        const finDataStr = sessionStorage.getItem("hr_financial_data");
        if (finDataStr) {
          try {
            const finData = JSON.parse(finDataStr);
            if (finData.transactions) setTransactions(finData.transactions);
            if (finData.opening_balance) setManualOpening(String(finData.opening_balance));
            if (finData.closing_balance) setManualClosing(String(finData.closing_balance));
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error("initHRRecord error:", e);
      setApiError("Unexpected error initialising HR record.");
    } finally {
      setLoading(false);
    }
  }

  // Persist manual balance changes in real-time
  useEffect(() => {
    if (loading) return;
    try {
      const prevStr = sessionStorage.getItem("hr_financial_data");
      const prev = prevStr ? JSON.parse(prevStr) : {};
      prev.opening_balance = manualOpening;
      prev.closing_balance = manualClosing;
      sessionStorage.setItem("hr_financial_data", JSON.stringify(prev));
    } catch { }
  }, [manualOpening, manualClosing, loading]);

  const handleContinue = () => {
    if (!companyName.trim() || !bankName) return;
    if (hrRecordId) {
      sessionStorage.setItem(`company_name_${hrRecordId}`, companyName.trim());
      sessionStorage.setItem(`bank_name_${hrRecordId}`, bankName);

      // Final sync of financial data before moving to next page
      try {
        const prevStr = sessionStorage.getItem("hr_financial_data");
        const prev = prevStr ? JSON.parse(prevStr) : {};
        prev.opening_balance = manualOpening;
        prev.closing_balance = manualClosing;
        prev.transactions = transactions;
        sessionStorage.setItem("hr_financial_data", JSON.stringify(prev));
      } catch { }

      // Mark company step as complete in progress map
      const p = { ...tabProgress, company: true };
      sessionStorage.setItem("hr_progress", JSON.stringify(p));
      router.push(`/employer/sections/hr-validation?recordId=${hrRecordId}`);
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
      <HRValidationTabs currentTabId="company" hrRecordId={hrRecordId} />

      <div style={{ maxWidth: transactions.length > 0 ? "1060px" : "860px", margin: "60px auto", padding: "0 24px", transition: "max-width 0.3s ease" }}>
        {apiError && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#DC2626" }}>⚠ {apiError}</p>
            <button onClick={() => initHRRecord()} style={{ background: "none", border: "1px solid #FECACA", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "#DC2626", cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>
        ) : (
          <div style={{ backgroundColor: "#F8FAFC", borderRadius: "14px", border: "1.5px solid #E2E8F0", padding: "40px", maxWidth: transactions.length > 0 ? "1000px" : "600px", margin: "0 auto", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", transition: "max-width 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ backgroundColor: "#EFF6FF", padding: "8px", borderRadius: "8px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0852C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3" />
                  <path d="M19 21V11" /><path d="M5 21V11" />
                </svg>
              </div>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#0F172A" }}>Company Details</h2>
            </div>
            <p style={{ margin: "0 0 32px", fontSize: "14px", color: "#64748B" }}>
              Enter the company name to begin HR Records Validation
            </p>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                Company (Client) Name *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company or client name"
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: "10px",
                  border: "1.5px solid #D1D5DB", fontSize: "15px", outline: "none",
                  boxSizing: "border-box", color: "#0F172A", backgroundColor: "white",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#0852C9"}
                onBlur={(e) => e.target.style.borderColor = "#D1D5DB"}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                Bank Name *
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: "10px",
                  border: "1.5px solid #D1D5DB", fontSize: "15px", outline: "none",
                  boxSizing: "border-box", color: "#0F172A", backgroundColor: "white",
                  transition: "border-color 0.2s",
                  cursor: "pointer"
                }}
                onFocus={(e) => e.target.style.borderColor = "#0852C9"}
                onBlur={(e) => e.target.style.borderColor = "#D1D5DB"}
              >
                <option value="">Select a Bank...</option>
                <option value="Generic (AI Vision)">Generic (AI Vision)</option>
                <option value="NATWEST">NATWEST</option>
                <option value="SANTANDER">SANTANDER</option>
                <option value="VIRGIN">VIRGIN</option>
              </select>
            </div>

            {/* Opening & Closing Balance */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                  Opening Balance
                  <span style={{ marginLeft: "6px", fontSize: "12px", fontWeight: "400", color: "#94A3B8" }}>(auto-filled on upload)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", color: "#64748B", pointerEvents: "none" }}>£</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualOpening}
                    onChange={(e) => setManualOpening(e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: "100%", padding: "12px 16px 12px 28px", borderRadius: "10px",
                      border: "1.5px solid #D1D5DB", fontSize: "15px", outline: "none",
                      boxSizing: "border-box", color: "#0F172A", backgroundColor: manualOpening ? "#F0FDF4" : "white",
                      transition: "border-color 0.2s, background-color 0.2s",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#0852C9"}
                    onBlur={(e) => e.target.style.borderColor = "#D1D5DB"}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                  Closing Balance
                  <span style={{ marginLeft: "6px", fontSize: "12px", fontWeight: "400", color: "#94A3B8" }}>(auto-filled on upload)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", color: "#64748B", pointerEvents: "none" }}>£</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualClosing}
                    onChange={(e) => setManualClosing(e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: "100%", padding: "12px 16px 12px 28px", borderRadius: "10px",
                      border: "1.5px solid #D1D5DB", fontSize: "15px", outline: "none",
                      boxSizing: "border-box", color: "#0F172A", backgroundColor: manualClosing ? "#F0FDF4" : "white",
                      transition: "border-color 0.2s, background-color 0.2s",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#0852C9"}
                    onBlur={(e) => e.target.style.borderColor = "#D1D5DB"}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: transactions.length > 0 ? "12px" : "24px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                Upload Bank Statement (Optional)
              </label>
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
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  padding: "12px 16px", backgroundColor: "#F0F9FF", border: "1.5px dashed #0EA5E9",
                  borderRadius: "10px", color: "#0369A1", fontSize: "14.5px", fontWeight: "600",
                  cursor: isParsing ? "not-allowed" : "pointer", transition: "all 0.2s"
                }}
              >
                {isParsing ? (
                  <>
                    <SpinnerIcon color="#0EA5E9" />
                    Analyzing statement...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.5 19L19 19C21.2091 19 23 17.2091 23 15C23 12.7909 21.2091 11 19 11C18.8296 11 18.6625 11.0107 18.4988 11.0317C17.7412 8.14811 15.1182 6 12 6C9.11584 6 6.6247 7.8258 5.67232 10.3957C3.12061 10.7483 1 12.9163 1 15.5C1 18.5376 3.46243 21 6.5 21L8 21" />
                      <path d="M12 11V21M12 11L9 14M12 11L15 14" />
                    </svg>
                    {uploadedFileName ? `Re-upload Statement (${uploadedFileName})` : "Upload Bank Statement PDF"}
                  </>
                )}
              </button>
            </div>

            {transactions.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#0F172A" }}>Parsed Transactions</h3>
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
                              <div><input type="number" value={editValues?.amount} onChange={(e) => setEditValues((prev: any) => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)} style={{ ...inputStyle, padding: "4px 8px" }} /></div>
                              <div>
                                <select value={editValues?.type} onChange={(e) => setEditValues((prev: any) => prev ? { ...prev, type: e.target.value as "incoming" | "outgoing" } : null)} style={{ ...inputStyle, padding: "4px 8px" }}>
                                  <option value="incoming">Incoming</option>
                                  <option value="outgoing">Outgoing</option>
                                </select>
                              </div>
                              <div><input type="text" value={editValues?.reference} onChange={(e) => setEditValues((prev: any) => prev ? { ...prev, reference: e.target.value } : null)} style={{ ...inputStyle, padding: "4px 8px" }} /></div>
                              <div />
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button onClick={handleEditSave} title="Save" style={iconBtn}><CheckIcon /></button>
                                <button onClick={handleEditCancel} title="Cancel" style={iconBtn}><XIcon /></button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: "13px", color: "#374151", padding: "4px", fontVariantNumeric: "tabular-nums" }}>
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
                                  <span style={{ marginLeft: "8px", fontSize: "10px", backgroundColor: "#F0F9FF", color: "#0369A1", padding: "2px 6px", borderRadius: "4px", border: "1px solid #B9E6FE", verticalAlign: "middle" }}>
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

            <button
              onClick={handleContinue}
              disabled={!companyName.trim() || !bankName}
              style={{
                width: "100%", padding: "14px", borderRadius: "10px", border: "none",
                backgroundColor: companyName.trim() && bankName ? "#0852C9" : "#93ABDE", color: "white",
                fontSize: "15px", fontWeight: "600", cursor: companyName.trim() && bankName ? "pointer" : "not-allowed",
                transition: "background-color 0.2s",
              }}
            >
              Continue to Staff List
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
