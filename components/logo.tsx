import Image from 'next/image';
import React from 'react'

interface LogoProps {
    height?: number;
    width?: number;
    className?: string;
    fontSize?: number | string;
}

const Logo = ( {height , width , className, fontSize} : LogoProps ) => {
  return (
    <div className="flex flex-col items-center justify-center">
        <Image 
            src="/logo/main.png" 
            alt="WPC AI Logo" 
            width={width || 180} 
            height={height || 60}
            className={className || "object-contain h-20 w-auto"}
        />
        <span className='text-[#002B92] font-bold' style={{fontSize : fontSize}}>WPC AI</span>
    </div>
  )
}

export default Logo;