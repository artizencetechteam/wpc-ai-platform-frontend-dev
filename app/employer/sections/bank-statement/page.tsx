'use client';

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  listHRValidationRecordsAction,
  updateHRValidationRecordAction,
  listEmployeesAction,
} from "@/app/employer/sections/action/action";
import HRValidationTabs from "../_components/HRValidationTabs";
import { getClientToken } from "@/app/employer/sections/company/page";

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

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #0852C9", fontSize: "14px", outline: "none", boxSizing: "border-box", color: "#0F172A", backgroundColor: "white" };
const iconBtn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", backgroundColor: "transparent", border: "none", cursor: "pointer", color: "#64748B", transition: "color 0.2s" };

const TrashIcon = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
  </svg>
);

const PencilIcon = (): React.JSX.Element => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const CheckIcon = (): React.JSX.Element => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = (): React.JSX.Element => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function BankStatementPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>}>
      <BankStatementImpl />
    </Suspense>
  );
}

function BankStatementImpl() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hrRecordId, setHrRecordId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [bankName, setBankName] = useState("Other Banks");

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Step 1: upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [bankStatementUrl, setBankStatementUrl] = useState("");
  // Step 2: AI analysis state
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [manualOpening, setManualOpening] = useState("");
  const [manualClosing, setManualClosing] = useState("");
  const [paymentIncomingTotal, setPaymentIncomingTotal] = useState<number | null>(null);
  const [paymentOutgoingTotal, setPaymentOutgoingTotal] = useState<number | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchDate, setSearchDate] = useState("");
  const [searchAmount, setSearchAmount] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchReference, setSearchReference] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any | null>(null);

  useEffect(() => {
    initHRRecord();
  }, [searchParams]);

  async function initHRRecord() {
    setLoading(true);
    setApiError("");
    try {
      const token = getClientToken();
      const queryId = searchParams.get("recordId") || searchParams.get("id");
      
      const listRes = await listHRValidationRecordsAction(token);
      if (!listRes.success) {
        setApiError(listRes.message);
        setLoading(false);
        return;
      }

      const records = listRes.data ?? [];
      let recordId = queryId ? Number(queryId) : null;
      if (!recordId && records.length > 0) {
        const sorted = [...records].sort((a, b) => b.id - a.id);
        recordId = sorted[0].id;
      }

      setHrRecordId(recordId);
      if (recordId !== null) {
        // Fetch employees to pass their names to the AI parser
        const empRes = await listEmployeesAction(recordId, token);
        if (empRes.success) {
          setEmployees(empRes.data || []);
        }

        const record = records.find((r) => r.id === recordId);
        if (record) {
          if (record.bank_name) setBankName(record.bank_name);
          if (record.bank_statement_url) setBankStatementUrl(record.bank_statement_url);
          if (record.transactions) {
            const txs = typeof record.transactions === "string" ? JSON.parse(record.transactions) : record.transactions;
            setTransactions(txs);
          }
          if (record.Opening_Balance) setManualOpening(String(record.Opening_Balance));
          if (record.Closing_Balance != null && record.Closing_Balance !== "" && record.Closing_Balance !== 0) {
            setManualClosing(String(record.Closing_Balance));
          }
          if (record.payment_incoming_total !== undefined) setPaymentIncomingTotal(record.payment_incoming_total);
          if (record.payment_outgoing_total !== undefined) setPaymentOutgoingTotal(record.payment_outgoing_total);
        }
      }
    } catch (e) {
      console.error("initHRRecord error:", e);
      setApiError("Unexpected error initialising HR record.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1: Upload PDF → Cloudflare R2 ──────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const loadingToast = toast.loading("Uploading to secure storage...");
    try {
      // 1a. Get presigned URL from our proxy
      const presignRes = await axios.post("/api/upload-presign", {
        fileName: `Bank statements/${file.name}`,
        fileType: file.type || "application/pdf",
      });
      const { presignedUrl, publicUrl } = presignRes.data;

      // 1b. PUT directly to Cloudflare R2
      await axios.put(presignedUrl, file, {
        headers: { "Content-Type": file.type || "application/pdf" },
      });

      setUploadedFileName(file.name);
      setBankStatementUrl(publicUrl);
      // Clear any previous analysis results
      setTransactions([]);
      setManualOpening("");
      setManualClosing("");
      setPaymentIncomingTotal(null);
      setPaymentOutgoingTotal(null);

      // 1c. Immediately persist the URL to the database
      if (hrRecordId) {
        const token = getClientToken();
        await updateHRValidationRecordAction(hrRecordId, {
          bank_statement_url: publicUrl,
        }, token);
      }

      toast.success("File uploaded successfully! Starting AI Analysis...");
      setIsUploading(false);
      toast.dismiss(loadingToast);

      // 1d. Automatically trigger AI analysis
      await handleRunAnalysis(publicUrl);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || "Failed to upload file.");
      setIsUploading(false);
      toast.dismiss(loadingToast);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Step 2: Run AI Analysis using stored URL ─────────────────────────────────
  const handleRunAnalysis = async (urlOverride?: string) => {
    const urlToUse = urlOverride || bankStatementUrl;
    if (!urlToUse) return;

    setIsAnalysing(true);
    const loadingToast = toast.loading("Running AI analysis...");
    try {
      const response = await axios.post("/api/parse-bank-statement", {
        file_url: urlToUse,
        employee_name: employees.map((e) => e.employee_full_name),
      });
      const resData = response.data;
      // Support the new { bank_statement: { all_transactions: [...] } } structure
      const bankStatement = resData.bank_statement || {};
      const extractionResult = resData.data || resData || {};
      const fetchedTransactions = bankStatement.all_transactions || extractionResult.transactions || [];

      if (!Array.isArray(fetchedTransactions)) {
        toast.error("Unexpected response from AI parser.");
        return;
      }

      const mapped = fetchedTransactions.map((t: any, idx: number) => {
        const hasPaidOut = t.paid_out !== null && t.paid_out !== undefined && t.paid_out !== "" && String(t.paid_out).trim() !== "0";
        const hasPaidIn  = t.paid_in  !== null && t.paid_in  !== undefined && t.paid_in  !== "" && String(t.paid_in).trim()  !== "0";
        const amtValue = hasPaidOut ? t.paid_out : (hasPaidIn ? t.paid_in : (t.amount || t.value || 0));
        const amt = typeof amtValue === "string" ? parseFloat(amtValue.replace(/[^\d.-]/g, "")) : amtValue;
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

      const extractedOpening = bankStatement.opening_balance ?? extractionResult.opening_balance ?? extractionResult.openingBalance ?? null;
      const extractedClosing = bankStatement.closing_balance ?? extractionResult.closing_balance ?? extractionResult.closingBalance ?? null;
      if (extractedOpening !== null) setManualOpening(String(extractedOpening));
      if (extractedClosing !== null) setManualClosing(String(extractedClosing));

      const extractedPaidIn  = bankStatement.total_paid_in  ?? extractionResult.total_paid_in  ?? null;
      const extractedPaidOut = bankStatement.total_paid_out ?? extractionResult.total_paid_out ?? null;
      setPaymentIncomingTotal(extractedPaidIn);
      setPaymentOutgoingTotal(extractedPaidOut);

      if (mapped.length === 0) {
        toast.success("AI analysis complete — no transactions found.");
      } else {
        setTransactions(mapped);
        toast.success(`AI analysis complete — ${mapped.length} transactions extracted.`);
      }
    } catch (error: any) {
      console.error("AI analysis error:", error);
      toast.error(error.response?.data?.details || "AI analysis failed. Please try again.");
    } finally {
      setIsAnalysing(false);
      toast.dismiss(loadingToast);
    }
  };

  const handleDelete = (id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success("Transaction deleted");
  };

  const handleEditStart = (t: any) => {
    setEditingId(t.id);
    setEditValues({ ...t });
  };

  const handleEditSave = () => {
    if (!editValues) return;
    setTransactions(transactions.map(t => t.id === editingId ? { ...editValues, status: getTransactionStatus(editValues.reference) } : t));
    setEditingId(null);
    setEditValues(null);
    toast.success("Transaction updated");
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleContinue = async () => {
    if (!bankName) return;
    setIsSubmitting(true);
    if (hrRecordId) {
      const token = getClientToken();
      await updateHRValidationRecordAction(hrRecordId, {
        bank_name: bankName,
        transactions: transactions,
        Opening_Balance: manualOpening,
        Closing_Balance: manualClosing,
        bank_statement_url: bankStatementUrl,
        payment_incoming_total: paymentIncomingTotal,
        payment_outgoing_total: paymentOutgoingTotal,
      }, token);

      const pStr = sessionStorage.getItem(`hr_progress_${hrRecordId}`);
      const p = pStr ? JSON.parse(pStr) : {};
      p.bank = true;
      sessionStorage.setItem(`hr_progress_${hrRecordId}`, JSON.stringify(p));
      router.push(`/employer/sections/pension?recordId=${hrRecordId}`);
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
      <HRValidationTabs currentTabId="bank" hrRecordId={hrRecordId} />

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
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#0F172A" }}>Bank Statement Upload</h2>
            </div>
            <p style={{ margin: "0 0 32px", fontSize: "14px", color: "#64748B" }}>
              Provide bank details and upload the latest statement for validation
            </p>

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
              >
                <option value="">Select a Bank...</option>
                <option value="Other Banks">Other Banks</option>
                <option value="NATWEST">NATWEST</option>
                <option value="SANTANDER">SANTANDER</option>
                <option value="VIRGIN">VIRGIN</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                  Opening Balance
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", color: "#64748B", pointerEvents: "none" }}>£</span>
                  <input
                    type="number" value={manualOpening} onChange={(e) => setManualOpening(e.target.value)}
                    placeholder="0.00" style={{ ...inputStyle, paddingLeft: "28px" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                  Closing Balance
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", color: "#64748B", pointerEvents: "none" }}>£</span>
                  <input
                    type="number" value={manualClosing} onChange={(e) => setManualClosing(e.target.value)}
                    placeholder="0.00" style={{ ...inputStyle, paddingLeft: "28px" }}
                  />
                </div>
              </div>
            </div>

            {/* ── Step 1: Upload PDF ── */}
            <div style={{ marginBottom: "16px" }}>
              <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isAnalysing}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  padding: "12px 16px", backgroundColor: "#F0F9FF", border: "1.5px dashed #0EA5E9",
                  borderRadius: "10px", color: "#0369A1", fontSize: "14.5px", fontWeight: "600",
                  cursor: (isUploading || isAnalysing) ? "not-allowed" : "pointer"
                }}
              >
                {(isUploading || isAnalysing)
                  ? <SpinnerIcon color="#0EA5E9" />
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19L19 19C21.2091 19 23 17.2091 23 15C23 12.7909 21.2091 11 19 11C18.8296 11 18.6625 11.0107 18.4988 11.0317C17.7412 8.14811 15.1182 6 12 6C9.11584 6 6.6247 7.8258 5.67232 10.3957C3.12061 10.7483 1 12.9163 1 15.5C1 18.5376 3.46243 21 6.5 21L8 21" /><path d="M12 11V21M12 11L9 14M12 11L15 14" /></svg>}
                {isUploading ? "Uploading to Cloudflare…" : isAnalysing ? "Analyzing Statement…" : (uploadedFileName || bankStatementUrl) ? `Re-upload ${uploadedFileName ? `(${uploadedFileName})` : "Statement"}` : "Upload Bank Statement PDF"}
              </button>
            </div>

            {/* ── Uploaded file info + AI Analysis button ── */}
            {bankStatementUrl && (
              <div style={{ marginBottom: "24px", padding: "16px 20px", backgroundColor: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <div style={{ flexShrink: 0, backgroundColor: "#DCFCE7", padding: "8px", borderRadius: "8px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <polyline points="9 15 12 18 15 15" />
                      <line x1="12" y1="10" x2="12" y2="18" />
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#166534" }}>File stored successfully</p>
                    <a
                      href={bankStatementUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "11.5px", color: "#0852C9", textDecoration: "underline", wordBreak: "break-all" }}
                    >
                      {bankStatementUrl}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {transactions.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: "600", color: "#0F172A" }}>Parsed Transactions</h3>

                {/* Search Filters */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "12px" }}>
                  {[
                    { placeholder: "Date...", value: searchDate, onChange: setSearchDate },
                    { placeholder: "Amount...", value: searchAmount, onChange: setSearchAmount },
                    { placeholder: "Type...", value: searchType, onChange: setSearchType },
                    { placeholder: "Reference / Note...", value: searchReference, onChange: setSearchReference },
                  ].map((f) => (
                    <div key={f.placeholder} style={{ position: "relative" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        placeholder={f.placeholder}
                        value={f.value}
                        onChange={(e) => f.onChange(e.target.value)}
                        style={{ padding: "8px 12px 8px 30px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" }}
                      />
                    </div>
                  ))}
                </div>

                {/* Table */}
                <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 2fr 1fr 1fr", padding: "10px 14px", backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    {["Date", "Amount", "Type", "Reference", "Status", "Actions"].map((h) => (
                      <div key={h} style={{ fontSize: "12.5px", color: "#64748B", fontWeight: "600" }}>{h}</div>
                    ))}
                  </div>

                  {/* Rows */}
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {transactions
                      .filter((t) => {
                        if (searchDate && (!t.date || !t.date.toLowerCase().includes(searchDate.toLowerCase()))) return false;
                        if (searchAmount && !String(t.amount).includes(searchAmount)) return false;
                        if (searchType && !t.type.toLowerCase().includes(searchType.toLowerCase())) return false;
                        if (searchReference && !t.reference.toLowerCase().includes(searchReference.toLowerCase())) return false;
                        return true;
                      })
                      .map((t) => {
                        const isEditing = editingId === t.id;
                        return (
                          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 2fr 1fr 1fr", padding: "12px 4px", borderBottom: "1px solid #F1F5F9", alignItems: "center" }}>
                            {isEditing ? (
                              <>
                                <div style={{ fontSize: "13px", color: "#374151", padding: "4px" }}>{editValues?.date || "—"}</div>
                                <div><input type="number" value={editValues?.amount} onChange={(e) => setEditValues((prev: any) => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)} style={{ ...inputStyle, padding: "4px 8px" }} /></div>
                                <div>
                                  <select value={editValues?.type} onChange={(e) => setEditValues((prev: any) => prev ? { ...prev, type: e.target.value } : null)} style={{ ...inputStyle, padding: "4px 8px" }}>
                                    <option value="incoming">Incoming</option>
                                    <option value="outgoing">Outgoing</option>
                                  </select>
                                </div>
                                <div><input type="text" value={editValues?.reference} onChange={(e) => setEditValues((prev: any) => prev ? { ...prev, reference: e.target.value } : null)} style={{ ...inputStyle, padding: "4px 8px" }} /></div>
                                <div />
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button onClick={handleEditSave} title="Save" style={{ ...iconBtn, color: "#16A34A" }}><CheckIcon /></button>
                                  <button onClick={() => { setEditingId(null); setEditValues(null); }} title="Cancel" style={iconBtn}><XIcon /></button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: "13px", color: "#374151", padding: "4px", fontVariantNumeric: "tabular-nums" }}>{t.date || "—"}</div>
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
                                  style={{ fontSize: "13.5px", color: "#374151", cursor: "pointer", padding: "4px", borderRadius: "4px", transition: "background 0.2s", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#F1F5F9"}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                  {t.reference}
                                </div>
                                <div>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: t.status === "ok" ? "#0852C9" : "#DC2626", color: "white" }}>
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                      <circle cx="5" cy="5" r="4" stroke="white" strokeWidth="1.2" fill="none" />
                                      {t.status === "ok"
                                        ? <path d="M3 5l1.5 1.5L7 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                                        : <path d="M3.5 3.5l3 3M6.5 3.5l-3 3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />}
                                    </svg>
                                    {t.status === "ok" ? "OK" : "Flag"}
                                  </span>
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button onClick={() => handleEditStart(t)} title="Edit" style={iconBtn}><PencilIcon /></button>
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

            {/* --- Cash Flow Pattern (Analysis) --- */}
            {(() => {
              const CHART_W = 560, CHART_H = 200, PAD_L = 60, PAD_B = 36, PAD_T = 16, PAD_R = 16;
              const innerW = CHART_W - PAD_L - PAD_R;
              const innerH = CHART_H - PAD_T - PAD_B;

              const dummyData = [
                { label: "February", year: 2026, in: 5200, out: 3100 },
                { label: "March",    year: 2026, in: 6800, out: 4200 },
                { label: "April",    year: 2026, in: 4900, out: 3800 },
              ];

              const getRealData = () => {
                const months: Record<string, any> = {};
                transactions.forEach(t => {
                  const parts = t.date.split("-");
                  if (parts.length !== 3) return;
                  const [, mm, yyyy] = parts;
                  const key = `${yyyy}-${mm}`;
                  if (!months[key]) {
                    const d = new Date(parseInt(yyyy), parseInt(mm) - 1, 1);
                    months[key] = { in: 0, out: 0, label: d.toLocaleString("default", { month: "long" }), year: parseInt(yyyy), monthIndex: parseInt(mm) - 1 };
                  }
                  if (t.type === "incoming") months[key].in += t.amount;
                  else months[key].out += t.amount;
                });
                return Object.values(months).sort((a, b) => a.year !== b.year ? a.year - b.year : a.monthIndex - b.monthIndex);
              };

              const data = transactions.length > 0 ? getRealData() : dummyData;
              const maxVal = Math.max(...data.flatMap(d => [d.in, d.out]), 1000);
              const yMax = Math.ceil(maxVal / 1000) * 1000 * 1.2;
              const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(yMax * f));

              const slotW = innerW / data.length;
              const barW = Math.min(28, slotW * 0.28);
              const gap = 4;

              const toY = (v: number) => PAD_T + innerH - (v / yMax) * innerH;
              const toX = (i: number, offset: number) => PAD_L + i * slotW + slotW / 2 + offset;

              // Net trend line points
              const linePoints = data.map((d, i) => {
                const net = d.in - d.out;
                const nx = toX(i, 0);
                const ny = toY(Math.max(0, net));
                return `${nx},${ny}`;
              }).join(" ");

              return (
                <div style={{ marginBottom: "32px", background: "white", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  {/* Header */}
                  <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", padding: "10px", borderRadius: "10px" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0852C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="20" x2="18" y2="4"/><line x1="12" y1="20" x2="12" y2="10"/><line x1="6" y1="20" x2="6" y2="14"/>
                        </svg>
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>Workflow 2: Cash Flow Pattern</h3>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                          {transactions.length > 0 ? `Based on ${transactions.length} transactions` : "Preview with sample data"}
                        </p>
                      </div>
                    </div>
                    {/* Legend */}
                    <div style={{ display: "flex", gap: "16px" }}>
                      {[["#0852C9","Paid In"],["#F87171","Paid Out"],["#10B981","Net Flow"]].map(([c,l]) => (
                        <div key={l} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: "600", color: "#64748B" }}>
                          <div style={{ width: "10px", height: l === "Net Flow" ? "2px" : "10px", backgroundColor: c, borderRadius: l === "Net Flow" ? "0" : "2px" }}/>
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SVG Bar Chart */}
                  <div style={{ padding: "16px 24px 0", overflowX: "auto" }}>
                    <svg width="100%" viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ display: "block", minWidth: "320px" }}>
                      {/* Y-axis grid lines & labels */}
                      {yTicks.map((tick, i) => (
                        <g key={i}>
                          <line x1={PAD_L} y1={toY(tick)} x2={CHART_W - PAD_R} y2={toY(tick)} stroke="#F1F5F9" strokeWidth="1"/>
                          <text x={PAD_L - 8} y={toY(tick) + 4} fontSize="9" fill="#94A3B8" textAnchor="end">
                            £{tick >= 1000 ? `${(tick/1000).toFixed(0)}k` : tick}
                          </text>
                        </g>
                      ))}

                      {/* X-axis baseline */}
                      <line x1={PAD_L} y1={PAD_T + innerH} x2={CHART_W - PAD_R} y2={PAD_T + innerH} stroke="#E2E8F0" strokeWidth="1.5"/>

                      {/* Bars + labels */}
                      {data.map((d, i) => {
                        const inX = toX(i, -(barW + gap / 2));
                        const outX = toX(i, gap / 2);
                        const inH2 = (d.in / yMax) * innerH;
                        const outH2 = (d.out / yMax) * innerH;
                        const baseY = PAD_T + innerH;
                        return (
                          <g key={i}>
                            {/* In bar */}
                            <rect x={inX} y={baseY - inH2} width={barW} height={inH2} fill="#0852C9" rx="3" ry="3"/>
                            <text x={inX + barW / 2} y={baseY - inH2 - 4} fontSize="8" fill="#0852C9" textAnchor="middle" fontWeight="600">
                              £{(d.in/1000).toFixed(1)}k
                            </text>
                            {/* Out bar */}
                            <rect x={outX} y={baseY - outH2} width={barW} height={outH2} fill="#F87171" rx="3" ry="3"/>
                            <text x={outX + barW / 2} y={baseY - outH2 - 4} fontSize="8" fill="#EF4444" textAnchor="middle" fontWeight="600">
                              £{(d.out/1000).toFixed(1)}k
                            </text>
                            {/* Month label */}
                            <text x={toX(i, 0)} y={baseY + 14} fontSize="10" fill="#64748B" textAnchor="middle" fontWeight="600">{d.label}</text>
                            <text x={toX(i, 0)} y={baseY + 25} fontSize="8" fill="#94A3B8" textAnchor="middle">{d.year}</text>
                          </g>
                        );
                      })}

                      {/* Net flow trend line */}
                      {data.length > 1 && (
                        <polyline points={linePoints} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5,3"/>
                      )}
                      {/* Net flow dots */}
                      {data.map((d, i) => (
                        <circle key={i} cx={toX(i, 0)} cy={toY(Math.max(0, d.in - d.out))} r="4" fill="#10B981" stroke="white" strokeWidth="1.5"/>
                      ))}
                    </svg>
                  </div>

                  {/* Summary cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", padding: "16px 24px" }}>
                    {[
                      { label: "Total Paid In",  value: data.reduce((s,d) => s+d.in, 0),  color: "#0852C9", bg: "#EFF6FF" },
                      { label: "Total Paid Out", value: data.reduce((s,d) => s+d.out, 0), color: "#DC2626", bg: "#FEF2F2" },
                      { label: "Net Cash Flow",  value: data.reduce((s,d) => s+d.in-d.out, 0), color: "#059669", bg: "#ECFDF5" },
                    ].map(c => (
                      <div key={c.label} style={{ backgroundColor: c.bg, borderRadius: "10px", padding: "14px 16px" }}>
                        <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: c.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</p>
                        <p style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>
                          {c.value < 0 ? "-" : ""}£{Math.abs(c.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Month-wise table */}
                  <div style={{ margin: "0 24px 20px", border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", padding: "10px 16px", backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: "10px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      <div>Month</div><div>Paid In</div><div>Paid Out</div><div>Net Flow</div>
                    </div>
                    {data.map((row, i) => {
                      const net = row.in - row.out;
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", padding: "11px 16px", borderBottom: i < data.length - 1 ? "1px solid #F1F5F9" : "none", fontSize: "13px", backgroundColor: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                          <div style={{ fontWeight: "600", color: "#0F172A" }}>{row.label} {row.year}</div>
                          <div style={{ color: "#166534", fontWeight: "500" }}>£{row.in.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          <div style={{ color: "#991B1B", fontWeight: "500" }}>£{row.out.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          <div style={{ fontWeight: "700", color: net >= 0 ? "#059669" : "#DC2626" }}>
                            {net >= 0 ? "+" : "−"}£{Math.abs(net).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}




            <button
              onClick={handleContinue}
              disabled={isSubmitting || !bankName}
              style={{
                width: "100%", padding: "14px", borderRadius: "10px", border: "none",
                backgroundColor: isSubmitting ? "#93ABDE" : "#0852C9", color: "white",
                fontSize: "15px", fontWeight: "600", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}
            >
              {isSubmitting && <SpinnerIcon color="#fff" />}
              {isSubmitting ? "Saving..." : "Continue to Pension Compliance"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
