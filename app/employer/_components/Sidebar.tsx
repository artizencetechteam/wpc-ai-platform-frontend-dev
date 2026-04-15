'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarCheck,
  UserCheck,
  CreditCard,
  HelpCircle,
  Settings,
  Menu,
  X,
  User2
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const routes = [
    { id: 1, name: 'Dashboard', route: '/employer/dashboard', icon: LayoutDashboard },
    { id: 3, name: 'Post Compliance', route: '/employer/dashboard/post-compliance', icon: Briefcase },
    { id: 2, name: 'HR Validation', route: '/employer/sections/hr-validation', icon: Users },
    { id: 4, name: 'Call Agents', route: '/employer/dashboard/call-agents', icon: CalendarCheck },
    { id: 5, name: 'Staff List', route: '/employer/dashboard/staff-list', icon: CalendarCheck },
    { id: 6, name: 'Records', route: '/employer/dashboard/records', icon: User2 },
    
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#0852C9] text-white p-2 rounded-md"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/45 bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-[#0852C9] w-60 min-h-screen py-6 px-4 text-white font-inter
          md:relative md:translate-x-0
          fixed top-0 left-0 z-40 transition-transform duration-300
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="flex flex-col gap-2 mt-12 md:mt-0">
          {routes.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.route;

            return (
              <Link
                key={item.id}
                href={item.route}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3.25 py-3.5 rounded-[7px] transition text-[16px] font-medium text-[#FFFFFF]
                  ${
                    isActive
                      ? 'bg-[#0C30683D]'
                      : 'hover:bg-[#0c2f682b]'
                  }
                `}
              >
                <Icon size={18} />
                <span className="">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;