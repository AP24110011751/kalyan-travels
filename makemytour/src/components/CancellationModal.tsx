import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, XCircle, IndianRupee, Clock } from "lucide-react";

const CANCELLATION_REASONS = [
  "Change of travel plans",
  "Found a better price elsewhere",
  "Medical emergency",
  "Work or business conflict",
  "Family emergency",
  "Visa or documentation issue",
  "Weather or natural disaster",
  "Other",
];

interface Booking {
  bookingId: string;
  type: string;
  totalPrice: number;
  date: string;
  details: any;
}

interface CancellationModalProps {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  onConfirm: (bookingId: string, reason: string, refundAmount: number) => void;
}

const calculateRefund = (
  totalPrice: number,
  bookingDate: string
): { refundAmount: number; refundPercent: number; policy: string } => {
  const now = new Date();
  const booked = new Date(bookingDate);
  const hoursSinceBooking = (now.getTime() - booked.getTime()) / (1000 * 60 * 60);

  if (hoursSinceBooking <= 24) {
    return {
      refundAmount: Math.round(totalPrice * 0.5),
      refundPercent: 50,
      policy: "Cancelled within 24 hours of booking — 50% refund applies.",
    };
  } else if (hoursSinceBooking <= 72) {
    return {
      refundAmount: Math.round(totalPrice * 0.25),
      refundPercent: 25,
      policy: "Cancelled between 24–72 hours of booking — 25% partial refund applies.",
    };
  } else {
    return {
      refundAmount: 0,
      refundPercent: 0,
      policy: "Cancelled after 72 hours of booking — no refund applicable.",
    };
  }
};

const CancellationModal = ({
  open,
  onClose,
  booking,
  onConfirm,
}: CancellationModalProps) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [step, setStep] = useState<"reason" | "confirm">("reason");
  const [error, setError] = useState("");

  const refundInfo = booking
    ? calculateRefund(booking.totalPrice, booking.date)
    : null;

  const handleNext = () => {
    if (!selectedReason) {
      setError("Please select a reason to continue.");
      return;
    }
    setError("");
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!booking || !refundInfo) return;
    onConfirm(booking.bookingId, selectedReason, refundInfo.refundAmount);
    setStep("reason");
    setSelectedReason("");
  };

  const handleClose = () => {
    setStep("reason");
    setSelectedReason("");
    setError("");
    onClose();
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            Cancel Booking — {booking.bookingId}
          </DialogTitle>
        </DialogHeader>

        {step === "reason" && (
          <div className="mt-2 space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex gap-2 text-sm text-orange-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Cancellation is permanent and cannot be undone. Please review
                the refund policy before proceeding.
              </span>
            </div>

            {refundInfo && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-1">
                <p className="font-semibold text-blue-700 flex items-center gap-1 text-sm">
                  <IndianRupee className="w-4 h-4" />
                  Refund Estimate
                </p>
                <p className="text-sm text-gray-600">{refundInfo.policy}</p>
                <p className="text-lg font-bold text-blue-700 mt-1">
                  ₹{refundInfo.refundAmount.toLocaleString("en-IN")}{" "}
                  <span className="text-sm font-normal text-gray-500">
                    ({refundInfo.refundPercent}% of ₹
                    {booking.totalPrice.toLocaleString("en-IN")})
                  </span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Cancellation <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => {
                  setSelectedReason(e.target.value);
                  setError("");
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
              >
                <option value="">-- Select a reason --</option>
                {CANCELLATION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Keep Booking
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleNext}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && refundInfo && (
          <div className="mt-2 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Booking ID</span>
                <span className="font-semibold">{booking.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-semibold">{booking.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reason</span>
                <span className="font-semibold text-right max-w-[60%]">
                  {selectedReason}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-semibold">
                  ₹{booking.totalPrice.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-500">Refund Amount</span>
                <span className="font-bold text-green-600 text-base">
                  ₹{refundInfo.refundAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              Refund will be processed within 5–7 business days to your original
              payment method.
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("reason")}
              >
                Go Back
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleConfirm}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CancellationModal;
