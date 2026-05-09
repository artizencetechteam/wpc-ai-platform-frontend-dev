'use client';

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import HRValidationTabs from "../_components/HRValidationTabs";
import { listHRValidationRecordsAction, listEmployeesAction, updateHRValidationRecordAction, updateEmployeeAction } from "@/app/employer/sections/action/action";
import { getClientToken } from "@/app/employer/sections/company/page";


// --- Types ---
type TabId = "company" | "staff" | "rtw" | "pension" | "auth" | "contracts" | "financial" | "summary";

type Employee = {
  id: string;
  employee_full_name: string;
  nationality: string;
  documentType?: string;
  documentNumber?: string;
  startDate?: string;
  passportNumber?: string;
  check_date?: string | null;
  company_name?: string | null;
  rtw_document_url?: string | null;
  rtw_expiry_date?: string | null;
};

// --- Icons ---
const GreenCheckCircle = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
    <circle cx="28" cy="28" r="27" stroke="#10B981" strokeWidth="2" fill="none" />
    <path d="M18 28l8 8 12-14" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}>
    <path d="M8 2L1 14h14L8 2z" fill="none" stroke="#DC2626" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M8 7v3M8 12v.5" stroke="#DC2626" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const SpinnerIcon = ({ color = "#0852C9" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="10" cy="10" r="8" stroke="#CBD5E1" strokeWidth="2.5" />
    <path d="M10 2a8 8 0 018 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const CloudIcon = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19L19 19C21.2091 19 23 17.2091 23 15C23 12.7909 21.2091 11 19 11C18.8296 11 18.6625 11.0107 18.4988 11.0317C17.7412 8.14811 15.1182 6 12 6C9.11584 6 6.6247 7.8258 5.67232 10.3957C3.12061 10.7483 1 12.9163 1 15.5C1 18.5376 3.46243 21 6.5 21L8 21" />
    <path d="M12 11V21M12 11L9 14M12 11L15 14" />
  </svg>
);

// --- Helpers ---
function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
  const month = d.toLocaleString("en-GB", { month: "long" });
  return `${month} ${day}${suffix}, ${d.getFullYear()}`;
}

function getInitial(name?: string): string {
  return (name || "?").trim()[0].toUpperCase();
}

function toISODate(val?: string | null): string | null {
  if (!val) return null;
  let normalized = val;
  // Handle DD-MM-YYYY or DD/MM/YYYY
  const separator = val.includes("-") ? "-" : val.includes("/") ? "/" : null;
  if (separator && val.split(separator)[0].length === 2) {
    const [d, m, y] = val.split(separator);
    normalized = `${y}-${m}-${d}`;
  }
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return val;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  // The backend expects Date format: YYYY-MM-DD
  return `${year}-${month}-${day}`;
}

// --- NoMigrantScreen ---
function NoMigrantScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div style={{ maxWidth: "860px", margin: "30px auto", padding: "0 24px" }}>
      <div style={{
        backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E8F0",
        padding: "80px 40px", display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center", gap: "10px",
      }}>
        <GreenCheckCircle />
        <h2 style={{ margin: "10px 0 0", fontSize: "20px", fontWeight: "700", color: "#0F172A" }}>No Migrant Employees</h2>
        <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748B", maxWidth: "380px", lineHeight: "1.65" }}>
          All employees are British/Irish and skip RTW validation.
        </p>
        <button
          onClick={() => {
            const btn = event?.currentTarget as HTMLButtonElement;
            if (btn) btn.disabled = true;
            onContinue();
          }}
          style={{
            marginTop: "12px", padding: "11px 28px", backgroundColor: "#0852C9",
            color: "white", border: "none", borderRadius: "8px",
            fontSize: "14px", fontWeight: "600", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px"
          }}
        >
          Continue to Bank Statement
        </button>
      </div>
    </div>
  );
}

// --- RTWVerificationScreen ---
interface RTWVerificationScreenProps {
  migrants: Employee[];
  onBackToStaffList: () => void;
  onContinue: () => void;
  onSaveEmployee: (empId: string, data: any) => Promise<void>;
}

function RTWVerificationScreen({ migrants, onBackToStaffList, onContinue, onSaveEmployee }: RTWVerificationScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const employee = migrants[currentIndex];
  const hasDocument = !!(employee?.documentType || employee?.documentNumber);
  const formattedStart = employee?.startDate ? formatDate(employee.startDate) : null;

  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [manualName, setManualName] = useState("");
  const [checkDate, setCheckDate] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [rtwDocumentUrl, setRtwDocumentUrl] = useState<string | null>(employee?.rtw_document_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [manualRefNumber, setManualRefNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");


  // ── RTW Compliance: check date must be BEFORE employment start date ──────────
  const getRTWComplianceStatus = () => {
    if (!checkDate || !employee?.startDate) return 'pending';

    // Normalize to YYYY-MM-DD for reliable comparison regardless of time/timezone
    const checkStr = checkDate.split('T')[0];
    const startStr = employee.startDate.split('T')[0];

    if (!checkStr || !startStr) return 'pending';
    return checkStr < startStr ? 'compliant' : 'non-compliant';
  };
  const complianceStatus = getRTWComplianceStatus();
  const isNonCompliant = complianceStatus === 'non-compliant';

  useEffect(() => {
    if (employee) {
      setCheckDate(toISODate(extractedData?.check_date || employee.check_date) || "");
      const rawCompany = extractedData?.company_name || employee.company_name || "";
      setCompanyName(rawCompany.replace(/\s+/g, " ").trim());
      setRtwDocumentUrl(employee.rtw_document_url || null);
      setManualName(employee.employee_full_name || "");
      setManualRefNumber(employee.documentNumber || employee.passportNumber || "");
      setExpiryDate(toISODate(extractedData?.rtw_expiry_date || extractedData?.expiry_date || extractedData?.visa_expiry_date || employee.rtw_expiry_date) || "");
      setIsEditing(false); // Reset edit mode when switching employees
    }
  }, [currentIndex, extractedData, employee]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    const loadingToast = toast.loading("Uploading and analyzing RTW document...");

    try {
      // 1. Get presigned URL from Cloudflare R2 proxy
      const presignRes = await axios.post("/api/upload-presign", {
        fileName: `RTW Documents/${file.name}`,
        fileType: file.type || "application/pdf",
      });
      const { presignedUrl, publicUrl } = presignRes.data;

      // 2. PUT directly to Cloudflare R2
      await axios.put(presignedUrl, file, {
        headers: { "Content-Type": file.type || "application/pdf" },
      });

      setRtwDocumentUrl(publicUrl);

      // 3. Extract RTW details from the stored URL
      const response = await axios.post("/api/extract-rtw", { file_url: publicUrl });
      const data = response.data;

      if (data.status === "success" && data.rtw_work_document) {
        const extracted = data.rtw_work_document;
        const newData = {
          employee_name: extracted.employee_name,
          company_name: extracted.company_name,
          check_date: extracted.date_of_check,
          reference_number: extracted.reference_number,
          expiry_date: extracted.rtw_expiry_date || extracted.expiry_date || extracted.visa_expiry_date
        };
        setExtractedData(newData);

        // 4. Immediately save to backend to ensure data is not lost
        await onSaveEmployee(employee.id, {
          employee_full_name: extracted.employee_name || employee.employee_full_name,
          rtw_document_url: publicUrl,
          passport_number: extracted.reference_number,
          check_date: toISODate(extracted.date_of_check),
          rtw_expiry_date: toISODate(extracted.rtw_expiry_date || extracted.expiry_date || extracted.visa_expiry_date),
          company_name: extracted.company_name
        });

        toast.success("RTW details extracted and saved!");
      } else {
        // Even if extraction fails, we should save the URL if we have it
        await onSaveEmployee(employee.id, { rtw_document_url: publicUrl });
        toast.error(data.message || "Extraction failed, but document was uploaded.");
      }
    } catch (err: any) {
      console.error("RTW upload/extraction error:", err);
      toast.error(err.response?.data?.details || "Failed to upload or parse RTW document.");
    } finally {
      setIsExtracting(false);
      toast.dismiss(loadingToast);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveManualCorrection = async () => {
    setIsSubmitting(true);
    const loadingToast = toast.loading("Saving corrections...");
    try {
      await onSaveEmployee(employee.id, {
        employee_full_name: manualName,
        check_date: checkDate, // Already in YYYY-MM-DD format from setCheckDate
        company_name: companyName,
        passport_number: manualRefNumber,
        rtw_expiry_date: expiryDate
      });
      setIsEditing(false);
      toast.success("Details updated successfully!");
    } catch (err) {
      toast.error("Failed to save corrections.");
    } finally {
      setIsSubmitting(false);
      toast.dismiss(loadingToast);
    }
  };

  return (
    <div style={{ maxWidth: "860px", margin: "30px auto", padding: "0 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "22px" }}>
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.3px" }}>
          Workflow 1: RTW & Start Date Compliance
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: "13.5px", color: "#64748B" }}>
          Validating Right to Work documents for migrant employees
        </p>
      </div>

      {/* Employee Info & Card */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button style={{
          padding: "5px 16px", borderRadius: "20px",
          border: "1.5px solid #E2E8F0",
          backgroundColor: "white", color: "#475569",
          fontSize: "13px", fontWeight: "400", cursor: "default",
        }}>Employee {currentIndex + 1} of {migrants.length}</button>
        <span style={{ fontSize: "13.5px", color: "#475569", fontWeight: "500" }}>{employee?.employee_full_name}</span>
      </div>

      <div style={{
        backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0",
        padding: "20px 24px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "16px",
      }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px", fontWeight: "700", color: "#0852C9", flexShrink: 0,
        }}>{getInitial(employee?.employee_full_name)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "17px", fontWeight: "700", color: "#0F172A" }}>{employee?.employee_full_name}</div>
          <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
            Migrant Worker{formattedStart ? ` • Employment Start: ${formattedStart}` : ""}
          </div>
        </div>

        {/* Upload/Change Button */}
        <div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} accept=".pdf,.png,.jpg,.jpeg" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 16px", backgroundColor: "#F0F9FF",
              border: "1.5px solid #0EA5E9", borderRadius: "8px",
              color: "#0369A1", fontSize: "13.5px", fontWeight: "600",
              cursor: isExtracting ? "not-allowed" : "pointer"
            }}
          >
            {isExtracting ? <SpinnerIcon color="#0EA5E9" /> : <CloudIcon />}
            {isExtracting ? "Analyzing..." : (rtwDocumentUrl || hasDocument) ? "Change Document" : "Upload RTW Document"}
          </button>
        </div>
      </div>

      {/* View Document Link if exists */}
      {((rtwDocumentUrl && rtwDocumentUrl !== "null") || (employee?.rtw_document_url && employee.rtw_document_url !== "null")) && (
        <div style={{ marginBottom: "20px" }}>
          <a
            href={rtwDocumentUrl || employee?.rtw_document_url || "#"}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              fontSize: "13px", color: "#0852C9", fontWeight: "600", textDecoration: "none",
              padding: "6px 12px", backgroundColor: "#EFF6FF", borderRadius: "6px", border: "1px solid #DBEAFE"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
            View Uploaded RTW Document
          </a>
        </div>
      )}

      {/* RTW Verification */}
      <div style={{
        backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E8F0",
        padding: "24px 26px", marginBottom: "28px",
      }}>
        <h3 style={{ margin: "0 0 5px", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>RTW Document Verification</h3>
        <p style={{ margin: "0 0 18px", fontSize: "13px", color: "#64748B" }}>Verify the uploaded RTW document and extracted information</p>

        {!hasDocument && !extractedData ? (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "11px",
            padding: "14px 18px",
            backgroundColor: "#FFF5F5",
            borderRadius: "8px", border: "1.5px solid #FCA5A5",
          }}>
            <AlertTriangleIcon />
            <div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#DC2626", marginBottom: "3px" }}>RTW Document Missing</div>
              <div style={{ fontSize: "13px", color: "#DC2626", lineHeight: "1.5" }}>
                No RTW document has been uploaded for this employee. Please upload a document to proceed.
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: "16px 18px",
            backgroundColor: isNonCompliant ? "#FFF5F5" : "#F0FDF4",
            borderRadius: "8px",
            border: isNonCompliant ? "1.5px solid #FCA5A5" : "1.5px solid #BBF7D0",
          }}>
            {/* Compliance status header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isNonCompliant ? (
                  <div style={{ color: "#DC2626", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertTriangleIcon />
                    {extractedData ? "Extracted Information" : "Document on File"} - Non-Compliant
                  </div>
                ) : (
                  <div style={{ color: "#166534", fontSize: "14px", fontWeight: "700" }}>✓ {extractedData ? "Extracted Information" : "Document on File"}</div>
                )}
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    fontSize: "12px", color: "#0852C9", fontWeight: "600",
                    background: "none", border: "none", cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Edit Details Manually
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    fontSize: "12px", color: "#64748B", fontWeight: "600",
                    background: "none", border: "none", cursor: "pointer"
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              {/* Employee Name */}
              <div>
                <div style={{ fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Employee Name</div>
                {isEditing || extractedData?.name_extraction_failed ? (
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: "6px",
                      border: "1px solid #CBD5E1", fontSize: "13px", outline: "none"
                    }}
                  />
                ) : (
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
                    {manualName || employee.employee_full_name}
                  </div>
                )}
              </div>

              {/* Check Date */}
              <div>
                <div style={{ fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Check Date</div>
                {isEditing ? (
                  <input
                    type="date"
                    value={checkDate ? checkDate.split('T')[0] : ""}
                    onChange={(e) => setCheckDate(toISODate(e.target.value) || "")}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: "6px",
                      border: "1px solid #CBD5E1", fontSize: "13px", outline: "none"
                    }}
                  />
                ) : (
                  <div style={{ fontSize: "14px", fontWeight: "600", color: isNonCompliant ? "#DC2626" : "#0F172A" }}>
                    {checkDate ? formatDate(checkDate) : "N/A"}
                    {isNonCompliant && <span style={{ fontSize: "11px", marginLeft: "6px", color: "#DC2626" }}>⚠ After start date</span>}
                  </div>
                )}
              </div>

              {/* Company Name */}
              <div>
                <div style={{ fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Company Name</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: "6px",
                      border: "1px solid #CBD5E1", fontSize: "13px", outline: "none"
                    }}
                  />
                ) : (
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
                    {companyName || "N/A"}
                  </div>
                )}
              </div>

              {/* Reference Number */}
              <div>
                <div style={{ fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Reference Number</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={manualRefNumber}
                    onChange={(e) => setManualRefNumber(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: "6px",
                      border: "1px solid #CBD5E1", fontSize: "13px", outline: "none"
                    }}
                  />
                ) : (
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
                    {manualRefNumber || "N/A"}
                  </div>
                )}
              </div>

              {/* Expiry Date */}
              <div>
                <div style={{ fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Expiry Date</div>
                {isEditing ? (
                  <input
                    type="date"
                    value={expiryDate ? expiryDate.split('T')[0] : ""}
                    onChange={(e) => setExpiryDate(toISODate(e.target.value) || "")}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: "6px",
                      border: "1px solid #CBD5E1", fontSize: "13px", outline: "none"
                    }}
                  />
                ) : (
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
                    {expiryDate ? formatDate(expiryDate) : "N/A"}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button in Edit Mode */}
            {isEditing && (
              <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleSaveManualCorrection}
                  disabled={isSubmitting}
                  style={{
                    padding: "8px 20px", backgroundColor: "#0852C9", color: "white",
                    border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                  }}
                >
                  {isSubmitting && <SpinnerIcon color="#fff" />}
                  Save Corrections
                </button>
              </div>
            )}

            {/* Non-compliance warning banner */}
            {isNonCompliant && (
              <div style={{
                marginTop: "16px", paddingTop: "14px",
                borderTop: "1px solid #FCA5A5",
                display: "flex", alignItems: "flex-start", gap: "10px",
              }}>
                <AlertTriangleIcon />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#DC2626", marginBottom: "3px" }}>Compliance Violation Detected</div>
                  <div style={{ fontSize: "12.5px", color: "#B91C1C", lineHeight: "1.55" }}>
                    RTW check was conducted on <strong>{formatDate(checkDate)}</strong>, which is on or after the employment start date (<strong>{formattedStart}</strong>).
                    The Right to Work check must be completed <em>before</em> employment begins.
                  </div>
                </div>
              </div>
            )}

            {/* Routing / Reason (Metadata from AI) */}
            {extractedData?.routing && !isNonCompliant && (
              <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #BBF7D0" }}>
                <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Compliance Context</div>
                <div style={{ fontSize: "12.5px", color: "#166534", lineHeight: "1.5" }}>
                  {extractedData.routing.reason}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBackToStaffList} style={{
          padding: "10px 20px", backgroundColor: "white", color: "#374151",
          border: "1.5px solid #D1D5DB", borderRadius: "8px",
          fontSize: "14px", fontWeight: "500", cursor: "pointer",
        }}>Back to Staff List</button>

        <div style={{ display: "flex", gap: "10px" }}>
          {currentIndex > 0 && <button onClick={() => setCurrentIndex(currentIndex - 1)} style={{
            padding: "10px 18px", backgroundColor: "white", color: "#475569",
            border: "1.5px solid #E2E8F0", borderRadius: "8px",
            fontSize: "13.5px", fontWeight: "500", cursor: "pointer",
          }}>← Previous</button>}
          {currentIndex < migrants.length - 1 ? (
            <button
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await new Promise(resolve => setTimeout(resolve, 500));
                  setCurrentIndex(currentIndex + 1);
                  setExtractedData(null);
                  setManualName("");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              style={{
                padding: "10px 18px", backgroundColor: isSubmitting ? "#93ABDE" : "#0852C9", color: "white",
                border: "none", borderRadius: "8px",
                fontSize: "13.5px", fontWeight: "600", cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "8px"
              }}
            >
              {isSubmitting && <SpinnerIcon color="#fff" />}
              Next Employee →
            </button>
          ) : (
            <button
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  onContinue();
                } finally {
                  // Keep it true if we are navigating away
                }
              }}
              disabled={isSubmitting}
              style={{
                padding: "10px 18px", backgroundColor: isSubmitting ? "#93ABDE" : "#0852C9", color: "white",
                border: "none", borderRadius: "8px",
                fontSize: "13.5px", fontWeight: "600", cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "8px"
              }}
            >
              {isSubmitting && <SpinnerIcon color="#fff" />}
              {isSubmitting ? "Processing..." : "Continue to Bank Statement"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RTWCompliance() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><SpinnerIcon /></div>}>
      <RTWComplianceImpl />
    </Suspense>
  );
}

function RTWComplianceImpl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      let dataLoaded = false;
      try {
        const token = getClientToken();
        if (token) {
          const queryId = searchParams.get("recordId") || searchParams.get("id");
          let id = queryId || sessionStorage.getItem("current_hr_record_id");

          if (!id) {
            const hrRes = await listHRValidationRecordsAction(token);
            if (hrRes.success && hrRes.data && hrRes.data.length > 0) {
              const sorted = [...hrRes.data].sort((a, b) => b.id - a.id);
              id = String(sorted[0].id);
              sessionStorage.setItem("current_hr_record_id", id);
            }
          }
          const numId = id ? Number(id) : null;
          setRecordId(numId);

          if (numId) {
            const empRes = await listEmployeesAction(numId, token);
            if (empRes.success && empRes.data) {
              const mapped = empRes.data.map((e: any) => ({
                id: String(e.id),
                employee_full_name: e.employee_full_name,
                nationality: e.nationality || "Migrant",
                documentType: e.rtw_document_url ? "Uploaded Document" : "",
                documentNumber: e.passport_number || "", // Don't fallback to URL here
                startDate: e.employment_start_date,
                passportNumber: e.passport_number,
                check_date: e.check_date,
                company_name: e.company_name,
                rtw_document_url: e.rtw_document_url,
                rtw_expiry_date: e.rtw_expiry_date,
              }));
              setEmployees(mapped);
              sessionStorage.setItem(`hr_employees_${id}`, JSON.stringify(mapped));
              dataLoaded = true;
            }
          }
        }
      } catch (err) {
        console.error("Error fetching RTW employees via API", err);
      }

      if (!dataLoaded && recordId) {
        try {
          const saved = sessionStorage.getItem(`hr_employees_${recordId}`);
          if (saved) setEmployees(JSON.parse(saved));
        } catch { }
      }
      setLoaded(true);
    }
    loadData();
  }, [searchParams]);

  const migrants = employees.filter((e) => !["british", "irish", "british/irish"].includes(e.nationality?.toLowerCase() || ""));
  const hasMigrants = migrants.length > 0;

  const markRTWComplete = () => {
    if (!recordId) return;
    try {
      const p = JSON.parse(sessionStorage.getItem(`hr_progress_${recordId}`) || "{}");
      sessionStorage.setItem(`hr_progress_${recordId}`, JSON.stringify({ ...p, rtw: true }));
    } catch { }
  };

  const handleSaveEmployee = async (empId: string, data: any) => {
    console.log(`[handleSaveEmployee] Saving for ${empId}:`, data);
    try {
      const token = getClientToken();
      const res = await updateEmployeeAction(Number(empId), data, token);
      console.log(`[handleSaveEmployee] Response:`, res);

      if (res.success) {
        // Update local state so it persists if we go back/forward
        setEmployees(prev => prev.map(emp => emp.id === empId ? { ...emp, ...data } : emp));
      } else {
        toast.error(`Failed to save: ${res.message}`);
      }
    } catch (err) {
      console.error("Error saving employee RTW data:", err);
      toast.error("An error occurred while saving.");
    }
  };

  const handleBack = () => router.push(`/employer/sections/hr-validation?recordId=${recordId}`);
  const handleContinueToBank = async () => {
    markRTWComplete();

    if (recordId) {
      const token = getClientToken();
      try {
        const record = await getHRRecord(recordId);
        await updateHRValidationRecordAction(recordId, {
          result_complete_sections: {
            ...(record?.result_complete_sections || {}),
            has_migrants: hasMigrants,
            migrant_count: migrants.length,
          }
        }, token);
      } catch (err) {
        console.error("Error updating RTW status:", err);
      }
    }

    router.push(`/employer/sections/bank-statement?recordId=${recordId}`);
  };

  async function getHRRecord(id: number) {
    try {
      const token = getClientToken();
      const res = await listHRValidationRecordsAction(token);
      if (res.success && res.data) {
        return res.data.find(r => r.id === id);
      }
      return null;
    } catch { return null; }
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
      <HRValidationTabs currentTabId="rtw" hrRecordId={recordId} onBack={handleBack} />
      {loaded && (hasMigrants
        ? <RTWVerificationScreen
          migrants={migrants}
          onBackToStaffList={handleBack}
          onContinue={handleContinueToBank}
          onSaveEmployee={handleSaveEmployee}
        />
        : <NoMigrantScreen onContinue={handleContinueToBank} />
      )}
    </div>
  );
}