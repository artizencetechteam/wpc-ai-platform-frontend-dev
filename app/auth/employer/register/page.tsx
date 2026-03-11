'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signupAction } from '../../_action/auth.action';
import toast from 'react-hot-toast';

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormData>();
  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const result = await signupAction({
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'employer',
      });

      if (result.success) {
        toast.success(result.message);
        router.push('/employer/dashboard');
        router.refresh();
      } else {
        toast.error(result.message);
        setIsLoading(false);
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-6 md:p-12">
      <div className="w-full max-w-md md:max-w-lg bg-white rounded-lg shadow-lg p-5 sm:p-6 md:p-8">
        <div className="flex flex-col items-center justify-center mb-4 md:mb-6">
          <Image
            src="/logo/main.png"
            alt="WPC AI Logo"
            width={180}
            height={60}
            className="object-contain h-14 sm:h-16 md:h-20 w-auto"
          />
          <span className='text-[#002B92] font-bold text-sm md:text-base'>WPC AI</span>
        </div>

        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 md:mb-2">Create Account</h2>
          <p className="text-gray-600 text-sm md:text-base">Sign up to get started</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
              Full Name
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                {...register('name', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
                className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

    
          <div>
            <label htmlFor="email" className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                placeholder="Enter email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

         
          <div>
            <label htmlFor="password" className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="..........."
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' }
                })}
                className="w-full pl-9 md:pl-10 pr-11 md:pr-12 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed">
                {showPassword ? <FiEyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <FiEye className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

       
          <div>
            <label htmlFor="confirmPassword" className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="..........."
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                className="w-full pl-9 md:pl-10 pr-11 md:pr-12 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed">
                {showConfirmPassword ? <FiEyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <FiEye className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full bg-[#0852C9] hover:bg-blue-700 text-white font-semibold py-2.5 md:py-3 text-sm md:text-base rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="text-center text-xs md:text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/employer/login" className="text-blue-600 hover:underline font-medium">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;