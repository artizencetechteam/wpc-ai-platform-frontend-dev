'use server';

import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://37.27.113.235:6767';

// ─── Token helpers ────────────────────────────────────────────────────────────

async function resolveToken(clientToken?: any): Promise<{ accessToken: string; sessionToken: string }> {
  let accessToken = '';
  let sessionToken = '';

  if (clientToken) {
    if (typeof clientToken === 'object') {
      accessToken =
        clientToken.access ??
        clientToken.token ??
        clientToken.access_token ??
        clientToken.key ??
        '';
      sessionToken =
        clientToken.session_token ??
        clientToken.session_id ??
        clientToken.sessionID ??
        '';
    } else if (typeof clientToken === 'string') {
      accessToken = clientToken.replace(/\s+/g, '').replace(/^(Bearer|Token)\s*/i, '');
    }
  }

  const store = await cookies();
  if (!accessToken) {
    const raw = store.get('access-token')?.value ?? store.get('access_token')?.value ?? '';
    accessToken = raw.replace(/\s+/g, '').replace(/^(Bearer|Token)\s*/i, '');
  }
  if (!sessionToken) {
    sessionToken = store.get('session-token')?.value ?? '';
  }

  return { accessToken, sessionToken };
}

function makeHeaders(accessToken: string, sessionToken?: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) h['Authorization'] = `Bearer ${accessToken}`;
  if (sessionToken) h['X-Session-Token'] = sessionToken;
  return h;
}

async function apiFetch(
  url: string,
  options: RequestInit = {},
  clientToken?: string,
): Promise<Response> {
  const { accessToken, sessionToken } = await resolveToken(clientToken);
  const res = await fetch(url, {
    ...options,
    headers: makeHeaders(accessToken, sessionToken),
    cache: 'no-store',
  });
  console.log(`[apiFetch] ${options.method ?? 'GET'} ${url} → ${res.status}`);
  return res;
}

function errMsg(data: any): string {
  if (!data) return 'Unexpected error.';
  if (typeof data === 'string') return data;
  if (data.detail) return String(data.detail);
  if (data.non_field_errors) return data.non_field_errors.join(' ');
  const k = Object.keys(data)[0];
  if (k) return Array.isArray(data[k]) ? `${k}: ${data[k][0]}` : String(data[k]);
  return 'Something went wrong.';
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type HRValidationRecord = {
  id: number;
  User: number;
  created_at?: string;
  status?: string;
  [key: string]: any;
};

export type Employee = {
  id: number;
  employee_full_name: string;
  employment_start_date: string;
  nationality: string;
  HRValidationRecord_id: number;
  rtw_document_url?: string;
  status?: string;
  created_at?: string;
  [key: string]: any;
};

export type AddEmployeePayload = {
  employee_full_name: string;
  employment_start_date: string;
  nationality: string;
  HRValidationRecord_id: number;
  rtw_document_url?: string;
};

type AR<T = null> = { success: boolean; message: string; data?: T };

export type DashboardStats = {
  hrValidation: number;
  postComplianceValidation: number;
  callAgents: number;
  tasksInProcess: number;
};

export type TaskItem = {
  id: string | number;
  type: string;
  dateCreated: string;
  status: string;
  result: string;
  companyName?: string;
  employeeCount?: number;
  employees?: Employee[];
};

// ─── HR Validation Records ────────────────────────────────────────────────────

export async function listHRValidationRecordsAction(
  clientToken?: string,
): Promise<AR<HRValidationRecord[]>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/hr-validation/hr-validation-records/`,
      {},
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    const records = Array.isArray(data) ? data : (data.results ?? []);
    // Debug: log all fields returned by API so we can see what date fields exist
    if (records.length > 0) {
      console.log('[HR record fields available]', Object.keys(records[0]));
      console.log('[HR record #0 full]', JSON.stringify(records[0]));
    }
    return { success: true, message: 'OK', data: records };
  } catch (e) {
    console.error('[listHRValidationRecordsAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function createHRValidationRecordAction(
  userId: number,
  clientToken?: string,
): Promise<AR<HRValidationRecord>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/hr-validation/hr-validation-records/`,
      { method: 'POST', body: JSON.stringify({ User: userId }) },
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Created.', data };
  } catch (e) {
    console.error('[createHRValidationRecordAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

// ─── Employees ────────────────────────────────────────────────────────────────

export async function listEmployeesAction(
  hrValidationRecordId: number,
  clientToken?: string,
): Promise<AR<Employee[]>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/hr-validation/employees/?HRValidationRecord_id=${hrValidationRecordId}`,
      {},
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    const employees = Array.isArray(data) ? data : (data.results ?? []);
    // Debug: log employee fields to find any date field
    if (employees.length > 0) {
      console.log(`[employee fields for record ${hrValidationRecordId}]`, Object.keys(employees[0]));
      console.log(`[employee #0 full]`, JSON.stringify(employees[0]));
    }
    return { success: true, message: 'OK', data: employees };
  } catch (e) {
    console.error('[listEmployeesAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

export async function addEmployeeAction(
  payload: AddEmployeePayload,
  clientToken?: string,
): Promise<AR<Employee>> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/hr-validation/employees/`,
      { method: 'POST', body: JSON.stringify(payload) },
      clientToken,
    );
    const data = await res.json();
    if (!res.ok) return { success: false, message: errMsg(data) };
    return { success: true, message: 'Employee added.', data };
  } catch (e) {
    console.error('[addEmployeeAction]', e);
    return { success: false, message: 'Network error.' };
  }
}

// ─── Format date ──────────────────────────────────────────────────────────────
// Handles both ISO datetime strings and plain YYYY-MM-DD date strings

function formatDate(raw?: string | null): string {
  if (!raw) return '—';
  // Normalise plain YYYY-MM-DD so it parses in every timezone
  const normalised = raw.includes('T') ? raw : `${raw}T00:00:00`;
  const d = new Date(normalised);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Resolve best available date ──────────────────────────────────────────────
// Tries every plausible date field on the record and its employees

function resolveDateCreated(record: HRValidationRecord, employees: Employee[]): string {
  // 1. Try all known date-like keys on the record
  const recordKeys = [
    'created_at', 'createdAt', 'date_created', 'dateCreated',
    'updated_at', 'updatedAt', 'date', 'timestamp', 'time',
  ];
  for (const key of recordKeys) {
    const formatted = formatDate(record[key]);
    if (formatted !== '—') return formatted;
  }

  // 2. Try date fields on employees (created_at, etc.)
  const empDateKeys = ['created_at', 'createdAt', 'date_created', 'dateCreated'];
  const empDates: Date[] = [];
  for (const emp of employees) {
    for (const key of empDateKeys) {
      if (emp[key]) {
        const d = new Date(emp[key]);
        if (!isNaN(d.getTime())) { empDates.push(d); break; }
      }
    }
  }
  if (empDates.length > 0) {
    const latest = empDates.sort((a, b) => b.getTime() - a.getTime())[0];
    return formatDate(latest.toISOString());
  }

  // 3. Last resort: use the latest employment_start_date from employees
  // employment_start_date is always present and is a meaningful date
  const startDates: Date[] = employees
    .map((e) => new Date(
      e.employment_start_date?.includes('T')
        ? e.employment_start_date
        : `${e.employment_start_date}T00:00:00`,
    ))
    .filter((d) => !isNaN(d.getTime()));

  if (startDates.length > 0) {
    const latest = startDates.sort((a, b) => b.getTime() - a.getTime())[0];
    return formatDate(latest.toISOString());
  }

  return '—';
}

// ─── Status → display label ───────────────────────────────────────────────────

function statusToResult(s?: string): string {
  const map: Record<string, string> = {
    pending:     'Pending',
    in_progress: 'In Review',
    approved:    'Approved',
    rejected:    'Rejected',
    completed:   'Completed',
  };
  return map[s?.toLowerCase() ?? ''] ?? 'Pending';
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStatsAction(
  clientToken?: string,
): Promise<AR<DashboardStats>> {
  const res = await listHRValidationRecordsAction(clientToken);
  if (!res.success) return { success: false, message: res.message };
  const records = res.data ?? [];

  // Treat pending, in_progress, missing/null status all as "in process"
  const tasksInProcess = records.filter(
    (r) => !r.status || ['pending', 'in_progress', 'in progress'].includes(r.status.toLowerCase()),
  ).length;

  return {
    success: true,
    message: 'OK',
    data: {
      hrValidation: records.length,
      postComplianceValidation: 0,
      callAgents: 0,
      tasksInProcess,
    },
  };
}

// ─── All Tasks ────────────────────────────────────────────────────────────────

export async function getAllTasksAction(
  page = 1,
  clientToken?: string,
): Promise<AR<{ tasks: TaskItem[]; totalPages: number }>> {
  const res = await listHRValidationRecordsAction(clientToken);
  if (!res.success) return { success: false, message: res.message };

  const records = res.data ?? [];

  const tasks: TaskItem[] = await Promise.all(
    records.map(async (r) => {
      const empRes = await listEmployeesAction(r.id, clientToken);
      const employees = empRes.data ?? [];

      return {
        id: r.id,
        type: 'HR Validation',
        dateCreated: resolveDateCreated(r, employees),
        companyName: r.company_name || r.client_name || r.Company || r.business_name || 'N/A',
        status: r.status ?? 'Pending',
        result: statusToResult(r.status),
        employeeCount: employees.length,
        employees,
      };
    }),
  );

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
  const paginated = tasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return {
    success: true,
    message: 'OK',
    data: { tasks: paginated, totalPages },
  };
}

// ─── Filtered task actions ────────────────────────────────────────────────────

export async function getHRValidationTasksAction(page = 1, clientToken?: string) {
  return getAllTasksAction(page, clientToken);
}

export async function getPostComplianceTasksAction(
  page = 1,
  _clientToken?: string,
): Promise<AR<{ tasks: TaskItem[]; totalPages: number }>> {
  return { success: true, message: 'OK', data: { tasks: [], totalPages: 1 } };
}

export async function getCallAgentsTasksAction(
  page = 1,
  _clientToken?: string,
): Promise<AR<{ tasks: TaskItem[]; totalPages: number }>> {
  return { success: true, message: 'OK', data: { tasks: [], totalPages: 1 } };
}