"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CheckCircle, CreditCard, Lock, Tag } from "lucide-react";
import { useEffect, useState } from "react";

const BASE_PRICE = 67_000_000;

function formatPrice(amount) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "CAD", minimumFractionDigits: 2 });
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + " / " + digits.slice(2);
  return digits;
}

export function PaywallDialog({
  open,
  onOpenChange,
  onSuccess,
  title = "BSCode Premium",
  description = "Your free trial has expired. Complete payment to continue using BSCode.",
  price = BASE_PRICE,
  couponCode = "JEFFIEHU",
}) {
  const [fullName, setFullName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [error, setError] = useState("");

  const currentPrice = couponApplied ? 0 : price;

  useEffect(() => {
    if (open) {
      setFullName("");
      setCardNumber("");
      setExpiry("");
      setCvc("");
      setCoupon("");
      setCouponApplied(false);
      setError("");
    }
  }, [open]);

  function handleApplyCoupon() {
    if (coupon.trim().toUpperCase() === couponCode) {
      setCouponApplied(true);
      setError("");
    } else {
      setError("Invalid coupon code.");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (currentPrice > 0) {
      const digits = cardNumber.replace(/\D/g, "");
      if (digits.length < 15) {
        setError("Enter a valid card number.");
        return;
      }
      const expiryDigits = expiry.replace(/\D/g, "");
      if (expiryDigits.length < 4) {
        setError("Enter a valid expiration date.");
        return;
      }
      if (cvc.replace(/\D/g, "").length < 3) {
        setError("Enter a valid CVC.");
        return;
      }
      setError("Payment declined. Try applying a coupon code.");
      return;
    }

    onOpenChange(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={true}
      >
        {/* Header */}
        <div className="bg-linear-to-br from-neutral-900 to-neutral-800 px-6 pt-6 pb-5 text-white">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-amber-400" />
              <DialogTitle className="text-base font-semibold text-white">{title}</DialogTitle>
            </div>
            <DialogDescription className="text-neutral-400 text-sm">
              {description}
            </DialogDescription>
          </DialogHeader>

          {/* Price display */}
          <div className="mt-4 flex items-end gap-2">
            {couponApplied ? (
              <>
                <span className="text-3xl font-bold text-green-400">$0.00</span>
                <span className="text-lg text-neutral-500 line-through mb-0.5">
                  {formatPrice(price)}
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold">{formatPrice(price)}</span>
            )}
            <span className="text-neutral-400 text-sm mb-1">/ lifetime</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700" htmlFor="pw-fullname">
              Full name
            </label>
            <Input
              id="pw-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              autoFocus
              autoComplete="off"
            />
          </div>

          {/* Card details - only shown when price > 0 */}
          {currentPrice > 0 && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700" htmlFor="pw-card">
                  Card number
                </label>
                <div className="relative">
                  <Input
                    id="pw-card"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    autoComplete="off"
                    className="pr-10"
                  />
                  <CreditCard className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-neutral-700" htmlFor="pw-expiry">
                    Expiration
                  </label>
                  <Input
                    id="pw-expiry"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM / YY"
                    autoComplete="off"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-neutral-700" htmlFor="pw-cvc">
                    CVC
                  </label>
                  <Input
                    id="pw-cvc"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    autoComplete="off"
                  />
                </div>
              </div>
            </>
          )}

          {/* Coupon */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700" htmlFor="pw-coupon">
              Coupon code
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="pw-coupon"
                  value={coupon}
                  onChange={(e) => {
                    setCoupon(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter code"
                  autoComplete="off"
                  disabled={couponApplied}
                  className="pr-10"
                />
                <Tag className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={couponApplied}
              >
                {couponApplied ? "Applied" : "Apply"}
              </Button>
            </div>
            {couponApplied && (
              <p className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-3.5 w-3.5" />
                Coupon applied — 100% discount
              </p>
            )}
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Submit */}
          <Button type="submit" className="w-full mt-1">
            {currentPrice > 0 ? `Pay ${formatPrice(currentPrice)}` : "Continue for free"}
          </Button>

          <p className="text-xs text-center text-neutral-400">
            Secured with 256-bit SSL encryption
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
