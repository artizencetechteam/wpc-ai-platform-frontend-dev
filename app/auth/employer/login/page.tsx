'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import Link from 'next/link';
import { loginAction } from '../../_action/auth.action';

type LoginFormData = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (formData: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await loginAction({
        email: formData.email,
        password: formData.password,
      });
      console.log("LOGIN RESULT:", result);


      if (result.success) {
        window.location.href = '/employer/dashboard';
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 md:mb-2">Welcome Back</h2>
          <p className="text-gray-600 text-sm md:text-base">Sign in to your account</p>
        </div>

        {errorMessage && (
          <div className="mb-3 md:mb-4 p-2.5 md:p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-xs md:text-sm">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
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
                disabled={isLoading}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={isLoading}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                className="w-full pl-9 md:pl-10 pr-11 md:pr-12 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed">
                {showPassword ? <FiEyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <FiEye className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full bg-[#0852C9] hover:bg-blue-700 text-white font-semibold py-2.5 md:py-3 text-sm md:text-base rounded-lg transition duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center">
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : 'Secure Login'}
          </button>

          <div className="flex items-center justify-end text-xs md:text-sm">
            <Link href="/auth/employer/forgot-password" className="text-blue-600 hover:underline font-medium">
              Forgot Password?
            </Link>
          </div>

          <div className="text-center text-xs md:text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/employer/register" className="text-blue-600 hover:underline font-medium">
              Create Account
            </Link>

          </div>
        </form>

      </div>
    </div>
  );
};

export default LoginPage;