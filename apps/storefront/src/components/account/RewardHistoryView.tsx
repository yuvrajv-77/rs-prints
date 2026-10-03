"use client"

import React from "react"
import { Award, Coins, ArrowUpRight, ArrowDownLeft, Gift } from "lucide-react"

interface RewardTransaction {
  id: string
  title: string
  date: string
  points: number
  type: "earned" | "spent"
}

const TRANSACTIONS: RewardTransaction[] = [
  {
    id: "tx-1",
    title: "Order Purchase #RSP-2026-8912",
    date: "Sep 18, 2026",
    points: 150,
    type: "earned",
  },
  {
    id: "tx-2",
    title: "Redeemed for ₹100 Checkout Discount",
    date: "Sep 10, 2026",
    points: 100,
    type: "spent",
  },
  {
    id: "tx-3",
    title: "Welcome Bonus on Sign Up",
    date: "Aug 20, 2026",
    points: 200,
    type: "earned",
  },
]

export default function RewardHistoryView() {
  const currentBalance = 250

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-heading sm:font-sans">
          Reward History
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Track earned RS Coins, redeem points for discounts, and unlock rewards.
        </p>
      </div>

      {/* Rewards Balance Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-6 shadow-xs">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Coins className="size-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Available Points</span>
          </div>
          <div className="text-3xl font-extrabold text-neutral-900 font-sans">
            {currentBalance} <span className="text-sm font-semibold text-neutral-500">Coins</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">Worth ₹{currentBalance} in checkout discounts</p>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-neutral-600 mb-2">
              <Award className="size-5 text-[#f0643b]" />
              <span className="text-xs font-bold uppercase tracking-wider">Membership Tier</span>
            </div>
            <div className="text-xl font-bold text-neutral-900">Silver Member</div>
            <p className="text-xs text-neutral-500 mt-1">Earn 5% points back on every order</p>
          </div>
        </div>
      </div>

      {/* History Ledger */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-neutral-900 mb-4">Transaction History</h3>
        <div className="divide-y divide-neutral-100">
          {TRANSACTIONS.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div
                  className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === "earned"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {tx.type === "earned" ? (
                    <ArrowDownLeft className="size-4" />
                  ) : (
                    <ArrowUpRight className="size-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-neutral-900">{tx.title}</h4>
                  <span className="text-[11px] text-neutral-400">{tx.date}</span>
                </div>
              </div>

              <div
                className={`text-sm font-bold shrink-0 ${
                  tx.type === "earned" ? "text-emerald-600" : "text-neutral-700"
                }`}
              >
                {tx.type === "earned" ? `+${tx.points}` : `-${tx.points}`} pts
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
