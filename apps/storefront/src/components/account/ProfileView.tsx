"use client"

import React, { useState, useEffect } from "react"
import { useStore } from "@nanostores/react"
import { useForm } from "@tanstack/react-form"
import { $currentUser, fetchCurrentUser } from "@/stores/auth"
import { updateCustomerProfile } from "@/lib/vendure/mutations/customers"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSet,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Toaster, toast } from "@/components/ui/toast"
import { User, Mail, Check } from "lucide-react"

export default function ProfileView() {
  const { customer, initialized } = useStore($currentUser)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Fetch current user if not yet initialized
  useEffect(() => {
    if (!initialized) {
      fetchCurrentUser()
    }
  }, [initialized])

  // Parse phone and names from customer
  const initialFirstName = customer?.firstName || ""
  const initialLastName = customer?.lastName || ""
  const initialEmail = customer?.emailAddress || ""
  const initialPhone = customer?.phoneNumber
    ? customer.phoneNumber.startsWith("+91")
      ? customer.phoneNumber.replace("+91", "").trim()
      : customer.phoneNumber
    : ""

  const form = useForm({
    defaultValues: {
      firstName: initialFirstName,
      lastName: initialLastName,
      email: initialEmail,
      phoneNumber: initialPhone,
    },
    onSubmit: async ({ value }) => {
      setIsSaving(true)
      try {
        const formattedPhone = value.phoneNumber.trim()
          ? value.phoneNumber.trim().startsWith("+")
            ? value.phoneNumber.trim()
            : `+91 ${value.phoneNumber.trim()}`
          : undefined

        const res = await updateCustomerProfile({
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim() || undefined,
          phoneNumber: formattedPhone,
        })

        if (res?.updateCustomer) {
          await fetchCurrentUser()
          toast.add({
            title: "Profile Updated",
            description: "Your account details have been successfully saved.",
            type: "success",
          })
          setIsSaved(true)
          setTimeout(() => setIsSaved(false), 3000)
        } else {
          toast.add({
            title: "Update Notice",
            description: "Profile updated, but changes could not be refreshed immediately.",
            type: "info",
          })
        }
      } catch (err: unknown) {
        console.error("Failed to update profile:", err)
        toast.add({
          title: "Update Failed",
          description:
            err instanceof Error
              ? err.message
              : "Failed to update profile. Please check your network and try again.",
          type: "error",
        })
      } finally {
        setIsSaving(false)
      }
    },
  })

  // Synchronize form when customer data loads or changes
  useEffect(() => {
    if (customer) {
      let rawPhone = customer.phoneNumber || ""
      if (rawPhone.startsWith("+91")) {
        rawPhone = rawPhone.replace("+91", "").trim()
      }

      let fName = customer.firstName || ""
      let lName = customer.lastName || ""
      if (!lName && fName.includes(" ")) {
        const parts = fName.split(" ")
        fName = parts[0]
        lName = parts.slice(1).join(" ")
      }

      form.setFieldValue("firstName", fName)
      form.setFieldValue("lastName", lName)
      form.setFieldValue("email", customer.emailAddress || "")
      form.setFieldValue("phoneNumber", rawPhone)
    }
  }, [customer, form])

  return (
    <div className="w-full">
      <Toaster />

      {/* Section Heading */}
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-6 font-heading">
        Profile Settings
      </h2>

      {/* Profile Form Card using proper UI Card component */}
      <Card className="max-w-2xl border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg font-bold text-foreground">
            Personal Information
          </CardTitle>
          <CardDescription>
            Manage your personal profile, email, and primary contact phone number.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-6"
          >
            <FieldSet>
              <FieldGroup className="space-y-1">
                {/* Name Fields: First Name and Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name Field */}
                  <form.Field
                    name="firstName"
                    validators={{
                      onChange: ({ value }) =>
                        !value.trim() ? "First name is required." : undefined,
                    }}
                  >
                    {(field) => {
                      const error =
                        field.state.meta.isTouched &&
                        field.state.meta.errors[0]
                      return (
                        <Field data-invalid={!!error}>
                          <FieldLabel
                            htmlFor={field.name}
                            className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                          >
                            First Name <span className="text-destructive">*</span>
                          </FieldLabel>
                          <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                            <InputGroupAddon align="inline-start">
                              <User className="size-4 text-muted-foreground" />
                            </InputGroupAddon>
                            <InputGroupInput
                              id={field.name}
                              name={field.name}
                              type="text"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              placeholder="Enter first name"
                              aria-invalid={!!error}
                              className="text-xs sm:text-sm"
                            />
                          </InputGroup>
                          {error && <FieldError>{error}</FieldError>}
                        </Field>
                      )
                    }}
                  </form.Field>

                  {/* Last Name Field */}
                  <form.Field name="lastName">
                    {(field) => {
                      const error =
                        field.state.meta.isTouched &&
                        field.state.meta.errors[0]
                      return (
                        <Field data-invalid={!!error}>
                          <FieldLabel
                            htmlFor={field.name}
                            className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                          >
                            Last Name
                          </FieldLabel>
                          <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                            <InputGroupAddon align="inline-start">
                              <User className="size-4 text-muted-foreground" />
                            </InputGroupAddon>
                            <InputGroupInput
                              id={field.name}
                              name={field.name}
                              type="text"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              placeholder="Enter last name"
                              aria-invalid={!!error}
                              className="text-xs sm:text-sm"
                            />
                          </InputGroup>
                          {error && <FieldError>{error}</FieldError>}
                        </Field>
                      )
                    }}
                  </form.Field>
                </div>

                {/* Email Field */}
                <form.Field name="email">
                  {(field) => (
                    <Field>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                      >
                        Email Address
                      </FieldLabel>
                      <InputGroup className="h-10 rounded-xl bg-input/30 border border-border/60">
                        <InputGroupAddon align="inline-start">
                          <Mail className="size-4 text-muted-foreground" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          disabled
                          aria-readonly="true"
                          className="text-xs sm:text-sm cursor-not-allowed opacity-75"
                        />
                      </InputGroup>
                      <FieldDescription className="text-xs text-muted-foreground">
                        Your email is linked to your login credentials and verified account.
                      </FieldDescription>
                    </Field>
                  )}
                </form.Field>

                {/* Contact No Field */}
                <form.Field
                  name="phoneNumber"
                  validators={{
                    onChange: ({ value }) => {
                      if (value && !/^[0-9\s-]{7,15}$/.test(value)) {
                        return "Please enter a valid phone number (digits only)."
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const error =
                      field.state.meta.isTouched &&
                      field.state.meta.errors[0]
                    return (
                      <Field data-invalid={!!error}>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        >
                          Contact No
                        </FieldLabel>
                        <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                          <InputGroupAddon
                            align="inline-start"
                            className="px-3 border-r border-border/60 bg-muted/20"
                          >
                            <span className="text-xs font-semibold text-muted-foreground select-none">
                              +91
                            </span>
                          </InputGroupAddon>
                          <InputGroupInput
                            id={field.name}
                            name={field.name}
                            type="tel"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) =>
                              field.handleChange(e.target.value)
                            }
                            placeholder="Enter 10-digit number"
                            aria-invalid={!!error}
                            className="text-xs sm:text-sm pl-3"
                          />
                        </InputGroup>
                        {error ? (
                          <FieldError>{error}</FieldError>
                        ) : (
                          <FieldDescription className="text-xs text-muted-foreground">
                            Used for delivery tracking SMS and order notifications.
                          </FieldDescription>
                        )}
                      </Field>
                    )
                  }}
                </form.Field>
              </FieldGroup>
            </FieldSet>

            {/* Save Button */}
            <div className="pt-2 flex items-center gap-3">
              <Button
                type="submit"
                size="lg"
                disabled={isSaving}
                className="min-w-[140px] h-11 text-xs font-bold tracking-wider rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2 uppercase cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Spinner className="size-4" />
                    <span>Saving...</span>
                  </>
                ) : isSaved ? (
                  <>
                    <Check className="size-4" />
                    <span>Saved</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
