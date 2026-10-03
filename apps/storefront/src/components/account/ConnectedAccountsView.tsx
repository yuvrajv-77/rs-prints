"use client"

import React, { useState } from "react"
import { Share2, CheckCircle2, ShieldCheck } from "lucide-react"

interface SocialAccount {
  id: string
  name: string
  provider: "google" | "facebook" | "apple"
  connected: boolean
  accountEmail?: string
}

export default function ConnectedAccountsView() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    {
      id: "google",
      name: "Google",
      provider: "google",
      connected: true,
      accountEmail: "yv7039@gmail.com",
    },
    {
      id: "facebook",
      name: "Facebook",
      provider: "facebook",
      connected: false,
    },
    {
      id: "apple",
      name: "Apple ID",
      provider: "apple",
      connected: false,
    },
  ])

  const toggleConnect = (id: string) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === id
          ? {
              ...acc,
              connected: !acc.connected,
              accountEmail: !acc.connected ? "connected.user@example.com" : undefined,
            }
          : acc
      )
    )
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-heading sm:font-sans">
          Connected Accounts
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Connect third-party accounts for faster one-click sign in.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-xs divide-y divide-neutral-100 max-w-2xl">
        {accounts.map((acc) => (
          <div key={acc.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div>
              <h4 className="text-sm font-semibold text-neutral-900">{acc.name}</h4>
              {acc.connected ? (
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span>Connected as {acc.accountEmail}</span>
                </div>
              ) : (
                <p className="text-xs text-neutral-400 mt-0.5">Not connected</p>
              )}
            </div>

            <button
              onClick={() => toggleConnect(acc.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                acc.connected
                  ? "border border-neutral-200 text-neutral-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  : "bg-neutral-900 text-white hover:bg-neutral-800"
              }`}
            >
              {acc.connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
