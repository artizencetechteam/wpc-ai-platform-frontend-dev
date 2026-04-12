'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { label: "0. Company", id: "company" },
  { label: "1. Staff List", id: "staff" },
  { label: "2. RTW Compliance", id: "rtw" },
  { label: "3. Pension", id: "pension" },
  { label: "4. Authorising Officer", id: "auth" },
  { label: "5. Contracts", id: "contracts" },
  { label: "6. Financial", id: "financial" },
  { label: "7. Summary", id: "summary" },
];

const TAB_ROUTES: Record<string, string> = {
  company: "/employer/sections/company",
  staff: "/employer/sections/hr-validation",
  rtw: "/employer/sections/rtw-compliance",
  pension: "/employer/sections/pension",
  auth: "/employer/sections/authorising-officer",
  contracts: "/employer/sections/contracts",
  financial: "/employer/sections/financial",
  summary: "/employer/sections/summary",
};

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface HRValidationTabsProps {
  currentTabId: string;
  hrRecordId: number | string | null;
  onBack?: () => void;
  staffComplete?: boolean; // Specifically for Staff List step
}

// ─── Helper ──────────────────────────────────────────────────────────────────

const getProgress = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem("hr_progress") || "{}");
  } catch {
    return {};
  }
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function HRValidationTabs({
  currentTabId,
  hrRecordId,
  onBack,
  staffComplete = false
}: HRValidationTabsProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tabProgress, setTabProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
    setTabProgress(getProgress());
  }, []);

  const isTabUnlocked = (tabId: string): boolean => {
    // Basic indices
    const tabIndices: Record<string, number> = {};
    TABS.forEach((t, i) => { tabIndices[t.id] = i; });
    
    const currentIndex = tabIndices[currentTabId] ?? 0;
    const targetIndex = tabIndices[tabId] ?? 0;

    // RULE 0: Always allow going back to previous steps
    if (targetIndex < currentIndex) return true;

    // RULE 1: Company is always step 0
    if (tabId === "company") return true;
    
    // Check if company name is set in sessionStorage
    const hasCompany = !!(hrRecordId && sessionStorage.getItem(`company_name_${hrRecordId}`));
    if (!hasCompany) return false;

    // Standard sequence validation
    if (tabId === "staff") return true; // Company is filled, so Staff is unlocked
    
    // For RTW, we need staff to be complete
    const isStaffDone = tabProgress.staff || staffComplete;
    if (tabId === "rtw") return !!isStaffDone;
    
    // Following steps use the progress map
    if (tabId === "pension") return !!tabProgress.rtw;
    if (tabId === "auth") return !!tabProgress.pension;
    if (tabId === "contracts") return !!tabProgress.auth;
    if (tabId === "financial") return !!tabProgress.contracts;
    if (tabId === "summary") return !!tabProgress.financial;

    return false;
  };

  const handleTabClick = (tabId: string) => {
    if (tabId === currentTabId || !isTabUnlocked(tabId)) return;
    if (TAB_ROUTES[tabId]) {
      // Preserve recordId in query if applicable
      const route = hrRecordId ? `${TAB_ROUTES[tabId]}?recordId=${hrRecordId}` : TAB_ROUTES[tabId];
      router.push(route);
    }
  };

  const defaultBack = () => {
    if (currentTabId === "company" || currentTabId === "staff") {
      router.push("/employer/dashboard");
    } else {
      router.back();
    }
  };

  return (
    <div style={{ backgroundColor: "white", borderBottom: "1px solid #E2E8F0", padding: "0 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "16px", paddingBottom: "2px" }}>
        <button 
          onClick={onBack || defaultBack} 
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
        >
          {["company", "staff"].includes(currentTabId) ? (
             <img src="/logo/main.png" alt="WPC AI" style={{ height: "32px", objectFit: "contain" }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 15L8 10L13 5" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <div style={{ marginLeft: currentTabId === "company" || currentTabId === "staff" ? "12px" : "0" }}>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>HR Records Validation</h1>
          <div style={{ fontSize: "11.5px", color: "#94A3B8", marginTop: "1px" }}>
            V.03{hrRecordId ? ` · Record #${hrRecordId}` : ""}
          </div>
        </div>
      </div>
      
      <div style={{ display: "flex", gap: "6px", marginTop: "10px", paddingBottom: "12px", overflowX: "auto" }}>
        {TABS.map((tab) => {
          const isActive = tab.id === currentTabId;
          const unlocked = mounted ? isTabUnlocked(tab.id) : (tab.id === "company");
          
          return (
            <button 
              key={tab.id} 
              onClick={() => handleTabClick(tab.id)} 
              style={{
                padding: "6px 16px", borderRadius: "20px",
                border: isActive ? "none" : "1.5px solid #D1D5DB",
                cursor: unlocked && !isActive ? "pointer" : "default",
                fontSize: "13px", fontWeight: isActive ? "600" : "400",
                color: isActive ? "white" : unlocked ? "#374151" : "#9CA3AF",
                backgroundColor: isActive ? "#0852C9" : "white",
                whiteSpace: "nowrap", transition: "all 0.15s",
                boxShadow: isActive ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
