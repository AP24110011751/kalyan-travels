import { CheckCircle2, Circle, Clock, IndianRupee, Loader2 } from "lucide-react";

type RefundStatus = "pending" | "processing" | "completed";

interface RefundEntry {
  bookingId: string;
  bookingType: string;
  reason: string;
  refundAmount: number;
  cancelledAt: string;
  status: RefundStatus;
}

interface RefundTrackerProps {
  refunds: RefundEntry[];
}

const STATUS_STEPS: RefundStatus[] = ["pending", "processing", "completed"];

const STATUS_LABELS: Record<RefundStatus, string> = {
  pending: "Refund Initiated",
  processing: "Refund Processing",
  completed: "Refund Completed",
};

const STATUS_DESCRIPTIONS: Record<RefundStatus, string> = {
  pending: "Your cancellation request has been received.",
  processing: "Refund is being processed by our team.",
  completed: "Amount has been credited to your account.",
};

const EXPECTED_TIMELINES: Record<RefundStatus, string> = {
  pending: "Expected by Day 2",
  processing: "Expected by Day 5",
  completed: "Completed",
};

const stepColorClass = (
  stepStatus: RefundStatus,
  currentStatus: RefundStatus
): string => {
  const stepIndex = STATUS_STEPS.indexOf(stepStatus);
  const currentIndex = STATUS_STEPS.indexOf(currentStatus);
  if (stepIndex < currentIndex) return "text-green-600";
  if (stepIndex === currentIndex) return "text-blue-600";
  return "text-gray-300";
};

const StepIcon = ({
  stepStatus,
  currentStatus,
}: {
  stepStatus: RefundStatus;
  currentStatus: RefundStatus;
}) => {
  const stepIndex = STATUS_STEPS.indexOf(stepStatus);
  const currentIndex = STATUS_STEPS.indexOf(currentStatus);

  if (stepIndex < currentIndex) {
    return <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />;
  }
  if (stepIndex === currentIndex) {
    return <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />;
  }
  return <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />;
};

const formatCancelDate = (isoString: string): string => {
  return new Date(isoString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const RefundTracker = ({ refunds }: RefundTrackerProps) => {
  if (!refunds || refunds.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <IndianRupee className="w-5 h-5 text-green-600" />
        Refund Status Tracker
      </h2>

      <div className="space-y-4">
        {refunds.map((refund) => (
          <div
            key={refund.bookingId}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-5"
          >
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {refund.bookingType} Booking —{" "}
                  <span className="text-gray-500">{refund.bookingId}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Cancelled on {formatCancelDate(refund.cancelledAt)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Reason: {refund.reason}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Refund Amount</p>
                <p className="text-lg font-bold text-green-600">
                  ₹{refund.refundAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">
              {STATUS_STEPS.map((step, index) => {
                const stepIndex = STATUS_STEPS.indexOf(step);
                const currentIndex = STATUS_STEPS.indexOf(refund.status);
                const isLast = index === STATUS_STEPS.length - 1;

                return (
                  <div key={step} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <StepIcon
                        stepStatus={step}
                        currentStatus={refund.status}
                      />
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 my-1 min-h-[20px] ${stepIndex < currentIndex
                              ? "bg-green-300"
                              : "bg-gray-200"
                            }`}
                        />
                      )}
                    </div>
                    <div className="pb-4">
                      <p
                        className={`text-sm font-semibold ${stepColorClass(
                          step,
                          refund.status
                        )}`}
                      >
                        {STATUS_LABELS[step]}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {STATUS_DESCRIPTIONS[step]}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 italic">
                        {EXPECTED_TIMELINES[step]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RefundTracker;
