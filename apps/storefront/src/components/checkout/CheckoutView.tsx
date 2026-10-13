"use client";

import React, { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { $cart, fetchActiveOrder, clearCartState } from "@/stores/cart";
import { $currentUser, fetchCurrentUser } from "@/stores/auth";
import {
  getEligibleShippingMethods,
  getEligiblePaymentMethods,
  type ActiveOrder,
} from "@/lib/vendure/queries/orders";
import {
  setCustomerForOrder,
  setOrderShippingAddress,
  setOrderShippingMethod,
  transitionOrderToState,
  createRazorpayOrder,
  addPaymentToOrder,
} from "@/lib/vendure/mutations/orders";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ShieldCheck,
  CreditCard,
  Truck,
  Lock,
  User,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Banknote,
  ShoppingBag,
  Zap,
} from "lucide-react";

interface ShippingQuote {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  priceWithTax: number;
}

interface PaymentQuote {
  id: string;
  code: string;
  name: string;
  description: string;
  isEligible: boolean;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi NCR",
];

function formatRupees(amountInPaise?: number | null): string {
  if (typeof amountInPaise !== "number") return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amountInPaise / 100));
}

export default function CheckoutView() {
  const cartState = useStore($cart);
  const authState = useStore($currentUser);
  const order = cartState.order;
  const lines = order?.lines ?? [];

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [streetLine1, setStreetLine1] = useState("");
  const [streetLine2, setStreetLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("Maharashtra");
  const [postalCode, setPostalCode] = useState("");

  // Shipping & Payment Options
  const [shippingMethods, setShippingMethods] = useState<ShippingQuote[]>([]);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentQuote[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"razorpay" | "cash-on-delivery">("razorpay");

  // Status State
  const [isMethodsLoading, setIsMethodsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Initial hydration of cart & auth
  useEffect(() => {
    fetchActiveOrder();
    fetchCurrentUser();
  }, []);

  // 2. Prefill customer data if user is logged in or if order already has customer info
  useEffect(() => {
    const cust = authState.customer || order?.customer;
    if (cust) {
      if (!firstName && cust.firstName) setFirstName(cust.firstName);
      if (!lastName && cust.lastName) setLastName(cust.lastName);
      if (!email && cust.emailAddress) setEmail(cust.emailAddress);
      if (!phone && cust.phoneNumber) setPhone(cust.phoneNumber);
    }
  }, [authState.customer, order?.customer]);

  // 3. Load eligible shipping and payment methods
  useEffect(() => {
    async function loadMethods() {
      setIsMethodsLoading(true);
      try {
        const [shipping, payment] = await Promise.all([
          getEligibleShippingMethods(),
          getEligiblePaymentMethods(),
        ]);

        if (shipping && shipping.length > 0) {
          setShippingMethods(shipping as ShippingQuote[]);
          setSelectedShippingMethodId(shipping[0].id);
        }

        if (payment && payment.length > 0) {
          setPaymentMethods(payment as PaymentQuote[]);
        }
      } catch (err) {
        console.error("Failed to load checkout options:", err);
      } finally {
        setIsMethodsLoading(false);
      }
    }

    loadMethods();
  }, []);

  // When order shipping updates, recompute shipping quote
  const selectedShipping = shippingMethods.find((s) => s.id === selectedShippingMethodId);
  const estimatedShippingCost = selectedShipping ? selectedShipping.priceWithTax : (order?.shippingWithTax ?? 0);
  const currentSubtotal = order?.subTotalWithTax ?? 0;
  const totalDiscounts = order?.discounts?.reduce((acc, d) => acc + (d.amountWithTax || 0), 0) ?? 0;
  const estimatedGrandTotal = Math.max(0, currentSubtotal - totalDiscounts + estimatedShippingCost);

  // Handle Form Submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Please enter your full first and last name.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("Please provide a valid email address for your order confirmation.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number for delivery updates.");
      return;
    }
    if (!streetLine1.trim()) {
      setErrorMessage("Please provide your street or flat address.");
      return;
    }
    if (!city.trim()) {
      setErrorMessage("Please specify your delivery city.");
      return;
    }
    const cleanPin = postalCode.replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit Indian PIN code.");
      return;
    }
    if (!selectedShippingMethodId && shippingMethods.length > 0) {
      setErrorMessage("Please choose a delivery method.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Set Customer details
      // Only required for guest checkouts. When already logged in, Vendure has already linked
      // the authenticated Customer to this active order.
      const isAlreadyLoggedIn = Boolean(authState.customer || order?.customer);
      if (!isAlreadyLoggedIn) {
        const customerRes = await setCustomerForOrder({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          emailAddress: email.trim(),
          phoneNumber: cleanPhone,
        });

        if (customerRes.error) {
          throw new Error(customerRes.error);
        }
      }

      // Step 2: Set Shipping Address
      const addressRes = await setOrderShippingAddress({
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        streetLine1: streetLine1.trim(),
        streetLine2: streetLine2.trim() || undefined,
        city: city.trim(),
        province: province.trim(),
        postalCode: cleanPin,
        countryCode: "IN",
        phoneNumber: cleanPhone,
      });

      if (addressRes.error) {
        throw new Error(addressRes.error);
      }

      // Step 3: Set Shipping Method
      if (selectedShippingMethodId) {
        const shippingRes = await setOrderShippingMethod(selectedShippingMethodId);
        if (shippingRes.error) {
          throw new Error(shippingRes.error);
        }
      }

      // Step 4: Transition Order to ArrangingPayment
      if (order?.state !== "ArrangingPayment") {
        const transitionRes = await transitionOrderToState("ArrangingPayment");
        if (transitionRes.error && !transitionRes.order) {
          if (!transitionRes.error.toLowerCase().includes("arrangingpayment")) {
            throw new Error(transitionRes.error);
          }
        }
      }

      // Step 5: Execute Payment
      if (selectedPaymentMethod === "razorpay") {
        // Create Razorpay order on server
        const rzpOrderData = await createRazorpayOrder();
        if (!rzpOrderData || !rzpOrderData.id) {
          throw new Error("Unable to initialize Razorpay payment. Please try again.");
        }

        const razorpayKey =
          (import.meta as any).env?.PUBLIC_RAZORPAY_KEY_ID ||
          rzpOrderData.keyId ||
          "rzp_test_placeholder";

        toast.add({
          title: "Opening Razorpay...",
          description: "Please complete your payment in the secure window.",
          type: "info",
        });

        // Launch Razorpay Checkout Modal
        const paymentResult = await openRazorpayCheckout({
          key: razorpayKey,
          amount: rzpOrderData.amount,
          currency: rzpOrderData.currency || "INR",
          order_id: rzpOrderData.id,
          name: "RS Prints",
          description: `Order ${order?.code || "RS Prints"}`,
          prefill: {
            name: `${firstName} ${lastName}`.trim(),
            email: email.trim(),
            contact: cleanPhone,
          },
          theme: {
            color: "#f0643b",
          },
        });

        // Step 6: Submit Razorpay payment to Vendure
        const finalOrder = await addPaymentToOrder("razorpay", paymentResult);
        if (finalOrder.error || !finalOrder.order) {
          throw new Error(finalOrder.error || "Payment verification failed.");
        }

        clearCartState();
        toast.add({
          title: "Order Placed Successfully!",
          description: `Receipt: ${finalOrder.order.code}`,
          type: "success",
        });

        window.location.href = `/checkout/success?code=${finalOrder.order.code}`;
      } else {
        // Cash on Delivery
        const finalOrder = await addPaymentToOrder("cash-on-delivery", {
          paymentType: "Cash on Delivery",
        });

        if (finalOrder.error || !finalOrder.order) {
          throw new Error(finalOrder.error || "Failed to confirm Cash on Delivery order.");
        }

        clearCartState();
        toast.add({
          title: "Order Placed Successfully!",
          description: `Order ${finalOrder.order.code} confirmed for Cash on Delivery.`,
          type: "success",
        });

        window.location.href = `/checkout/success?code=${finalOrder.order.code}`;
      }
    } catch (err: any) {
      console.error("Checkout submission failed:", err);
      const msg = err?.message || "An unexpected error occurred during checkout. Please try again.";
      setErrorMessage(msg);
      toast.add({
        title: "Checkout Error",
        description: msg,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading state
  if (!cartState.initialized) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Spinner className="size-10 text-primary mb-4" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Preparing secure checkout...
        </p>
      </div>
    );
  }

  // Empty cart fallback
  if (!order || lines.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <div className="rounded-3xl border bg-card p-10 sm:p-14 shadow-sm">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
            <ShoppingBag className="size-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Your Cart is Empty
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            You don't have any items in your cart to proceed with checkout. Browse our collection of custom printing products!
          </p>
          <Button
            size="lg"
            className="cursor-pointer gap-2 font-semibold shadow-md shadow-primary/20"
            onClick={() => (window.location.href = "/products")}
          >
            <span>Explore Products</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 max-w-7xl">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/cart">Cart</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Checkout</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page Title & Security Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Complete Your Order
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Fast, encrypted checkout powered by Razorpay & RS Prints.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold self-start sm:self-auto">
          <Lock className="size-3.5" />
          <span>256-Bit SSL Encrypted Checkout</span>
        </div>
      </div>

      {/* Global Error Alert */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-8 rounded-2xl">
          <AlertCircle className="size-4" />
          <AlertTitle>Order Processing Issue</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Checkout Columns: Contact, Address, Shipping, Payment */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Contact Information */}
            <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                    1
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    <User className="size-4 text-primary" />
                    <span>Contact Information</span>
                  </h2>
                </div>
                {authState.customer && (
                  <Badge variant="outline" className="text-xs bg-muted/40 font-normal">
                    Logged in as {authState.customer.firstName}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-semibold">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    required
                    placeholder="e.g. Rahul"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-semibold">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    required
                    placeholder="e.g. Sharma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="rahul.sharma@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={Boolean(authState.customer)}
                    className={authState.customer ? "bg-muted/50 cursor-not-allowed" : ""}
                  />
                  {authState.customer ? (
                    <p className="text-[11px] text-muted-foreground">
                      Linked to your authenticated account ({authState.customer.emailAddress}).
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Order confirmation & GST invoice will be sent here.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold">
                    Mobile Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      +91
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      placeholder="9876543210"
                      className="pl-11 font-mono"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Required for courier dispatch & OTP delivery.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Delivery Address */}
            <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4 border-b pb-3">
                <div className="flex size-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                  2
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  <span>Delivery Address</span>
                </h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="streetLine1" className="text-xs font-semibold">
                    Street Address / Flat / Building / Floor{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="streetLine1"
                    required
                    placeholder="Flat 402, Royal Residency, M.G. Road"
                    value={streetLine1}
                    onChange={(e) => setStreetLine1(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="streetLine2" className="text-xs font-semibold">
                    Landmark / Locality (Optional)
                  </Label>
                  <Input
                    id="streetLine2"
                    placeholder="Near City Mall, Opp. State Bank"
                    value={streetLine2}
                    onChange={(e) => setStreetLine2(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-xs font-semibold">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      required
                      placeholder="e.g. Pune"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="province" className="text-xs font-semibold">
                      State / UT <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="province"
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                    >
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="postalCode" className="text-xs font-semibold">
                      PIN Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="postalCode"
                      required
                      placeholder="e.g. 411001"
                      className="font-mono"
                      maxLength={6}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Shipping Method Selection */}
            <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4 border-b pb-3">
                <div className="flex size-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                  3
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Truck className="size-4 text-primary" />
                  <span>Delivery Method</span>
                </h2>
              </div>

              {isMethodsLoading ? (
                <div className="py-4 flex items-center gap-2 text-muted-foreground text-xs">
                  <Spinner className="size-4" />
                  <span>Loading eligible delivery methods...</span>
                </div>
              ) : shippingMethods.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2">
                  Standard delivery will be automatically applied.
                </div>
              ) : (
                <RadioGroup
                  value={selectedShippingMethodId}
                  onValueChange={setSelectedShippingMethodId}
                  className="space-y-3"
                >
                  {shippingMethods.map((method) => (
                    <label
                      key={method.id}
                      htmlFor={`shipping-${method.id}`}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedShippingMethodId === method.id
                          ? "border-primary bg-primary/5 shadow-2xs"
                          : "border-border hover:border-border/80 bg-background"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={method.id} id={`shipping-${method.id}`} />
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {method.name}
                          </div>
                          {method.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {method.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-foreground">
                          {method.priceWithTax === 0 ? "FREE" : formatRupees(method.priceWithTax)}
                        </span>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}
            </div>

            {/* Step 4: Payment Method Selection */}
            <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4 border-b pb-3">
                <div className="flex size-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                  4
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="size-4 text-primary" />
                  <span>Payment Method</span>
                </h2>
              </div>

              <RadioGroup
                value={selectedPaymentMethod}
                onValueChange={(val) => setSelectedPaymentMethod(val as any)}
                className="space-y-3"
              >
                {/* Razorpay Online */}
                <label
                  htmlFor="payment-razorpay"
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all cursor-pointer gap-3 ${
                    selectedPaymentMethod === "razorpay"
                      ? "border-primary bg-primary/5 shadow-2xs"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <RadioGroupItem value="razorpay" id="payment-razorpay" className="mt-0.5 sm:mt-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          Razorpay (UPI / Cards / Netbanking)
                        </span>
                        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-1.5 py-0">
                          Recommended
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Instant payment via Google Pay, PhonePe, Paytm, Credit/Debit Cards, UPI QR & Netbanking.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-muted text-muted-foreground font-mono">
                      UPI / Cards
                    </span>
                  </div>
                </label>

                {/* Cash on Delivery */}
                <label
                  htmlFor="payment-cod"
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all cursor-pointer gap-3 ${
                    selectedPaymentMethod === "cash-on-delivery"
                      ? "border-primary bg-primary/5 shadow-2xs"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <RadioGroupItem value="cash-on-delivery" id="payment-cod" className="mt-0.5 sm:mt-0" />
                    <div>
                      <div className="text-sm font-bold text-foreground">Cash on Delivery (COD)</div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Pay cash directly to the courier executive upon receipt at your doorstep.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto text-muted-foreground">
                    <Banknote className="size-4" />
                  </div>
                </label>
              </RadioGroup>
            </div>
          </div>

          {/* Right Column: Sticky Order Summary & Submit CTA */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-5">
            <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-5 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <h3 className="text-base font-bold text-foreground border-b pb-3">
                Order Review ({lines.length} {lines.length === 1 ? "item" : "items"})
              </h3>

              {/* Items List Preview */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-border/40">
                {lines.map((line) => {
                  const variant = line.productVariant;
                  const imageUrl =
                    line.featuredAsset?.preview ||
                    variant.featuredAsset?.preview ||
                    variant.product?.featuredAsset?.preview ||
                    "/placeholder-product.png";

                  return (
                    <div key={line.id} className="flex items-center gap-3 pt-2.5 first:pt-0">
                      <div className="size-12 rounded-lg bg-muted/40 border shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={imageUrl}
                          alt={variant.name}
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-foreground truncate">
                          {variant.product?.name || variant.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Qty: {line.quantity} × {formatRupees(line.unitPriceWithTax)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-foreground">
                          {formatRupees(line.linePriceWithTax)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {formatRupees(currentSubtotal)}
                  </span>
                </div>

                {totalDiscounts > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Discount Savings</span>
                    <span>-{formatRupees(totalDiscounts)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Shipping & Handling</span>
                  <span className="font-semibold text-foreground">
                    {estimatedShippingCost === 0 ? "FREE" : formatRupees(estimatedShippingCost)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span>GST (18% Included)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Included
                  </span>
                </div>
              </div>

              <Separator />

              {/* Grand Total */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-sm font-bold text-foreground">Total Payable</span>
                  <p className="text-[10px] text-muted-foreground">All taxes included</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-foreground tracking-tight">
                    {formatRupees(estimatedGrandTotal)}
                  </div>
                </div>
              </div>

              {/* Checkout Action Button */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-12 text-sm font-bold gap-2 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="size-4" />
                    <span>Processing Order...</span>
                  </>
                ) : selectedPaymentMethod === "razorpay" ? (
                  <>
                    <Zap className="size-4 fill-current" />
                    <span>Pay {formatRupees(estimatedGrandTotal)} with Razorpay</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>Confirm Order (COD)</span>
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground pt-1">
                <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                <span>100% Risk-Free Guarantee & Easy Support</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
