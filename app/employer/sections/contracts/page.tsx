'use client';

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import HRValidationTabs from "../_components/HRValidationTabs";
import { updateHRValidationRecordAction, listHRValidationRecordsAction } from "@/app/employer/sections/action/action";
import { getClientToken } from "@/app/employer/sections/company/page";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Progress {
  [key: string]: boolean;
}

interface Contract {
  id: number;
  clientName: string;
  exists: "yes" | "no";
  aligns: "yes" | "no" | null;
  document: string | null;
  contract_amount?: string;
  period?: string;
  text_block?: string;
}

interface AddContractFormProps {
  onAdd: (contract: Contract) => void;
  onCancel: () => void;
}

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

const formatDate = (raw?: string | null): string | null => {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed) || /^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed.replace(/\//g, "-");
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;

  const parts = trimmed.split(/\s+/);
  if (parts.length === 3) {
    const [dd, mon, yy] = parts;
    const mm = MONTH_MAP[mon.toLowerCase()];
    if (mm) {
      const year = yy.length === 2 ? parseInt(yy, 10) + 2000 : parseInt(yy, 10);
      return `${dd.padStart(2, "0")}-${mm}-${year}`;
    }
  }

  return trimmed;
};

const toBankResult = (transactions: any[]): Array<{
  date: string | null;
  description: string;
  paid_in: number | null;
  paid_out: number | null;
  balance?: number | null;
  flags?: any;
  parsed_date?: string | null;
}> => {
  return transactions.map((t: any) => {
    const date = formatDate(t.date || t.parsed_date || t.transaction_date);
    const description = t.description || t.reference || t.note || t.narration || "Unknown";
    const paidIn = t.paid_in ?? (t.type === "incoming" ? t.amount : null);
    const paidOut = t.paid_out ?? (t.type === "outgoing" ? t.amount : null);
    const paid_in = paidIn !== null && paidIn !== undefined ? Number(paidIn) : null;
    const paid_out = paidOut !== null && paidOut !== undefined ? Number(paidOut) : null;
    const balance = t.balance !== undefined ? Number(t.balance) : null;
    const flags = t.flags || undefined;
    const parsed_date = t.parsed_date || null;
    return { date, description, paid_in, paid_out, balance, flags, parsed_date };
  });
};

const mergeContractExtractions = (extractions: any[]) => {
  if (!Array.isArray(extractions) || extractions.length === 0) return null;
  const sources = extractions.map((e) => e?.source).filter(Boolean);
  const parties = extractions
    .flatMap((e) => Array.isArray(e?.parties) ? e.parties : [])
    .filter(Boolean)
    .reduce((acc: any[], p: any) => {
      const key = `${p?.role || ""}::${p?.entity_name || ""}`.toLowerCase();
      if (!acc.some((x) => `${x?.role || ""}::${x?.entity_name || ""}`.toLowerCase() === key)) acc.push(p);
      return acc;
    }, []);
  const contracts = extractions
    .flatMap((e) => Array.isArray(e?.contracts) ? e.contracts : [])
    .filter(Boolean);
  const total_valid_contracts = extractions.reduce((sum, e) => {
    const count = typeof e?.total_valid_contracts === "number" ? e.total_valid_contracts : (Array.isArray(e?.contracts) ? e.contracts.length : 0);
    return sum + count;
  }, 0);

  return {
    source: sources.length <= 1 ? (sources[0] || null) : sources,
    parties,
    total_valid_contracts,
    contracts,
  };
};

const normalizeContractExtraction = (data: any) => {
  if (!data) return null;

  if (Array.isArray(data.contracts)) {
    return {
      ...data,
      contracts: data.contracts,
      total_valid_contracts: data.total_valid_contracts ?? data.contracts.length,
    };
  }

  if (data.contracts && Array.isArray(data.contracts.contracts)) {
    return {
      source: data.source,
      parties: data.parties,
      contracts: data.contracts.contracts,
      total_valid_contracts: data.contracts.total_valid_contracts ?? data.contracts.contracts.length,
    };
  }

  return data;
};

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

const UploadIcon = (): React.JSX.Element => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 18V8M12 8l-4 4M12 8l4 4" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 20h16" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" />
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

const SpinnerIcon = ({ color = "#0852C9" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="10" cy="10" r="8" stroke="#CBD5E1" strokeWidth="2.5" />
    <path d="M10 2a8 8 0 018 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);


const TrashIcon = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
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
  const [isUploading, setIsUploading] = useState(false);
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAdd = clientName.trim() && exists && !isUploading;
  const showAligns = exists === "yes";
  const showUpload = exists === "yes";

  const uploadToCloudflare = async (file: File) => {
    const { data: presignData } = await axios.post("/api/upload-presign", {
      fileName: file.name,
      fileType: file.type,
    });
    const { presignedUrl, publicUrl } = presignData;
    await axios.put(presignedUrl, file, {
      headers: { "Content-Type": file.type },
    });
    return publicUrl;
  };

  const ensureUploaded = async (): Promise<string | null> => {
    if (uploadedUrl) return uploadedUrl;
    if (!fileObject) return null;
    setIsUploading(true);
    const loadingToast = toast.loading("Uploading contract document...");
    try {
      const url = await uploadToCloudflare(fileObject);
      setUploadedUrl(url);
      toast.success("Document uploaded successfully.");
      return url;
    } catch (error) {
      toast.error("Failed to upload document.");
      return null;
    } finally {
      setIsUploading(false);
      toast.dismiss(loadingToast);
    }
  };

  const handleAdd = async (): Promise<void> => {
    if (!canAdd) return;

    const uploaded = await ensureUploaded();
    const documentUrl = uploaded || fileName;

    onAdd({
      id: Date.now(),
      clientName: clientName.trim(),
      exists: exists as "yes" | "no",
      aligns: exists === "no" ? "no" : (aligns as "yes" | "no" | null),
      document: documentUrl,
    });
  };

  const RadioRow = ({ value, selected, onChange, label }: { value: string; selected: string | null; onChange: (value: string) => void; label: string; }): React.JSX.Element => (
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
        <input 
          ref={inputRef} 
          type="file" 
          accept=".pdf" 
          style={{ display: "none" }} 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setFileObject(file);
              setFileName(file.name);
              setUploadedUrl(null);
            }
          }} 
        />
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          style={{
            border: "1.5px dashed #D1D5DB", borderRadius: "8px", padding: "24px 20px",
            textAlign: "center", cursor: isUploading ? "not-allowed" : "pointer", backgroundColor: "#F9FAFB",
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
            {isUploading ? <SpinnerIcon color="#9CA3AF" /> : <UploadIcon />}
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#9CA3AF" }}>
            {isUploading ? "Uploading..." : (fileName || "Upload contract PDF")}
          </p>
        </div>
      </div>
      )}

      {/* Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <button onClick={onCancel} style={cancelBtn}>Cancel</button>
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            style={{ ...primaryBtn, opacity: canAdd ? 1 : 0.5, cursor: canAdd ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            {isUploading && <SpinnerIcon color="#fff" />}
            {isUploading ? "Uploading..." : "Add Contract"}
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
  const [isParsingAll, setIsParsingAll] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [extractionData, setExtractionData] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [parsedDocs, setParsedDocs] = useState<string[]>([]);
  const [parsingDocs, setParsingDocs] = useState<string[]>([]);

  const getExtractionListKey = (id: number | null) => id ? `contract_extractions_${id}` : "contract_extractions";
  const getExtractionKey = (id: number | null) => id ? `contract_extraction_${id}` : "contract_extraction";

  const readExtractionList = (id: number | null): any[] => {
    try {
      const stored = sessionStorage.getItem(getExtractionListKey(id));
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const persistExtractionList = (id: number | null, list: any[]): void => {
    try {
      sessionStorage.setItem(getExtractionListKey(id), JSON.stringify(list));
    } catch {}
  };

  const appendExtraction = (id: number | null, extraction: any): any[] => {
    const next = [...readExtractionList(id), extraction];
    persistExtractionList(id, next);
    const merged = mergeContractExtractions(next);
    if (merged) {
      try {
        sessionStorage.setItem(getExtractionKey(id), JSON.stringify(merged));
      } catch {}
      setExtractionData(merged);
    }
    return next;
  };

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
        try {
          const listStored = sessionStorage.getItem(getExtractionListKey(parsedId));
          const listParsed = listStored ? JSON.parse(listStored) : null;
          const merged = Array.isArray(listParsed) && listParsed.length > 0 ? mergeContractExtractions(listParsed) : null;
          if (merged) setExtractionData(merged);
          else if (saved.contract_extraction_data) setExtractionData(saved.contract_extraction_data);
        } catch {
          if (saved.contract_extraction_data) setExtractionData(saved.contract_extraction_data);
        }
        try {
          const vKey = `contract_verification_${parsedId}`;
          const stored = sessionStorage.getItem(vKey);
          if (stored) setVerificationResult(JSON.parse(stored));
        } catch {}
      })();
    }
  }, [searchParams]);

  const getBankResultForVerify = async (): Promise<ReturnType<typeof toBankResult> | null> => {
    if (!recordId) return null;
    const bankKey = `bank_transactions_${recordId}`;
    const bankStored = sessionStorage.getItem(bankKey);
    let bankTransactions: any[] | null = bankStored ? JSON.parse(bankStored) : null;

    if (!bankTransactions || !Array.isArray(bankTransactions) || bankTransactions.length === 0) {
      const token = getClientToken();
      const listRes = await listHRValidationRecordsAction(token);
      if (listRes.success && Array.isArray(listRes.data)) {
        const record = listRes.data.find((r: any) => r.id === recordId);
        if (record?.transactions) {
          try {
            bankTransactions = typeof record.transactions === "string" ? JSON.parse(record.transactions) : record.transactions;
          } catch {
            bankTransactions = null;
          }
        }
      }
    }

    if (!bankTransactions || !Array.isArray(bankTransactions) || bankTransactions.length === 0) {
      return null;
    }

    const bankResult = toBankResult(bankTransactions);
    if (bankResult.length === 0) return null;
    return bankResult;
  };

  const parseContractDocument = async (documentUrl: string, opts?: { verify?: boolean }): Promise<void> => {
    if (documentUrl) setParsingDocs((prev) => Array.from(new Set([...prev, documentUrl])));
    const loadingToast = toast.loading("Parsing contract document...");
    try {
      const encodedPdfUrl = encodeURI(documentUrl);
      const payload: any = { pdf_url: encodedPdfUrl };

      const response = await axios.post("/api/extract-contract", payload);
      const resData = response.data;
      const normalized = normalizeContractExtraction(resData?.contracts ? resData.contracts : resData);
      if (normalized?.contracts && Array.isArray(normalized.contracts)) {
        normalized.contracts = normalized.contracts.map((c: any) => ({
          ...c,
          document_url: documentUrl,
        }));
      }
      if (normalized) appendExtraction(recordId, normalized);

      if (resData?.verify_result) {
        setVerificationResult(resData.verify_result);
        try {
          const vKey = recordId ? `contract_verification_${recordId}` : "contract_verification";
          sessionStorage.setItem(vKey, JSON.stringify(resData.verify_result));
        } catch {}
      }

      setParsedDocs((prev) => (documentUrl ? Array.from(new Set([...prev, documentUrl])) : prev));
      toast.success("Contract parsed successfully. Running verification...");
      toast.dismiss(loadingToast);

      // Auto-verify after parsing
      await autoVerifyAfterParse(normalized);
    } catch (error) {
      console.error("Manual contract parse error:", error);
      toast.error("Failed to parse contract document.");
    } finally {
      toast.dismiss(loadingToast);
      if (documentUrl) {
        setParsingDocs((prev) => prev.filter((d) => d !== documentUrl));
      }
    }
  };

  const autoVerifyAfterParse = async (freshExtraction?: any): Promise<void> => {
    const verifyToast = toast.loading("Auto-verifying contracts with bank data...");
    try {
      // Build contractResult from freshExtraction or fall back to session
      let contractResult = freshExtraction;
      if (!contractResult) {
        const listKey = getExtractionListKey(recordId);
        const listStored = sessionStorage.getItem(listKey);
        const listParsed = listStored ? JSON.parse(listStored) : null;
        const merged = Array.isArray(listParsed) && listParsed.length > 0 ? mergeContractExtractions(listParsed) : null;
        contractResult = merged || extractionData;
      }
      if (!contractResult) return;

      const bankResult = await getBankResultForVerify();
      if (!bankResult) return; // No bank data yet — skip silently

      const payload = {
        contract_result: Array.isArray(contractResult?.contracts) ? contractResult.contracts : contractResult,
        bank_result: bankResult,
      };

      const response = await axios.post("/api/verify-contracts", payload);
      const resData = response.data;
      const result = resData?.verify_result || resData;
      setVerificationResult(result);
      try {
        if (recordId) sessionStorage.setItem(`contract_verification_${recordId}`, JSON.stringify(result));
        // Also persist under the key the financial page reads
        if (recordId) sessionStorage.setItem(`contract_extraction_${recordId}`, JSON.stringify(
          Array.isArray(contractResult?.contracts) ? contractResult : contractResult
        ));
      } catch {}
      toast.success("Contracts verified successfully.");
    } catch (error: any) {
      console.error("Auto-verify error:", error);
      // Silent failure for auto-verify — don't block user flow
    } finally {
      toast.dismiss(verifyToast);
    }
  };

  const handleVerifyContracts = async (): Promise<void> => {
    if (!recordId) return;
    setIsVerifying(true);
    const loadingToast = toast.loading("Verifying contracts...");
    try {
      let contractResult = extractionData;
      if (!contractResult) {
        const listKey = getExtractionListKey(recordId);
        const listStored = sessionStorage.getItem(listKey);
        const listParsed = listStored ? JSON.parse(listStored) : null;
        const merged = Array.isArray(listParsed) && listParsed.length > 0 ? mergeContractExtractions(listParsed) : null;
        if (merged) contractResult = merged;
      }
      if (!contractResult) {
        const singleKey = getExtractionKey(recordId);
        const stored = sessionStorage.getItem(singleKey);
        contractResult = stored ? JSON.parse(stored) : null;
      }
      if (!contractResult) {
        toast.error("No contract extraction data found.");
        return;
      }

      const bankResult = await getBankResultForVerify();
      if (!bankResult) {
        toast.error("No bank transactions found for verification.");
        return;
      }

      const payload = {
        contract_result: Array.isArray(contractResult?.contracts) ? contractResult.contracts : contractResult,
        bank_result: bankResult,
      };

      try {
        const payloadKey = `contract_verification_payload_${recordId}`;
        sessionStorage.setItem(payloadKey, JSON.stringify(payload));
      } catch {}

      const response = await axios.post("/api/verify-contracts", payload);
      const resData = response.data;
      setVerificationResult(resData?.verify_result || resData);
      try {
        const vKey = `contract_verification_${recordId}`;
        sessionStorage.setItem(vKey, JSON.stringify(resData?.verify_result || resData));
      } catch {}
      toast.success("Contracts verified successfully.");
    } catch (error: any) {
      console.error("Contract verification error:", error);
      toast.error(error?.response?.data?.details || "Failed to verify contracts.");
    } finally {
      setIsVerifying(false);
      toast.dismiss(loadingToast);
    }
  };

  const handleAddContract = (contract: Contract): void => {
    setContracts((prev) => [...prev, contract]);
    setShowForm(false);
  };

  const handleParseAllContracts = async (): Promise<void> => {
    const targets = contracts.filter(
      (c) => c.document && c.document.startsWith("http") && !parsedDocs.includes(c.document)
    );
    if (targets.length === 0) return;
    setIsParsingAll(true);
    for (const c of targets) {
      await parseContractDocument(c.document as string);
    }
    // Run a final verification pass after all contracts are parsed
    await autoVerifyAfterParse(undefined);
    setIsParsingAll(false);
  };

  const handleDeleteContract = (id: number): void => {
    setContracts((prev) => prev.filter(c => c.id !== id));
    toast.success("Contract removed.");
  };

  const handleContinue = async (): Promise<void> => {
    setIsSubmitting(true);
    markComplete(recordId, "contracts");

    const shouldLog = process.env.ENVIORNMENT !== "PROD";
    const logSave = (step: string, payload?: any, response?: any) => {
      if (!shouldLog) return;
      console.log(`[contracts] ${step}`, { payload, response });
    };

    if (recordId) {
      const token = getClientToken();
      try {
        const hrPayload = {
          result_complete_sections: {
            ...(await getSavedResults(recordId)),
            business_nature: businessNature,
            contracts_count: contracts.length,
            contracts: contracts,
            contract_extraction_data: extractionData,
          }
        };
        const hrRes = await updateHRValidationRecordAction(recordId, hrPayload, token);
        logSave("update-hr-record", hrPayload, hrRes);
        router.push(`/employer/sections/financial?recordId=${recordId}`);
      } catch (err) {
        console.error("Error completing contracts validation:", err);
        logSave("complete:error", { recordId }, err);
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

  const hasContracts = contracts.length > 0;
  const needsContracts = businessNature === "b2b" || businessNature === "healthcare";
  const canContinue = !needsContracts || (needsContracts && hasContracts);
  const extractedContracts = Array.isArray(extractionData?.contracts) ? extractionData.contracts : [];
  const verificationSummary = Array.isArray(verificationResult?.verification_summary) ? verificationResult.verification_summary : [];

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
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Uploaded Files</div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {Array.from(
                      new Set(contracts.map((c) => c.document).filter((d): d is string => Boolean(d)))
                    ).map((doc) => (
                      <a
                        key={doc}
                        href={doc.startsWith("http") ? doc : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "12.5px", color: doc.startsWith("http") ? "#0852C9" : "#94A3B8", textDecoration: doc.startsWith("http") ? "underline" : "none" }}
                      >
                        {doc.split("/").pop() || "Document"}
                      </a>
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 0.9fr 0.9fr 0.5fr", padding: "0 4px 10px", borderBottom: "1px solid #F1F5F9" }}>
                  {["Client Name", "Amount", "Period", "Doc", "Parse", ""].map((h) => (
                    <div key={h} style={{ fontSize: "12.5px", color: "#94A3B8", fontWeight: "500" }}>{h}</div>
                  ))}
                </div>
                {contracts.map((c) => (
                  <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 0.9fr 0.9fr 0.5fr", padding: "13px 4px", borderBottom: "1px solid #F8FAFC", alignItems: "center" }}>
                    <div style={{ fontSize: "14px", color: "#0F172A", fontWeight: "500" }}>{c.clientName}</div>
                    <div style={{ fontSize: "13px", color: "#64748B" }}>{c.contract_amount || "—"}</div>
                    <div style={{ fontSize: "13px", color: "#64748B" }}>{c.period || "—"}</div>
                    <div style={{ fontSize: "14px", color: "#94A3B8" }}>
                      {c.document ? (
                        <a 
                          href={c.document.startsWith('http') ? c.document : '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: c.document.startsWith('http') ? "#0852C9" : "#94A3B8", 
                            textDecoration: c.document.startsWith('http') ? "underline" : "none",
                            cursor: c.document.startsWith('http') ? "pointer" : "default"
                          }}
                        >
                          {c.document.startsWith('http') ? "View" : "✓"}
                        </a>
                      ) : "—"}
                    </div>
                    <div>
                      {c.document && parsingDocs.includes(c.document) ? (
                        <SpinnerIcon color="#0852C9" />
                      ) : c.document && parsedDocs.includes(c.document) ? (
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#16A34A" }}>Parsed</span>
                      ) : (
                        <button
                          onClick={() => c.document && c.document.startsWith("http") && parseContractDocument(c.document)}
                          disabled={!c.document || !c.document.startsWith("http")}
                          style={{
                            padding: "8px 10px",
                            backgroundColor: (!c.document || !c.document.startsWith("http")) ? "#93ABDE" : "#0852C9",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: (!c.document || !c.document.startsWith("http")) ? "not-allowed" : "pointer",
                          }}
                        >
                          Parse
                        </button>
                      )}
                    </div>
                    <div>
                      <button 
                        onClick={() => handleDeleteContract(c.id)}
                        style={{ border: "none", backgroundColor: "transparent", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="Delete contract"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleParseAllContracts}
                    disabled={isParsingAll || contracts.filter((c) => c.document && c.document.startsWith("http") && !parsedDocs.includes(c.document)).length === 0}
                    style={{
                      padding: "12px 16px",
                      backgroundColor: (isParsingAll || contracts.filter((c) => c.document && c.document.startsWith("http") && !parsedDocs.includes(c.document)).length === 0) ? "#93ABDE" : "#0852C9",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      fontWeight: "600",
                      cursor: (isParsingAll || contracts.filter((c) => c.document && c.document.startsWith("http") && !parsedDocs.includes(c.document)).length === 0) ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {isParsingAll && <SpinnerIcon color="#fff" />}
                    {isParsingAll ? "Parsing..." : "Parse All Contracts"}
                  </button>
                </div>
              </div>
            )}

            {/* Add form or add button */}
            {showForm ? (
              <AddContractForm
                onAdd={handleAddContract}
                onCancel={() => setShowForm(false)}
              />
            ) : (
              <div style={{ marginBottom: "14px" }}>
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    width: "100%", padding: "14px", backgroundColor: "white",
                    border: "1.5px solid #E2E8F0", borderRadius: "10px",
                    fontSize: "14px", fontWeight: "500", color: "#374151",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>+</span> Add Manually
                </button>
              </div>
            )}

            {extractedContracts.length > 0 && (
              <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px 24px", marginBottom: "14px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>Parsed Contracts</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 0.8fr", padding: "0 4px 10px", borderBottom: "1px solid #F1F5F9" }}>
                  {["Client Name", "Amount", "Period", "Exists", "Aligns", "Doc"].map((h) => (
                    <div key={h} style={{ fontSize: "12.5px", color: "#94A3B8", fontWeight: "500" }}>{h}</div>
                  ))}
                </div>
                {extractedContracts.map((c: any, idx: number) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 0.8fr", padding: "13px 4px", borderBottom: "1px solid #F8FAFC", alignItems: "center" }}>
                    <div style={{ fontSize: "14px", color: "#0F172A", fontWeight: "500" }}>{c.client || "—"}</div>
                    <div style={{ fontSize: "13px", color: "#64748B" }}>{c.contract_amount || c.amount || "—"}</div>
                    <div style={{ fontSize: "13px", color: "#64748B" }}>{c.period || "—"}</div>
                    <div><GreenCheck /></div>
                    <div><GreenCheck /></div>
                    <div style={{ fontSize: "14px", color: "#94A3B8" }}>
                      {c.document_url || c.pdf_url ? (
                        <a 
                          href={String(c.document_url || c.pdf_url)}
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: String(c.document_url || c.pdf_url).startsWith('http') ? "#0852C9" : "#94A3B8", 
                            textDecoration: String(c.document_url || c.pdf_url).startsWith('http') ? "underline" : "none",
                            cursor: String(c.document_url || c.pdf_url).startsWith('http') ? "pointer" : "default"
                          }}
                        >
                          {String(c.document_url || c.pdf_url).startsWith('http') ? "View" : "✓"}
                        </a>
                      ) : "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={handleVerifyContracts}
                disabled={isVerifying}
                style={{
                  padding: "12px 16px",
                  backgroundColor: isVerifying ? "#93ABDE" : "#0852C9",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  fontWeight: "600",
                  cursor: isVerifying ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {isVerifying && <SpinnerIcon color="#fff" />}
                {isVerifying ? "Verifying..." : verificationResult ? "Re-verify Contracts" : "Verify Contracts"}
              </button>
            </div>

            {verificationResult && (
              <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "16px 20px", marginBottom: "14px" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", marginBottom: "8px" }}>
                  Verification Summary
                </div>
                <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "10px" }}>
                  Total Verified: {verificationResult.total_verified ?? 0}
                </div>
                {Array.isArray(verificationResult.verification_summary) && verificationResult.verification_summary.length > 0 ? (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {verificationResult.verification_summary.map((v: any, idx: number) => (
                      <div key={idx} style={{ border: "1px solid #F1F5F9", borderRadius: "8px", padding: "10px 12px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>
                          Contract: {v.contract || v.contract_uid || "—"}
                        </div>
                        <div style={{ fontSize: "12.5px", color: v.status === "Verified" ? "#166534" : "#DC2626" }}>
                          Status: {v.status || "—"}
                        </div>
                        {v.match_details && (
                          <div style={{ fontSize: "12.5px", color: "#475569", marginTop: "4px" }}>
                            Match: {v.match_details.description || "—"} • {v.match_details.date || "—"} • {v.match_details.amount || "—"}
                          </div>
                        )}
                        {v.matched_transaction && (
                          <div style={{ fontSize: "12.5px", color: "#475569", marginTop: "4px" }}>
                            Match: {v.matched_transaction.description || "—"} • {v.matched_transaction.date || "—"} • {v.matched_transaction.paid_in || v.matched_transaction.paid_out || "—"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "12.5px", color: "#94A3B8" }}>No verification results yet.</div>
                )}
              </div>
            )}

            {(extractedContracts.length > 0 || verificationSummary.length > 0) && (
              <div style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "16px 20px", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>Parsed & Verification Details</div>
                  <button
                    onClick={() => setShowDetailsModal(true)}
                    style={{ border: "none", backgroundColor: "transparent", color: "#0852C9", fontSize: "12.5px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Show more
                  </button>
                </div>
                {extractedContracts.length > 0 && (
                  <div style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "12.5px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Contracts</div>
                    <div style={{ display: "grid", gap: "6px" }}>
                      {extractedContracts.slice(0, 3).map((c: any, idx: number) => (
                        <div key={idx} style={{ fontSize: "12.5px", color: "#0F172A" }}>
                          {c.client || "—"} • {c.contract_amount || c.amount || "—"} • {c.period || "—"}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {verificationSummary.length > 0 && (
                  <div>
                    <div style={{ fontSize: "12.5px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Verification</div>
                    <div style={{ display: "grid", gap: "6px" }}>
                      {verificationSummary.slice(0, 3).map((v: any, idx: number) => (
                        <div key={idx} style={{ fontSize: "12.5px", color: "#0F172A" }}>
                          {v.client_name || "—"} • {v.status || "—"}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
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

      {showDetailsModal && (
        <div
          onClick={() => setShowDetailsModal(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", zIndex: 50 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(900px, 100%)", maxHeight: "85vh", overflow: "auto", backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px 22px" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>Parsed & Verification Details</div>
              <button onClick={() => setShowDetailsModal(false)} style={{ border: "none", backgroundColor: "transparent", fontSize: "14px", color: "#64748B", cursor: "pointer" }}>Close</button>
            </div>

            {extractedContracts.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "8px" }}>Contracts</div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {extractedContracts.map((c: any, idx: number) => (
                    <div key={idx} style={{ border: "1px solid #F1F5F9", borderRadius: "8px", padding: "10px 12px" }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>{c.client || "—"}</div>
                      <div style={{ fontSize: "12.5px", color: "#475569" }}>Provider: {c.service_provider || "—"}</div>
                      <div style={{ fontSize: "12.5px", color: "#475569" }}>Amount: {c.contract_amount || c.amount || "—"} • Period: {c.period || "—"}</div>
                      <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "4px" }}>{c.text_block || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {verificationSummary.length > 0 && (
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "8px" }}>Verification</div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {verificationSummary.map((v: any, idx: number) => (
                    <div key={idx} style={{ border: "1px solid #F1F5F9", borderRadius: "8px", padding: "10px 12px" }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>{v.client_name || "—"}</div>
                      <div style={{ fontSize: "12.5px", color: v.status === "Verified" ? "#166534" : "#DC2626" }}>Status: {v.status || "—"}</div>
                      <div style={{ fontSize: "12.5px", color: "#475569" }}>Contract UID: {v.contract_uid || "—"}</div>
                      {v.matched_transaction && (
                        <div style={{ fontSize: "12.5px", color: "#475569", marginTop: "4px" }}>
                          Match: {v.matched_transaction.description || "—"} • {v.matched_transaction.date || "—"} • {v.matched_transaction.paid_in || v.matched_transaction.paid_out || "—"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const lbl: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #D1D5DB", fontSize: "14px", outline: "none", boxSizing: "border-box", color: "#0F172A", backgroundColor: "white" };
const cancelBtn: React.CSSProperties = { padding: "11px 20px", borderRadius: "8px", border: "1.5px solid #D1D5DB", backgroundColor: "white", fontSize: "14px", fontWeight: "500", cursor: "pointer", color: "#374151" };
const primaryBtn: React.CSSProperties = { padding: "11px 20px", borderRadius: "8px", border: "none", backgroundColor: "#0852C9", color: "white", fontSize: "14px", fontWeight: "600" };