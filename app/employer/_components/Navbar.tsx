'use client'
import Logo from '@/components/logo';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaTrashAlt } from 'react-icons/fa';

const Navbar = () => {
  const router = useRouter();
  const [role,setRole] = useState<string | null>("");
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  
  const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

const handleLogout = () => {
  deleteCookie('access-token');
  deleteCookie('refresh-token');
  deleteCookie('user-info');
  router.push('/welcome');
};

useEffect(() => {
  const user = getCookie("user-info");
  console.log(user); 
  
  if (user) {
    const parsedUser = JSON.parse(user); // Parse the JSON string
    setRole(parsedUser.role);
    console.log("Role: ", parsedUser.role);
  }
}, [])

  return (
    <nav className="flex items-center justify-start p-2 px-4 bg-white border-b border-[#E5E7EB]">
      {/* Logo section - hidden on mobile, visible on md and up */}
      <div onClick={() => router.push('/')} className="hidden md:flex w-60 items-center space-x-2 cursor-pointer">
        <Logo className='object-contain h-10 w-auto' fontSize={15} />
      </div>

      {/* Main content - full width on mobile, normal width on md and up */}
      <div className="w-full flex items-center justify-between gap-4 md:pl-5 pl-14">
        
        
        <div className="flex items-center gap-3 ml-305 relative">
          
          
          <img 
            src="/man.jpg" 
            alt="User profile" 
            width="30" 
            height="30" 
            className="rounded-full w-[50px] h-[50px] object-cover border-2 border-[#E5E7EB] cursor-pointer"
            onClick={() => setShowLogoutPopup(!showLogoutPopup)}
          />

          {showLogoutPopup && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-50">
              <button 
                onClick={handleLogout}
                className="px-4 py-2 hover:bg-[#F3F4F6] text-[#000000] w-full text-left whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar;