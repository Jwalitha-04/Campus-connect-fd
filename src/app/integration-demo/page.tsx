"use client";

import React, { useState, useEffect } from "react";
import { apiRequest, ApiError } from "@/lib/api";

interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: string;
  created_at: string;
}

export default function IntegrationDemoPage() {
  // --- Auth Signup State ---
  const [signupForm, setSignupForm] = useState({
    email: "",
    display_name: "",
    department: "",
    graduation_year: "",
    password: "",
  });
  const [authSuccess, setAuthSuccess] = useState(false);
  const [authError, setAuthError] = useState("");

  // --- Marketplace State ---
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState("");

  // Fetch Marketplace Listings on Mount
  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    setListingsLoading(true);
    setListingsError("");
    try {
      const data = await apiRequest<Listing[]>("/marketplace/listings", {
        method: "GET",
      });
      setListings(data);
    } catch (err: any) {
      setListingsError(err.message || "Failed to load listings");
    } finally {
      setListingsLoading(false);
    }
  }

  // Handle Signup Submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess(false);

    try {
      const payload = {
        ...signupForm,
        graduation_year: signupForm.graduation_year
          ? parseInt(signupForm.graduation_year, 10)
          : null,
      };

      await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setAuthSuccess(true);
      setSignupForm({
        email: "",
        display_name: "",
        department: "",
        graduation_year: "",
        password: "",
      });
    } catch (err: any) {
      if (err instanceof ApiError) {
        setAuthError(err.message);
      } else {
        setAuthError("Failed to register. Please check database connection.");
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-cork-bg py-10 px-4 text-chalk-ink font-sans select-none">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header Notice Card */}
        <div className="text-center bg-paper-cream border border-paper-border shadow-paper-lift p-6 rounded-sm max-w-xl mx-auto transform -rotate-1">
          <h1 className="font-display text-3xl font-bold tracking-wide">
            Backend API Integration Portal
          </h1>
          <p className="font-hand text-lg text-chalk-ink/75 mt-2">
            "Testing student validation domain guards and marketplace feeds"
          </p>
        </div>

        {/* Section 1: Sign-Up Form Component */}
        <section className="bg-paper-cream border border-paper-border shadow-paper-lift p-8 rounded-sm transform rotate-0.5 space-y-6 max-w-2xl mx-auto">
          <div>
            <span className="font-mono text-[9px] text-amber-500 uppercase tracking-widest block font-bold">
              Feature 1 — Domain Validation Signup
            </span>
            <h2 className="font-display text-xl font-bold mt-1">Student Registration</h2>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {authSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-mono font-bold">
                🎉 Registration successful! Academic domain validated.
              </div>
            )}
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-mono">
                ⚠️ Error: {authError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block font-mono text-[10px] text-gray-500 uppercase">
                Academic Email (Whitelisted Domain only)
              </label>
              <input
                type="email"
                required
                placeholder="name@campus.edu or name@university.edu.in"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                className="w-full p-2 border border-gray-200 focus:outline-none focus:border-amber-500 text-sm font-mono bg-white/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-mono text-[10px] text-gray-500 uppercase">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Sumanth Murari"
                  value={signupForm.display_name}
                  onChange={(e) => setSignupForm({ ...signupForm, display_name: e.target.value })}
                  className="w-full p-2 border border-gray-200 focus:outline-none focus:border-amber-500 text-sm bg-white/50"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[10px] text-gray-500 uppercase">
                  Department
                </label>
                <input
                  type="text"
                  required
                  placeholder="Computer Science"
                  value={signupForm.department}
                  onChange={(e) => setSignupForm({ ...signupForm, department: e.target.value })}
                  className="w-full p-2 border border-gray-200 focus:outline-none focus:border-amber-500 text-sm bg-white/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-mono text-[10px] text-gray-500 uppercase">
                  Graduation Year (Optional)
                </label>
                <input
                  type="number"
                  placeholder="2026"
                  value={signupForm.graduation_year}
                  onChange={(e) => setSignupForm({ ...signupForm, graduation_year: e.target.value })}
                  className="w-full p-2 border border-gray-200 focus:outline-none focus:border-amber-500 text-sm font-mono bg-white/50"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[10px] text-gray-500 uppercase">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  className="w-full p-2 border border-gray-200 focus:outline-none focus:border-amber-500 text-sm bg-white/50"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:translate-y-[1px] transition-all text-white font-sans text-xs uppercase font-bold tracking-wider rounded-sm shadow-sm cursor-pointer"
            >
              Submit Validation Signup
            </button>
          </form>
        </section>

        {/* Section 2: Marketplace Listings Display */}
        <section className="bg-paper-cream border border-paper-border shadow-paper-lift p-8 rounded-sm transform rotate-0.5 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-mono text-[9px] text-amber-500 uppercase tracking-widest block font-bold">
                Feature 2 — Live Marketplace Board
              </span>
              <h2 className="font-display text-xl font-bold mt-1">Active Item Listings</h2>
            </div>
            <button
              onClick={fetchListings}
              className="px-3 py-1 border border-amber-500 text-amber-600 hover:bg-amber-50 active:translate-y-[0.5px] transition-all font-mono text-[10px] uppercase font-bold cursor-pointer"
            >
              Sync Listings
            </button>
          </div>

          {listingsLoading ? (
            <div className="text-center py-10 font-hand text-lg text-gray-500">
              Loading notice board posts...
            </div>
          ) : listingsError ? (
            <div className="p-4 border border-dashed border-red-200 bg-red-50 text-red-600 text-xs font-mono text-center">
              ⚠️ Failed to fetch listings: {listingsError}. (Make sure your FastAPI server is running!)
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 bg-white/20">
              <span className="font-hand text-lg text-gray-400 italic">
                No active listings published on the board.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((item) => (
                <div
                  key={item.id}
                  className="p-5 bg-white border border-gray-200 shadow-sm relative hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  {/* Pin Circle Overlay */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-sm" />
                  
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[9px] font-bold text-amber-600 uppercase px-1.5 py-0.5 bg-amber-50 border border-amber-200">
                        {item.category}
                      </span>
                      <span className="font-mono text-xs font-bold text-gray-700">
                        ₹{item.price}
                      </span>
                    </div>
                    
                    <h3 className="font-display font-bold text-sm tracking-wide text-gray-900 leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-normal line-clamp-3 font-sans">
                      {item.description}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between items-center text-[9px] font-mono text-gray-400">
                    <span>ID: #{item.id.slice(0, 8)}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
