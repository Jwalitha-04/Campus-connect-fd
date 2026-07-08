import React from "react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="w-full min-h-screen bg-cork-bg flex items-center justify-center p-4 font-sans select-none">
      
      {/* Postcard/Aged Paper Card */}
      <div className="relative w-full max-w-md p-8 bg-paper-cream border border-paper-border text-chalk-ink shadow-paper-lift dark:shadow-paper-lift-dark transform -rotate-2 rounded-sm text-center">
        
        {/* Red Push-Pin */}
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

        <h1 className="font-display text-2xl font-bold mb-4 mt-2">
          Verify Your Mailbox
        </h1>
        
        <p className="font-sans text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
          We have sent a verification access token to your academic email address. Please click the link inside the mailer to unlock the board.
        </p>

        <div className="font-hand text-xl text-red-600 dark:text-red-400 rotate-[-2deg] my-6">
          "Check your inbox (and spam folder)!"
        </div>

        <div className="border-t border-sky-100 dark:border-amber-900/20 pt-4 flex flex-col space-y-2">
          <Link
            href="/auth/login"
            className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 underline font-sans font-bold uppercase tracking-wider"
          >
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
