'use client'

import { useEffect, useState } from 'react';
import { Users2, Eye, FileText, Phone, CheckCircle, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from "next/link";
import {
  getDashboardStatsAction,
  getAllTasksAction,
  getHRValidationTasksAction,
  getPostComplianceTasksAction,
  getCallAgentsTasksAction,
  type DashboardStats,
  type TaskItem,
} from '@/app/employer/sections/action/action';
import { getClientToken } from '@/lib/getClientToken';





const StatCard = ({
  title, count, badge, badgeColor, loading,
}: {
  title: string; count: number; badge: string; badgeColor: string; loading?: boolean;
}) => (
  <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3 min-w-[140px]">
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-[#6B7280] font-medium">{title}</span>
      <div className="w-9 h-9 rounded-full bg-[#CFE5FE] flex items-center justify-center text-[#0852C9] flex-shrink-0">
        <Users2 size={16} />
      </div>
    </div>
    {loading ? (
      <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
    ) : (
      <p className="text-[28px] font-bold text-[#1D1D1D]">{count}</p>
    )}
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit ${badgeColor}`}>
      {badge}
    </span>
  </div>
);



const ResultBadge = ({ result }: { result: string }) => {
  const colorMap: Record<string, string> = {
    'In Review':  'bg-[#DBEAFE] text-[#1D4ED8]',
    'Approved':   'bg-[#D1FAE5] text-[#065F46]',
    'Rejected':   'bg-[#FEE2E2] text-[#991B1B]',
    'Pending':    'bg-[#FEF3C7] text-[#92400E]',
    'Completed':  'bg-[#D1FAE5] text-[#065F46]',
  };
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${colorMap[result] ?? 'bg-gray-100 text-gray-600'}`}>
      {result}
    </span>
  );
};



const SkeletonRow = () => (
  <tr className="border-b border-gray-50 animate-pulse">
    {[...Array(6)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-3 bg-gray-100 rounded w-24" />
      </td>
    ))}
  </tr>
);



type TabType = 'All' | 'HR Validation' | 'Post Compliance' | 'Call Agents';



export default function EmployerDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    hrValidation: 0,
    postComplianceValidation: 0,
    callAgents: 0,
    tasksInProcess: 0,
  });

  const [activeTab, setActiveTab]   = useState<TabType>('All');
  const [tasks, setTasks]           = useState<TaskItem[]>([]);
  const [taskLoading, setTaskLoading]   = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalPages, setTotalPages]     = useState(1);

  const tabs: TabType[] = ['All', 'HR Validation', 'Post Compliance', 'Call Agents'];

  const recentActivity = [
    { icon: <FileText size={16} className="text-[#0852C9]" />, text: 'HR report ready for download', time: '2 min ago' },
    { icon: <Phone size={16} className="text-[#0852C9]" />, text: 'Call completed with candidate', time: '15 min ago' },
    { icon: <CheckCircle size={16} className="text-[#22C55E]" />, text: 'HR validation approved', time: '2 hours ago' },
    { icon: <ClipboardList size={16} className="text-[#0852C9]" />, text: 'New compliance task assigned', time: '3 hours ago' },
  ];

  useEffect(() => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('access-token='))
    ?.split('=')[1];

  if (!token || token.length < 10) {
    window.location.href = '/welcome';
    return;
  }

  fetchStats();
}, []);

 

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const token = getClientToken();
      const res = await getDashboardStatsAction(token);
      if (!res.success) {
        const isAuthError = res.message?.toLowerCase().includes('token') ||
                            res.message?.toLowerCase().includes('authentication') ||
                            res.message?.toLowerCase().includes('credentials');
        if (isAuthError) {
          router.push('/auth/employer/login');
          return;
        }
        toast.error(res.message || 'Failed to load dashboard stats');
        return;
      }
      if (res.data) setStats(res.data);
    } catch {
      toast.error('Error fetching dashboard stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTasks = async (tab: TabType, page: number) => {
    try {
      setTaskLoading(true);
      const token = getClientToken();

      type TaskFetcher = (page: number, t: string) => ReturnType<typeof getAllTasksAction>;
      const actionMap: Record<TabType, TaskFetcher> = {
        'All':             getAllTasksAction,
        'HR Validation':   getHRValidationTasksAction,
        'Post Compliance': getPostComplianceTasksAction,
        'Call Agents':     getCallAgentsTasksAction,
      };

      const res = await actionMap[tab](page, token);
      if (!res.success) {
        const isAuthError = res.message?.toLowerCase().includes('token') ||
                            res.message?.toLowerCase().includes('authentication') ||
                            res.message?.toLowerCase().includes('credentials');
        if (isAuthError) {
          router.push('/auth/employer/login');
          return;
        }
        toast.error(res.message || 'Failed to load tasks');
        return;
      }
      setTasks(res.data?.tasks ?? []);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch {
      toast.error('Error fetching tasks');
    } finally {
      setTaskLoading(false);
    }
  };



  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchTasks(activeTab, 1);
  }, [activeTab]);

  useEffect(() => {
    if (currentPage !== 1) fetchTasks(activeTab, currentPage);
  }, [currentPage]);

  const goTo = (p: number) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };



  return (
    <div className="bg-[#FDFEFF] p-4 md:p-6 font-inter min-h-screen">

      
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[18px] sm:text-[20px] font-bold text-[#1D1D1D]">Employer Dashboard</h1>
        <button
          onClick={() => { fetchStats(); fetchTasks(activeTab, currentPage); }}
          className="text-[12px] text-[#6B7280] border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
        >
          ↻ Refresh
        </button>
      </div>

    
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard title="HR Validation"             count={stats.hrValidation}             badge="Task Done"    badgeColor="bg-[#D1FAE5] text-[#065F46]" loading={statsLoading} />
        <StatCard title="Post Compliance Validation" count={stats.postComplianceValidation} badge="In Review"    badgeColor="bg-[#DBEAFE] text-[#1D4ED8]" loading={statsLoading} />
        <StatCard title="Call Agents"               count={stats.callAgents}               badge="Active Calls" badgeColor="bg-[#DBEAFE] text-[#1D4ED8]" loading={statsLoading} />
        <StatCard title="Tasks in Process"          count={stats.tasksInProcess}           badge="Under Review" badgeColor="bg-[#DBEAFE] text-[#1D4ED8]" loading={statsLoading} />
      </div>

    
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
        <p className="text-[14px] font-semibold text-[#1D1D1D] w-full sm:w-auto">Quick Action</p>
        <Link href="./components/post-compliance"
          className="bg-[#1A56DB] hover:bg-[#1648C4] text-white text-[12px] sm:text-[13px] font-medium px-3 sm:px-4 py-2 rounded-lg transition inline-block">
          + Post Compliance
        </Link>
        <Link href="./sections/hr-validation"
          className="bg-[#1A56DB] hover:bg-[#1648C4] text-white text-[12px] sm:text-[13px] font-medium px-3 sm:px-4 py-2 rounded-lg transition inline-block">
          + HR Validation
        </Link>
        <Link href="/bulk-upload-hr"
          className="bg-[#1A56DB] hover:bg-[#1648C4] text-white text-[12px] sm:text-[13px] font-medium px-3 sm:px-4 py-2 rounded-lg transition inline-block">
          Bulk Upload (HR)
        </Link>
        <Link href="/bulk-upload-compliance"
          className="bg-[#1A56DB] hover:bg-[#1648C4] text-white text-[12px] sm:text-[13px] font-medium px-3 sm:px-4 py-2 rounded-lg transition inline-block">
          Bulk Upload (Compliance)
        </Link>
      </div>

    
      <div className="flex flex-col lg:flex-row gap-4">

       
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-w-0">

      
          <div className="flex items-center border-b border-gray-100 overflow-x-auto scrollbar-none">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-5 py-3 text-[12px] sm:text-[13px] font-medium whitespace-nowrap transition border-b-2 -mb-px flex-shrink-0 ${
                  activeTab === tab
                    ? 'border-[#1A56DB] text-[#1A56DB] bg-blue-50/40'
                    : 'border-transparent text-[#6B7280] hover:text-[#1D1D1D] hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-[12px] sm:text-[13px] min-w-[520px]">
              <thead>
                <tr className="text-[#6B7280] text-left border-b border-gray-100 bg-gray-50">
                  <th className="px-3 sm:px-4 py-3 font-medium">Task ID</th>
                  <th className="px-3 sm:px-4 py-3 font-medium">Type</th>
                  <th className="px-3 sm:px-4 py-3 font-medium">Date Created</th>
                  <th className="px-3 sm:px-4 py-3 font-medium">Status</th>
                  <th className="px-3 sm:px-4 py-3 font-medium">Result</th>
                  <th className="px-3 sm:px-4 py-3 font-medium">View</th>
                </tr>
              </thead>
              <tbody>
                {taskLoading ? (
                  [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[#9CA3AF] text-[13px]">
                      No tasks found for <span className="font-semibold text-[#6B7280]">{activeTab}</span>
                    </td>
                  </tr>
                ) : (
                  tasks.map((task, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-3 sm:px-4 py-3 text-[#1D1D1D] font-medium">{task.id}</td>
                      <td className="px-3 sm:px-4 py-3 text-[#4B5563]">{task.type}</td>
                      <td className="px-3 sm:px-4 py-3 text-[#4B5563] whitespace-nowrap">{task.dateCreated}</td>
                      <td className="px-3 sm:px-4 py-3 text-[#4B5563]">{task.status}</td>
                      <td className="px-3 sm:px-4 py-3"><ResultBadge result={task.result} /></td>
                      <td className="px-3 sm:px-4 py-3">
                        <button
                          className="text-[#6B7280] hover:text-[#0852C9] transition"
                          onClick={() => router.push(`/employer/sections/hr-validation/${task.id}`)}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

     
        <div className="w-full lg:w-[260px] bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-fit">
          <h2 className="text-[14px] font-semibold text-[#1D1D1D] mb-4">Recent Activity</h2>
          <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 min-w-[200px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
                <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                  {a.icon}
                </div>
                <div>
                  <p className="text-[12px] text-[#1D1D1D] font-medium leading-snug">{a.text}</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 gap-2">
        <button
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 sm:gap-1.5 text-[12px] sm:text-[13px] text-[#4B5563] border border-gray-200 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 flex-shrink-0"
        >
          <ChevronLeft size={14} /> <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5">
          <ChevronLeft size={14} className="text-[#9CA3AF] cursor-pointer" onClick={() => goTo(currentPage - 1)} />
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i + 1)}
              className={`w-8 h-8 rounded-lg text-[13px] font-medium transition ${
                currentPage === i + 1 ? 'bg-[#1A56DB] text-white' : 'text-[#4B5563] hover:bg-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <ChevronRight size={14} className="text-[#9CA3AF] cursor-pointer" onClick={() => goTo(currentPage + 1)} />
        </div>

        <span className="sm:hidden text-[12px] text-[#6B7280]">{currentPage} / {totalPages}</span>

        <button
          onClick={() => router.push('/next')}
          className="flex items-center gap-1 sm:gap-1.5 text-[12px] sm:text-[13px] text-white bg-[#1A56DB] px-3 sm:px-4 py-1.5 rounded-lg hover:bg-[#1648C4] transition flex-shrink-0"
        >
          Continue <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}