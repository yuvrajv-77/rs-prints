"use client"

import { useState, useEffect } from "react"
import { useForm } from "@tanstack/react-form"
import BrandLogo from "@/components/BrandLogo"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Toaster, toast } from "@/components/ui/toast"
import {
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react"
import { registerCustomer, loginCustomer } from "@/lib/vendure/mutations/customers"
import { fetchCurrentUser } from "@/stores/auth"

// =========================================================================
// MOCK CREATE-ACCOUNT & EMAIL VERIFICATION SIMULATION
// Set MOCK_EMAIL_EXISTS = true to simulate "Email already registered".
// Set MOCK_EMAIL_EXISTS = false to proceed to Step 2.
// Tip: You can also test by entering an email containing "exists" (e.g. test-exists@gmail.com)
// =========================================================================
export const MOCK_EMAIL_EXISTS = false

export async function mockCheckEmailApi(email: string): Promise<{ exists: boolean }> {
  // Simulate realistic network delay (350ms)
  await new Promise((resolve) => setTimeout(resolve, 350))

  const normalized = email.trim().toLowerCase()
  const isRegistered =
    MOCK_EMAIL_EXISTS ||
    normalized.includes("exists") ||
    normalized === "user@example.com" ||
    normalized === "test@example.com"

  return { exists: isRegistered }
}

interface AuthTabsProps {
  initialTab?: string
}

export default function AuthTabs({ initialTab = "signin" }: AuthTabsProps) {
  const normalizeTab = (val?: string | null) => {
    if (!val) return "signin"
    const lower = val.toLowerCase().trim()
    return lower === "signup" || lower === "sign-up" || lower === "register"
      ? "signup"
      : "signin"
  }

  const [activeTab, setActiveTab] = useState<"signin" | "signup">(() =>
    normalizeTab(initialTab)
  )

  // Sign up step state (1 = Credentials, 2 = Personal details)
  const [signUpStep, setSignUpStep] = useState<1 | 2>(1)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [existingEmailAlert, setExistingEmailAlert] = useState<string | null>(null)

  // Password visibility states
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false)

  // URL query sync & back/forward navigation
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get("tab") || params.get("mode")
      if (tabParam) {
        setActiveTab(normalizeTab(tabParam))
      }
    }

    syncFromUrl()
    window.addEventListener("popstate", syncFromUrl)
    return () => window.removeEventListener("popstate", syncFromUrl)
  }, [])

  const handleTabChange = (tab: "signin" | "signup") => {
    setActiveTab(tab)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("tab", tab)
      if (url.searchParams.has("mode")) {
        url.searchParams.delete("mode")
      }
      window.history.replaceState(null, "", url.toString())
    }
  }

  const getRedirectUrl = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get("redirect") || params.get("redirectTo")
      if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
        return redirect
      }
    }
    return "/products"
  }

  // ==========================================
  // SIGN IN FORM (TanStack Form)
  // ==========================================
  const signInForm = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await loginCustomer({
          username: value.email.trim().toLowerCase(),
          password: value.password,
          rememberMe: true,
        })

        const result = response.login

        if ("id" in result) {
          toast.add({
            title: "Welcome Back!",
            description: "Successfully signed in. Redirecting...",
            type: "success",
          })

          fetchCurrentUser().catch(() => {})

          const destination = getRedirectUrl()
          setTimeout(() => {
            window.location.href = destination
          }, 400)
        } else if ("errorCode" in result) {
          if (result.errorCode === "NOT_VERIFIED_ERROR") {
            toast.add({
              title: "Account Not Verified",
              description:
                result.message ||
                "Please verify your email address before signing in. Check your inbox for the verification email.",
              type: "error",
            })
          } else {
            toast.add({
              title: "Sign In Failed",
              description:
                result.message ||
                "Incorrect email or password. Please verify your credentials and try again.",
              type: "error",
            })
          }
        } else {
          toast.add({
            title: "Sign In Failed",
            description: "Unexpected response from server. Please try again.",
            type: "error",
          })
        }
      } catch (err: unknown) {
        console.error("Sign in error:", err)
        let errorMsg =
          "Failed to connect to the server. Please check your connection and try again."
        if (typeof err === "object" && err !== null && "response" in err) {
          const resp = (err as { response?: { errors?: Array<{ message: string }> } }).response
          if (resp?.errors?.[0]?.message) {
            errorMsg = resp.errors[0].message
          }
        } else if (err instanceof Error) {
          errorMsg = err.message
        }
        toast.add({
          title: "Sign In Error",
          description: errorMsg,
          type: "error",
        })
      }
    },
  })

  // ==========================================
  // SIGN UP FORM (TanStack Form - 2 Step)
  // ==========================================
  const signUpForm = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
      name: "",
      phone: "",
      city: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const trimmedName = value.name.trim()
        const spaceIdx = trimmedName.indexOf(" ")
        const firstName = spaceIdx > -1 ? trimmedName.slice(0, spaceIdx) : trimmedName
        const lastName = spaceIdx > -1 ? trimmedName.slice(spaceIdx + 1).trim() : ""

        const data = await registerCustomer({
          emailAddress: value.email.trim().toLowerCase(),
          password: value.password,
          firstName,
          lastName: lastName || undefined,
          phoneNumber: value.phone?.trim() || undefined,
        })

        const result = data.registerCustomerAccount

        if ("success" in result && result.success) {
          toast.add({
            title: "Account Created!",
            description: `Welcome to RS Prints, ${firstName || value.name}! You can now sign in.`,
            type: "success",
          })

          // Switch to sign in tab and populate email
          signInForm.setFieldValue("email", value.email)
          setSignUpStep(1)
          signUpForm.reset()
          handleTabChange("signin")
        } else if ("errorCode" in result) {
          if (result.errorCode === "EMAIL_ADDRESS_CONFLICT_ERROR") {
            setExistingEmailAlert(value.email)
            setSignUpStep(1)
            toast.add({
              title: "Email Already Registered",
              description:
                result.message ||
                `The email "${value.email}" is already registered. Please sign in instead.`,
              type: "error",
            })
          } else {
            toast.add({
              title: "Sign Up Failed",
              description:
                result.message ||
                "Failed to register account. Please check your details and try again.",
              type: "error",
            })
          }
        } else {
          toast.add({
            title: "Registration Error",
            description: "Unexpected response from server. Please try again.",
            type: "error",
          })
        }
      } catch (err: unknown) {
        console.error("Sign up error:", err)
        let errorMsg =
          "Failed to connect to the server. Please check your connection and try again."
        if (typeof err === "object" && err !== null && "response" in err) {
          const resp = (err as { response?: { errors?: Array<{ message: string }> } }).response
          if (resp?.errors?.[0]?.message) {
            errorMsg = resp.errors[0].message
          }
        } else if (err instanceof Error) {
          errorMsg = err.message
        }
        toast.add({
          title: "Registration Failed",
          description: errorMsg,
          type: "error",
        })
      }
    },
  })

  // Validate Step 1 and verify email availability
  const handleStep1Continue = async () => {
    setExistingEmailAlert(null)

    // Trigger validation for Step 1 fields
    await signUpForm.validateField("email", "change")
    await signUpForm.validateField("password", "change")
    await signUpForm.validateField("confirmPassword", "change")
    await signUpForm.validateField("agreeTerms", "change")

    const email = signUpForm.getFieldValue("email")
    const password = signUpForm.getFieldValue("password")
    const confirmPassword = signUpForm.getFieldValue("confirmPassword")
    const agreeTerms = signUpForm.getFieldValue("agreeTerms")

    const emailMeta = signUpForm.getFieldMeta("email")
    const passwordMeta = signUpForm.getFieldMeta("password")
    const confirmPasswordMeta = signUpForm.getFieldMeta("confirmPassword")
    const agreeTermsMeta = signUpForm.getFieldMeta("agreeTerms")

    const hasErrors =
      (emailMeta?.errors && emailMeta.errors.length > 0) ||
      (passwordMeta?.errors && passwordMeta.errors.length > 0) ||
      (confirmPasswordMeta?.errors && confirmPasswordMeta.errors.length > 0) ||
      (agreeTermsMeta?.errors && agreeTermsMeta.errors.length > 0) ||
      !email ||
      !password ||
      !confirmPassword ||
      !agreeTerms

    if (hasErrors) {
      toast.add({
        title: "Incomplete Step 1",
        description: "Please fix the highlighted errors before continuing.",
        type: "error",
      })
      return
    }

    // Call Mock API to check email availability
    setIsCheckingEmail(true)
    try {
      const result = await mockCheckEmailApi(email)
      setIsCheckingEmail(false)

      if (result.exists) {
        setExistingEmailAlert(email)
        toast.add({
          title: "Email Already Registered",
          description: `The email "${email}" is already in use. Please sign in instead.`,
          type: "error",
        })
      } else {
        // Move to Step 2
        setSignUpStep(2)
      }
    } catch {
      setIsCheckingEmail(false)
      toast.add({
        title: "Verification Error",
        description: "Failed to verify email availability. Please try again.",
        type: "error",
      })
    }
  }

  return (
    <div className="w-full max-w-[400px] mx-auto py-4 sm:py-6">
      {/* Toast Notification Mount */}
      <Toaster />

      {/* Brand Logo on Top */}
      <div className="flex flex-col items-center justify-center text-center mb-6">
        <div className="transition-transform hover:scale-105 duration-200">
          <BrandLogo />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 tracking-wide">
          Your creative space for custom merchandise &amp; prints
        </p>
      </div>

      {/* Tabs Switcher */}
      <div
        className="grid w-full grid-cols-2 bg-muted/80 p-1 rounded-2xl h-10 mb-6 border border-border/40"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "signin"}
          onClick={() => handleTabChange("signin")}
          className={`h-full rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            activeTab === "signin"
              ? "bg-background text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "signup"}
          onClick={() => handleTabChange("signup")}
          className={`h-full rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            activeTab === "signup"
              ? "bg-background text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Social Logins */}
      <div className="space-y-2 mb-5">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            toast.add({
              title: "Google Authentication",
              description: "Connecting to Google OAuth...",
              type: "info",
            })
          }}
          className="w-full h-10 text-xs sm:text-sm font-medium rounded-xl border border-border/80 hover:bg-muted/60 text-foreground transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <svg className="size-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </Button>
      </div>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-[10px] sm:text-[11px] uppercase tracking-wider">
          <span className="bg-background px-2.5 text-muted-foreground">
            or continue with email
          </span>
        </div>
      </div>

      {/* ======================================================= */}
      {/* SIGN IN TAB CONTENT                                     */}
      {/* ======================================================= */}
      {activeTab === "signin" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              signInForm.handleSubmit()
            }}
            className="space-y-3.5"
          >
            {/* Email Field with InputGroup and Icon */}
            <signInForm.Field
              name="email"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return "Email address is required."
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return "Please enter a valid email address (e.g. name@domain.com)."
                  }
                  return undefined
                },
              }}
            >
              {(field) => {
                const error = field.state.meta.isTouched && field.state.meta.errors[0]
                return (
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-xs font-medium text-foreground">
                      Email address
                    </Label>
                    <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                      <InputGroupAddon align="inline-start">
                        <Mail className="size-4 text-muted-foreground" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="signin-email"
                        name={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="name@example.com"
                        autoComplete="email"
                        aria-invalid={!!error}
                        className="text-xs sm:text-sm"
                      />
                    </InputGroup>
                    {error && (
                      <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                        <AlertCircle className="size-3" />
                        <span>{String(error)}</span>
                      </p>
                    )}
                  </div>
                )
              }}
            </signInForm.Field>

            {/* Password Field with InputGroup and Eye toggle */}
            <signInForm.Field
              name="password"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "Password is required."
                  return undefined
                },
              }}
            >
              {(field) => {
                const error = field.state.meta.isTouched && field.state.meta.errors[0]
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="text-xs font-medium text-foreground">
                        Password
                      </Label>
                      <a
                        href="#forgot-password"
                        onClick={(e) => {
                          e.preventDefault()
                          toast.add({
                            title: "Password Reset",
                            description: "Reset instructions have been sent to your email.",
                            type: "info",
                          })
                        }}
                        className="text-[11px] text-primary hover:underline font-normal"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                      <InputGroupAddon align="inline-start">
                        <Lock className="size-4 text-muted-foreground" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="signin-password"
                        name={field.name}
                        type={showSignInPassword ? "text" : "password"}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        aria-invalid={!!error}
                        className="text-xs sm:text-sm"
                      />
                      <InputGroupAddon align="inline-end">
                        <button
                          type="button"
                          onClick={() => setShowSignInPassword(!showSignInPassword)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          aria-label={showSignInPassword ? "Hide password" : "Show password"}
                        >
                          {showSignInPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </InputGroupAddon>
                    </InputGroup>
                    {error && (
                      <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                        <AlertCircle className="size-3" />
                        <span>{String(error)}</span>
                      </p>
                    )}
                  </div>
                )
              }}
            </signInForm.Field>

            <signInForm.Subscribe
              selector={(state) => [state.isSubmitting, state.canSubmit]}
            >
              {([isSubmitting]) => (
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-10 mt-2 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="size-4 text-primary-foreground" />
                      <span>Signing in...</span>
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              )}
            </signInForm.Subscribe>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => handleTabChange("signup")}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* SIGN UP TAB CONTENT (2-Step Process)                    */}
      {/* ======================================================= */}
      {activeTab === "signup" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Step Progress Indicator */}
          <div className="space-y-1.5 pb-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                {signUpStep === 1 ? "Step 1: Account Credentials" : "Step 2: Personal Details"}
              </span>
              <span className="text-muted-foreground font-medium text-[11px]">
                {signUpStep} of 2
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" />
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  signUpStep === 2 ? "bg-primary" : "bg-muted-foreground/20"
                }`}
              />
            </div>
          </div>

          {/* Email Exists Simulation Alert */}
          {existingEmailAlert && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 space-y-2.5 text-left animate-in fade-in duration-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 text-destructive mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">Email already registered</p>
                  <p className="text-muted-foreground mt-0.5">
                    An account with <strong className="font-medium text-foreground underline">{existingEmailAlert}</strong> already exists.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    signInForm.setFieldValue("email", existingEmailAlert)
                    handleTabChange("signin")
                  }}
                  className="w-full h-8 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Sign in with this email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.add({
                      title: "Google Sign In",
                      description: "Redirecting to Google OAuth...",
                      type: "info",
                    })
                  }}
                  className="w-full h-8 text-xs font-medium rounded-xl border-border/80 hover:bg-muted/60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="size-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Sign in with Google instead</span>
                </Button>
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              signUpForm.handleSubmit()
            }}
            className="space-y-3.5"
          >
            {/* ------------------------------------------- */}
            {/* STEP 1: EMAIL & PASSWORD                     */}
            {/* ------------------------------------------- */}
            {signUpStep === 1 && (
              <div className="space-y-3.5">
                {/* Email Field with InputGroup and Mail icon */}
                <signUpForm.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value.trim()) return "Email address is required."
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        return "Please enter a valid email address (e.g. name@domain.com)."
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const error = field.state.meta.isTouched && field.state.meta.errors[0]
                    return (
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-email" className="text-xs font-medium text-foreground">
                          Email address
                        </Label>
                        <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                          <InputGroupAddon align="inline-start">
                            <Mail className="size-4 text-muted-foreground" />
                          </InputGroupAddon>
                          <InputGroupInput
                            id="signup-email"
                            name={field.name}
                            type="email"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => {
                              field.handleChange(e.target.value)
                              if (existingEmailAlert) setExistingEmailAlert(null)
                            }}
                            placeholder="name@example.com"
                            autoComplete="email"
                            aria-invalid={!!error}
                            className="text-xs sm:text-sm"
                          />
                        </InputGroup>
                        {error && (
                          <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                            <AlertCircle className="size-3" />
                            <span>{String(error)}</span>
                          </p>
                        )}
                      </div>
                    )
                  }}
                </signUpForm.Field>

                {/* Create Password Field with InputGroup */}
                <signUpForm.Field
                  name="password"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return "Password is required."
                      if (value.length < 8) return "Password must be at least 8 characters long."
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const error = field.state.meta.isTouched && field.state.meta.errors[0]
                    return (
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-password" className="text-xs font-medium text-foreground">
                          Create Password
                        </Label>
                        <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                          <InputGroupAddon align="inline-start">
                            <Lock className="size-4 text-muted-foreground" />
                          </InputGroupAddon>
                          <InputGroupInput
                            id="signup-password"
                            name={field.name}
                            type={showSignUpPassword ? "text" : "password"}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Min. 8 characters"
                            autoComplete="new-password"
                            aria-invalid={!!error}
                            className="text-xs sm:text-sm"
                          />
                          <InputGroupAddon align="inline-end">
                            <button
                              type="button"
                              onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1"
                              aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                            >
                              {showSignUpPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </InputGroupAddon>
                        </InputGroup>
                        {error && (
                          <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                            <AlertCircle className="size-3" />
                            <span>{String(error)}</span>
                          </p>
                        )}
                      </div>
                    )
                  }}
                </signUpForm.Field>

                {/* Confirm Password Field with InputGroup */}
                <signUpForm.Field
                  name="confirmPassword"
                  validators={{
                    onChangeListenTo: ["password"],
                    onChange: ({ value, fieldApi }) => {
                      if (!value) return "Please confirm your password."
                      const passwordValue = fieldApi.form.getFieldValue("password")
                      if (value !== passwordValue) {
                        return "Passwords do not match. Please re-enter."
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const error = field.state.meta.isTouched && field.state.meta.errors[0]
                    return (
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-confirm-password" className="text-xs font-medium text-foreground">
                          Confirm Password
                        </Label>
                        <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                          <InputGroupAddon align="inline-start">
                            <Lock className="size-4 text-muted-foreground" />
                          </InputGroupAddon>
                          <InputGroupInput
                            id="signup-confirm-password"
                            name={field.name}
                            type={showSignUpConfirmPassword ? "text" : "password"}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Re-enter password"
                            autoComplete="new-password"
                            aria-invalid={!!error}
                            className="text-xs sm:text-sm"
                          />
                          <InputGroupAddon align="inline-end">
                            <button
                              type="button"
                              onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1"
                              aria-label={showSignUpConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showSignUpConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </InputGroupAddon>
                        </InputGroup>
                        {error && (
                          <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                            <AlertCircle className="size-3" />
                            <span>{String(error)}</span>
                          </p>
                        )}
                      </div>
                    )
                  }}
                </signUpForm.Field>

                {/* Terms and Conditions Checkbox */}
                <signUpForm.Field
                  name="agreeTerms"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return "You must agree to the Terms & Conditions to proceed."
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const error = field.state.meta.isTouched && field.state.meta.errors[0]
                    return (
                      <div className="pt-1">
                        <div className="flex items-start gap-2.5">
                          <input
                            id="signup-agree-terms"
                            name={field.name}
                            type="checkbox"
                            checked={field.state.value}
                            onChange={(e) => field.handleChange(e.target.checked)}
                            className="mt-0.5 size-4 rounded cursor-pointer accent-primary border-border text-primary focus:ring-primary/30"
                          />
                          <Label
                            htmlFor="signup-agree-terms"
                            className="text-[11px] sm:text-xs text-muted-foreground leading-snug cursor-pointer select-none font-normal"
                          >
                            I agree to the{" "}
                            <a
                              href="/terms-and-conditions"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-foreground underline hover:text-primary transition-colors font-medium"
                            >
                              Terms &amp; Conditions
                            </a>{" "}
                            and{" "}
                            <a
                              href="/privacy-policy"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-foreground underline hover:text-primary transition-colors font-medium"
                            >
                              Privacy Policy
                            </a>
                          </Label>
                        </div>
                        {error && (
                          <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                            <AlertCircle className="size-3" />
                            <span>{String(error)}</span>
                          </p>
                        )}
                      </div>
                    )
                  }}
                </signUpForm.Field>

                {/* Continue to Step 2 Button */}
                <Button
                  type="button"
                  size="lg"
                  disabled={isCheckingEmail || !signUpForm.getFieldValue("agreeTerms")}
                  onClick={handleStep1Continue}
                  className="w-full h-10 mt-2 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingEmail ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="size-4 text-primary-foreground" />
                      <span>Checking email...</span>
                    </span>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            )}

            {/* ------------------------------------------- */}
            {/* STEP 2: PERSONAL DETAILS                    */}
            {/* ------------------------------------------- */}
            {signUpStep === 2 && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {/* Full Name Field */}
                <signUpForm.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value.trim()) return "Full name is required."
                      if (value.trim().length < 2) return "Name must be at least 2 characters long."
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const error = field.state.meta.isTouched && field.state.meta.errors[0]
                    return (
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-name" className="text-xs font-medium text-foreground">
                          Full Name
                        </Label>
                        <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                          <InputGroupAddon align="inline-start">
                            <User className="size-4 text-muted-foreground" />
                          </InputGroupAddon>
                          <InputGroupInput
                            id="signup-name"
                            name={field.name}
                            type="text"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="John Doe"
                            autoComplete="name"
                            aria-invalid={!!error}
                            className="text-xs sm:text-sm"
                          />
                        </InputGroup>
                        {error && (
                          <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                            <AlertCircle className="size-3" />
                            <span>{String(error)}</span>
                          </p>
                        )}
                      </div>
                    )
                  }}
                </signUpForm.Field>

                {/* Phone Number Field */}
                <signUpForm.Field
                  name="phone"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value.trim()) return "Phone number is required."
                      if (!/^[0-9+-\s()]{7,20}$/.test(value.trim())) {
                        return "Please enter a valid phone number (e.g. +91 98765 43210)."
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const error = field.state.meta.isTouched && field.state.meta.errors[0]
                    return (
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-phone" className="text-xs font-medium text-foreground">
                          Phone Number
                        </Label>
                        <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                          <InputGroupAddon align="inline-start">
                            <Phone className="size-4 text-muted-foreground" />
                          </InputGroupAddon>
                          <InputGroupInput
                            id="signup-phone"
                            name={field.name}
                            type="tel"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="+91 98765 43210"
                            autoComplete="tel"
                            aria-invalid={!!error}
                            className="text-xs sm:text-sm"
                          />
                        </InputGroup>
                        {error && (
                          <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                            <AlertCircle className="size-3" />
                            <span>{String(error)}</span>
                          </p>
                        )}
                      </div>
                    )
                  }}
                </signUpForm.Field>

                {/* City Field */}
                <signUpForm.Field
                  name="city"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value.trim()) return "City is required."
                      if (value.trim().length < 2) return "Please enter a valid city name."
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const error = field.state.meta.isTouched && field.state.meta.errors[0]
                    return (
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-city" className="text-xs font-medium text-foreground">
                          City
                        </Label>
                        <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                          <InputGroupAddon align="inline-start">
                            <MapPin className="size-4 text-muted-foreground" />
                          </InputGroupAddon>
                          <InputGroupInput
                            id="signup-city"
                            name={field.name}
                            type="text"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="e.g. Mumbai, Surat, Delhi"
                            autoComplete="address-level2"
                            aria-invalid={!!error}
                            className="text-xs sm:text-sm"
                          />
                        </InputGroup>
                        {error && (
                          <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                            <AlertCircle className="size-3" />
                            <span>{String(error)}</span>
                          </p>
                        )}
                      </div>
                    )
                  }}
                </signUpForm.Field>

                {/* Navigation and Submit Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setSignUpStep(1)}
                    className="w-1/3 h-10 text-xs sm:text-sm font-medium rounded-xl cursor-pointer"
                  >
                    <ArrowLeft className="size-3.5 mr-1" />
                    <span>Back</span>
                  </Button>

                  <signUpForm.Subscribe
                    selector={(state) => [state.isSubmitting, state.canSubmit]}
                  >
                    {([isSubmitting]) => (
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-2/3 h-10 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer"
                      >
                        {isSubmitting ? (
                          <span className="inline-flex items-center gap-2">
                            <Spinner className="size-4 text-primary-foreground" />
                            <span>Creating account...</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="size-4" />
                            <span>Complete Sign Up</span>
                          </span>
                        )}
                      </Button>
                    )}
                  </signUpForm.Subscribe>
                </div>
              </div>
            )}
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => handleTabChange("signin")}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Security footnote */}
      <p className="text-center text-[11px] text-muted-foreground/80 mt-6">
        Protected by industry-standard encryption.
      </p>
    </div>
  )
}
