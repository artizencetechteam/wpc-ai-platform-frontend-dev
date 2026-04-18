'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import Link from 'next/link';
import { FiMail } from 'react-icons/fi';
import { forgotPasswordAction } from '../../_action/auth.action';

type ForgotPasswordFormData = {
  email: string;
};

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (formData: ForgotPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await forgotPasswordAction({ email: formData.email });

      if (result.success) {
        setSuccessMessage(result.message);
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage('Unable to process request right now. Please try again.');
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
          <span className="text-[#002B92] font-bold text-sm md:text-base">WPC AI</span>
        </div>

        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 md:mb-2">
            Forgot Password
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            Enter your email and we will send password reset instructions.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-3 md:mb-4 p-2.5 md:p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-xs md:text-sm">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-3 md:mb-4 p-2.5 md:p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-xs md:text-sm">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2"
            >
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
                    message: 'Invalid email address',
                  },
                })}
                className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0852C9] hover:bg-blue-700 text-white font-semibold py-2.5 md:py-3 text-sm md:text-base rounded-lg transition duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="text-center text-xs md:text-sm text-gray-600">
            Remembered your password?{' '}
            <Link href="/auth/employer/login" className="text-blue-600 hover:underline font-medium">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
