"use client"

import React, { useState } from "react"
import { MapPin, Plus, Home, Briefcase, Trash2, Edit2, CheckCircle2 } from "lucide-react"

interface Address {
  id: string
  fullName: string
  phoneNumber: string
  streetLine1: string
  streetLine2?: string
  city: string
  state: string
  postalCode: string
  type: "home" | "work"
  isDefault: boolean
}

const INITIAL_ADDRESSES: Address[] = [
  {
    id: "addr-1",
    fullName: "Yuvraj Verma",
    phoneNumber: "+91 98765 43210",
    streetLine1: "Flat 402, Sunshine Residency",
    streetLine2: "Sector 14, Near City Center Mall",
    city: "Jaipur",
    state: "Rajasthan",
    postalCode: "302001",
    type: "home",
    isDefault: true,
  },
  {
    id: "addr-2",
    fullName: "Yuvraj Verma (Office)",
    phoneNumber: "+91 98765 43210",
    streetLine1: "Tower B, 5th Floor, Cyber Park",
    city: "Jaipur",
    state: "Rajasthan",
    postalCode: "302020",
    type: "work",
    isDefault: false,
  },
]

export default function AddressesView() {
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES)
  const [isAdding, setIsAdding] = useState(false)
  const [newFullName, setNewFullName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newStreet1, setNewStreet1] = useState("")
  const [newCity, setNewCity] = useState("")
  const [newState, setNewState] = useState("")
  const [newPostalCode, setNewPostalCode] = useState("")
  const [newType, setNewType] = useState<"home" | "work">("home")

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    )
  }

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((addr) => addr.id !== id))
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFullName || !newStreet1 || !newCity || !newPostalCode) return

    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      fullName: newFullName,
      phoneNumber: newPhone,
      streetLine1: newStreet1,
      city: newCity,
      state: newState || "Rajasthan",
      postalCode: newPostalCode,
      type: newType,
      isDefault: addresses.length === 0,
    }

    setAddresses([newAddr, ...addresses])
    setIsAdding(false)
    setNewFullName("")
    setNewPhone("")
    setNewStreet1("")
    setNewCity("")
    setNewPostalCode("")
  }

  return (
    <div className="w-full">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-heading sm:font-sans">
            Address Book
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage your delivery and billing addresses for fast checkout.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f0643b] hover:bg-[#df562f] text-white text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="size-4" />
            Add New Address
          </button>
        )}
      </div>

      {/* Add New Address Form Modal/Panel */}
      {isAdding && (
        <div className="mb-6 rounded-2xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <h3 className="text-base font-bold text-neutral-900 mb-4">Add New Delivery Address</h3>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Yuvraj Verma"
                  className="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                Street Address / Flat / Building
              </label>
              <input
                type="text"
                value={newStreet1}
                onChange={(e) => setNewStreet1(e.target.value)}
                placeholder="House No., Street Name, Area"
                className="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                  City
                </label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="e.g. Jaipur"
                  className="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                  State
                </label>
                <input
                  type="text"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  placeholder="e.g. Rajasthan"
                  className="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={newPostalCode}
                  onChange={(e) => setNewPostalCode(e.target.value)}
                  placeholder="e.g. 302001"
                  className="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Address Type */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Type:</span>
              <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={newType === "home"}
                  onChange={() => setNewType("home")}
                />
                Home
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  checked={newType === "work"}
                  onChange={() => setNewType("work")}
                />
                Work / Office
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-[#f0643b] hover:bg-[#df562f] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Save Address
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2.5 rounded-lg border border-neutral-200 text-neutral-600 text-xs font-medium hover:bg-neutral-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((address) => (
          <div
            key={address.id}
            className={`rounded-2xl border bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all ${
              address.isDefault ? "border-neutral-900/80 ring-1 ring-neutral-900/10" : "border-neutral-200/80"
            }`}
          >
            <div>
              {/* Card Header: Type Badge & Default Status */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700">
                    {address.type === "home" ? (
                      <Home className="size-3" />
                    ) : (
                      <Briefcase className="size-3" />
                    )}
                    {address.type}
                  </span>
                  {address.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="size-3" />
                      Default
                    </span>
                  )}
                </div>
              </div>

              {/* Recipient Details */}
              <h4 className="text-sm font-bold text-neutral-900 mb-1">{address.fullName}</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {address.streetLine1}
                {address.streetLine2 ? `, ${address.streetLine2}` : ""}
                <br />
                {address.city}, {address.state} - {address.postalCode}
              </p>
              <p className="text-xs font-medium text-neutral-500 mt-2">
                Phone: <span className="text-neutral-800">{address.phoneNumber}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 border-t border-neutral-100 pt-4 mt-4 text-xs">
              <div>
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="text-neutral-600 hover:text-neutral-900 font-medium underline-offset-4 hover:underline cursor-pointer"
                  >
                    Set as default
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDelete(address.id)}
                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                  title="Delete address"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
