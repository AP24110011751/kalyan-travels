import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Building2,
  Smartphone,
  ShieldCheck,
  Lock,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  itemTitle: string;
  itemSubtitle?: string;
  onPaymentSuccess: () => Promise<void> | void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  itemTitle,
  itemSubtitle,
  onPaymentSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "netbanking">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Card details state
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // UPI details state
  const [upiId, setUpiId] = useState("");

  // Net banking state
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  // Format Card Number (adds space every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  };

  // Format Expiry MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length > 2) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setExpiry(raw);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate real payment gateway processing (1.5 seconds)
    setTimeout(async () => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(async () => {
        await onPaymentSuccess();
        setIsSuccess(false);
        onClose();
      }, 1000);
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !isSuccess && onClose()}>
      <DialogContent className="sm:max-w-[540px] bg-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between border-b pb-3 text-gray-900">
            <span className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-600" />
              Secure Payment Gateway
            </span>
            <span className="text-xl font-extrabold text-blue-600">
              ₹ {amount.toLocaleString("en-IN")}
            </span>
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Payment Successful!</h3>
            <p className="text-sm text-gray-500">
              Your booking for <span className="font-semibold text-gray-800">{itemTitle}</span> is confirmed.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-5 mt-2">
            {/* Booking Summary Pill */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{itemTitle}</p>
                {itemSubtitle && <p className="text-gray-500">{itemSubtitle}</p>}
              </div>
              <span className="bg-green-100 text-green-700 font-medium px-2 py-1 rounded">
                Instant Confirmation
              </span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">
                Select Payment Mode
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                    paymentMethod === "card"
                      ? "border-blue-600 bg-blue-50/70 text-blue-700 font-bold shadow-sm"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <CreditCard className="w-5 h-5 mb-1.5" />
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                    paymentMethod === "upi"
                      ? "border-blue-600 bg-blue-50/70 text-blue-700 font-bold shadow-sm"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <Smartphone className="w-5 h-5 mb-1.5" />
                  UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("netbanking")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                    paymentMethod === "netbanking"
                      ? "border-blue-600 bg-blue-50/70 text-blue-700 font-bold shadow-sm"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <Building2 className="w-5 h-5 mb-1.5" />
                  Net Banking
                </button>
              </div>
            </div>

            {/* Form Fields Based on Mode */}
            {paymentMethod === "card" && (
              <div className="space-y-3.5 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div>
                  <Label htmlFor="cardNumber" className="text-xs font-semibold text-gray-700">
                    Card Number
                  </Label>
                  <Input
                    id="cardNumber"
                    placeholder="4532 8920 1284 9912"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    required
                    maxLength={19}
                    className="mt-1 font-mono tracking-wider bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="cardHolder" className="text-xs font-semibold text-gray-700">
                    Cardholder Name
                  </Label>
                  <Input
                    id="cardHolder"
                    placeholder="John Doe"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    required
                    className="mt-1 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="expiry" className="text-xs font-semibold text-gray-700">
                      Expiry Date
                    </Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={handleExpiryChange}
                      required
                      maxLength={5}
                      className="mt-1 font-mono bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv" className="text-xs font-semibold text-gray-700">
                      CVV
                    </Label>
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="•••"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                      required
                      className="mt-1 font-mono bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "upi" && (
              <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div>
                  <Label htmlFor="upiId" className="text-xs font-semibold text-gray-700">
                    Virtual Payment Address (UPI ID)
                  </Label>
                  <Input
                    id="upiId"
                    placeholder="e.g. mobileNumber@upi or user@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                    className="mt-1 bg-white"
                  />
                </div>
                <div className="flex gap-2 text-xs text-gray-500 pt-1">
                  <span className="font-medium text-gray-600">Quick options:</span>
                  {["@okaxis", "@okhdfcbank", "@paytm", "@ybl"].map((suffix) => (
                    <button
                      key={suffix}
                      type="button"
                      onClick={() => setUpiId((prev) => (prev ? prev.split("@")[0] + suffix : `user${suffix}`))}
                      className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100"
                    >
                      {suffix}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === "netbanking" && (
              <div className="space-y-3.5 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div>
                  <Label className="text-xs font-semibold text-gray-700">
                    Select Your Bank
                  </Label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full mt-1 border border-input rounded-md px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India">State Bank of India (SBI)</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="accNo" className="text-xs font-semibold text-gray-700">
                    Bank Account Number
                  </Label>
                  <Input
                    id="accNo"
                    placeholder="Enter Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    required
                    className="mt-1 bg-white font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="ifsc" className="text-xs font-semibold text-gray-700">
                    IFSC Code
                  </Label>
                  <Input
                    id="ifsc"
                    placeholder="e.g. HDFC0001234"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    required
                    className="mt-1 bg-white font-mono uppercase"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                256-Bit SSL Encrypted & RBI Compliant
              </span>
              <span>100% Refundable</span>
            </div>

            <Button
              type="submit"
              disabled={isProcessing}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  Pay ₹ {amount.toLocaleString("en-IN")} & Complete Booking
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;

