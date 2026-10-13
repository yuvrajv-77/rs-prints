"use client"

import React, { useState } from "react"
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from "lucide-react"
import { Toaster, toast } from "@/components/ui/toast"

export default function ChangePasswordView() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)

  const hasMinLength = newPassword.length >= 8
  const hasNumber = /\d/.test(newPassword)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      toast.add({ title: "Please enter your current password", type: "error" })
      return
    }

    if (!hasMinLength) {
      toast.add({ title: "New password must be at least 8 characters", type: "error" })
      return
    }

    if (newPassword !== confirmPassword) {
      toast.add({ title: "Passwords do not match", type: "error" })
      return
    }

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setLoading(false)

    toast.add({ title: "Password updated successfully!", type: "success" })
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="w-full">
      <Toaster />

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 mb-6 font-heading sm:font-sans">
        Change Password
      </h2>

      <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 sm:p-10 shadow-xs max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div className="space-y-2">
            <label
              htmlFor="currentPassword"
              className="block text-xs font-bold tracking-wider text-neutral-600 uppercase"
            >
              CURRENT PASSWORD
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label
              htmlFor="newPassword"
              className="block text-xs font-bold tracking-wider text-neutral-600 uppercase"
            >
              NEW PASSWORD
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-bold tracking-wider text-neutral-600 uppercase"
            >
              CONFIRM NEW PASSWORD
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Password Requirements Helper */}
          <div className="rounded-xl bg-neutral-50 p-4 border border-neutral-100 text-xs space-y-1.5">
            <p className="font-semibold text-neutral-700 mb-2">Password Requirements:</p>
            <div className={`flex items-center gap-2 ${hasMinLength ? "text-emerald-600" : "text-neutral-500"}`}>
              <CheckCircle2 className="size-3.5" />
              <span>At least 8 characters long</span>
            </div>
            <div className={`flex items-center gap-2 ${hasNumber ? "text-emerald-600" : "text-neutral-500"}`}>
              <CheckCircle2 className="size-3.5" />
              <span>Includes at least one number</span>
            </div>
            <div className={`flex items-center gap-2 ${passwordsMatch ? "text-emerald-600" : "text-neutral-500"}`}>
              <CheckCircle2 className="size-3.5" />
              <span>Passwords match</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center min-w-[170px] rounded-lg bg-[#f0643b] hover:bg-[#df562f] active:scale-[0.98] px-7 py-3 text-sm font-bold tracking-wider text-white uppercase shadow-xs transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "UPDATING..." : "UPDATE PASSWORD"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
