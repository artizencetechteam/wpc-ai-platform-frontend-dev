'use client';

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  createHRValidationRecordAction,
  listHRValidationRecordsAction,
  updateHRValidationRecordAction,
  listFinancialRecordsAction,
} from "@/app/employer/sections/action/action";
import HRValidationTabs from "../_components/HRValidationTabs";

export function getClientToken(): string {
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
  const [bankName, setBankName] = useState("Other Banks");
  const [tabProgress, setTabProgress] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [manualOpening, setManualOpening] = useState("");
  const [manualClosing, setManualClosing] = useState("");
  const [paymentIncomingTotal, setPaymentIncomingTotal] = useState<number | null>(null);
  const [paymentOutgoingTotal, setPaymentOutgoingTotal] = useState<number | null>(null);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchDate, setSearchDate] = useState("");
  const [searchAmount, setSearchAmount] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchReference, setSearchReference] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any | null>(null);
  const [bankStatementUrl, setBankStatementUrl] = useState("");

  const handleDelete = (id: number): void => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success("Transaction deleted");
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
  };

  const handleEditCancel = (): void => {
    setEditingId(null);
    setEditValues(null);
  };


  useEffect(() => {
    initHRRecord();
    const queryId = searchParams.get("recordId") || searchParams.get("id");
    if (queryId) {
      const p = sessionStorage.getItem(`hr_progress_${queryId}`);
      if (p) {
        try { setTabProgress(JSON.parse(p)); } catch { setTabProgress({}); }
      }
    }
  }, [searchParams]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset balances to null/empty so extracted data from PDF is used
    setManualOpening("");
    setManualClosing("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bank_name", bankName);
    formData.append("manual_opening", "");
    formData.append("manual_closing", "");
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
      if (extractedOpening !== null) {
        setManualOpening(String(extractedOpening));
      }
      if (extractedClosing !== null) {
        setManualClosing(String(extractedClosing));
      }

      // New: Extract total_paid_in and total_paid_out
      const extractedPaidIn = extractionResult.total_paid_in ?? null;
      const extractedPaidOut = extractionResult.total_paid_out ?? null;
      setPaymentIncomingTotal(extractedPaidIn);
      setPaymentOutgoingTotal(extractedPaidOut);
      if (extractedPaidIn !== null || extractedPaidOut !== null) {
        console.log("[Extraction] Total Paid In:", extractedPaidIn, "Total Paid Out:", extractedPaidOut);
      }

      // Capture S3 URL from response
      const s3Url = extractionResult.file_url || extractionResult.s3_url || extractionResult.bank_statement_url || "";
      if (s3Url) {
        setBankStatementUrl(s3Url);
      }

      if (mapped.length === 0) {
        toast.success("Parsed, but no transactions found in the statement.");
      } else {
        setUploadedFileName(file.name);
        setTransactions(mapped);
        toast.success(`Successfully parsed ${mapped.length} transactions.`);
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

        // Hydrate from server if available
        let srvName = "";
        let srvBank = "";
        const record = sortedRecords.find((r) => r.id === recordId);
        if (record) {
          if (record.company_name) {
            srvName = record.company_name;
            setCompanyName(srvName);
            sessionStorage.setItem(`company_name_${recordId}`, srvName);
          }
        }
      }
    } catch (e) {
      console.error("initHRRecord error:", e);
      setApiError("Unexpected error initialising HR record.");
    } finally {
      setLoading(false);
    }
  }

  // Real-time persistence now relies on the handleContinue save or local state

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!companyName.trim()) return;
    setIsSubmitting(true);
    if (hrRecordId) {
      sessionStorage.setItem(`company_name_${hrRecordId}`, companyName.trim());

      // Save to server
      const token = getClientToken();
      await updateHRValidationRecordAction(hrRecordId, {
        company_name: companyName.trim(),
      }, token);

      // Mark company step as complete in progress map
      const pStr = sessionStorage.getItem(`hr_progress_${hrRecordId}`);
      const p = pStr ? JSON.parse(pStr) : {};
      p.company = true;
      sessionStorage.setItem(`hr_progress_${hrRecordId}`, JSON.stringify(p));
      router.push(`/employer/sections/hr-validation?recordId=${hrRecordId}`);
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
      <HRValidationTabs currentTabId="company" hrRecordId={hrRecordId} />

      <div style={{ maxWidth: "860px", margin: "60px auto", padding: "0 24px", transition: "max-width 0.3s ease" }}>
        {apiError && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#DC2626" }}>⚠ {apiError}</p>
            <button onClick={() => initHRRecord()} style={{ background: "none", border: "1px solid #FECACA", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "#DC2626", cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>
        ) : (
          <div style={{ backgroundColor: "#F8FAFC", borderRadius: "14px", border: "1.5px solid #E2E8F0", padding: "40px", maxWidth: "600px", margin: "0 auto", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", transition: "max-width 0.3s ease" }}>
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

            <button
              onClick={handleContinue}
              disabled={isSubmitting || !companyName.trim()}
              style={{
                width: "100%", padding: "14px", borderRadius: "10px", border: "none",
                backgroundColor: (isSubmitting || !companyName.trim()) ? "#93ABDE" : "#0852C9", color: "white",
                fontSize: "15px", fontWeight: "600", cursor: (isSubmitting || !companyName.trim()) ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}
            >
              {isSubmitting && <SpinnerIcon color="#fff" />}
              {isSubmitting ? "Processing..." : "Continue to Staff List"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
