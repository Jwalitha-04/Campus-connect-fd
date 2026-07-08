"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/app/auth/actions";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPassword, null);

  return (
    <div className="w-full min-h-screen bg-cork-bg flex items-center justify-center p-4 font-sans select-none">
      {/* Lined Paper Card */}
      <div className="relative w-full max-w-md p-8 bg-paper-cream border border-paper-border text-chalk-ink shadow-paper-lift dark:shadow-paper-lift-dark transform -rotate-1 transition-transform hover:rotate-0 rounded-sm">
        {/* Absolute Red Push-Pin */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-pin-shadow"
          >
            <path
              d="M12 2C9.23858 2 7 4.23858 7 7C7 9.38268 8.66635 11.3752 10.9 11.884V16.5C10.9 17.0523 11.3477 17.5 11.9 17.5C12.4523 17.5 12.9 17.0523 12.9 16.5V11.884C15.1336 11.3752 16.8 9.38268 16.8 7C16.8 4.23858 14.7614 2 12 2Z"
              fill="var(--pin-red)"
            />
            <circle cx="10.5" cy="5.5" r="1.5" fill="white" opacity="0.4" />
            <rect x="11.5" y="17.5" width="1" height="5.5" rx="0.5" fill="#A0A0A0" />
          </svg>
        </div>

        {/* Card Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold tracking-wide">
            Reset Password
          </h1>
          <p className="font-hand text-lg text-gray-500 mt-1 dark:text-amber-200/50">
            Request a password recovery link
          </p>
        </div>

        {/* Action Form */}
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/30 text-xs rounded-sm">
              ⚠️ {state.error}
            </div>
          )}
          {state?.success && (
            <div className="p-3 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900/30 text-xs rounded-sm">
              ✉️ {state.success}
            </div>
          )}

          {/* Email field */}
          <div className="flex flex-col relative border-b border-sky-200 dark:border-amber-900/30 py-2">
            <span className="font-mono text-[9px] text-sky-400 dark:text-amber-500 uppercase tracking-widest">
              Campus Email
            </span>
            <input
              name="email"
              type="email"
              placeholder="username@campus.edu"
              required
              className="bg-transparent focus:outline-none text-base mt-1 font-sans placeholder-gray-400 dark:placeholder-amber-900/40"
            />
            {/* Lined Margin Left Rule */}
            <div className="absolute left-[-20px] top-0 bottom-0 w-[1px] bg-red-400 opacity-20" />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="ticket-clip w-full flex items-center justify-center min-h-[48px] bg-amber-500 hover:bg-amber-600 text-white font-sans font-bold uppercase tracking-wider text-xs shadow-md transition-all active:translate-y-[2px] cursor-pointer disabled:opacity-50"
          >
            <span>{isPending ? "Sending link..." : "Request Reset Link"}</span>
            <div className="h-6 border-r border-dashed border-amber-300/60 mx-4" />
            <span className="font-mono text-[10px] normal-case opacity-90 tracking-normal">
              No. 0002
            </span>
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-8 text-center text-xs font-sans text-gray-500 border-t border-sky-100 dark:border-amber-900/20 pt-4">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="underline hover:text-amber-500 transition-colors"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
