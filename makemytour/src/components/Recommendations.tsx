import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Sparkles, Info, ThumbsUp, ThumbsDown, Plane, Building2, X } from "lucide-react";
import { getRecommendations, recordFeedback, RecommendationItem } from "@/lib/recommendations";

interface RecommendationsProps {
  hotels: any[];
  flights: any[];
}

const Recommendations = ({ hotels, flights }: RecommendationsProps) => {
  const router = useRouter();
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [openReason, setOpenReason] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, "helpful" | "irrelevant">>({});

  const refresh = () => {
    if (!hotels?.length && !flights?.length) return;
    setItems(getRecommendations(hotels, flights, 6));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotels, flights]);

  const handleFeedback = (item: RecommendationItem, helpful: boolean) => {
    recordFeedback(item.destination, helpful);
    setFeedbackGiven((prev) => ({
      ...prev,
      [`${item.entityType}-${item.id}`]: helpful ? "helpful" : "irrelevant",
    }));
    // Refresh shortly after so the list reflects the updated weighting,
    // giving the user a moment to see their feedback register first.
    setTimeout(refresh, 600);
  };

  const handleOpen = (item: RecommendationItem) => {
    if (item.entityType === "hotel") {
      router.push(`/book-hotel/${item.id}`);
    } else {
      router.push(`/book-flight/${item.id}`);
    }
  };

  if (!items.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg mx-auto max-w-5xl p-6 mt-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h2 className="text-lg font-bold">Recommended for You</h2>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Based on your booking history, plus picks popular with travelers who share your interests.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const key = `${item.entityType}-${item.id}`;
          const given = feedbackGiven[key];
          return (
            <div
              key={key}
              className="border rounded-xl p-4 hover:shadow-md transition-shadow relative flex flex-col"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {item.entityType === "hotel" ? (
                    <Building2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <Plane className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="text-xs uppercase tracking-wide text-gray-400 font-medium">
                    {item.entityType}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setOpenReason(openReason === key ? null : key)
                  }
                  className="text-gray-400 hover:text-purple-600"
                  title="Why this recommendation?"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => handleOpen(item)}
                className="text-left flex-1"
              >
                <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 mb-2">{item.subtitle}</p>
                <p className="font-bold text-sm">
                  ₹{item.price.toLocaleString("en-IN")}
                  <span className="text-xs font-normal text-gray-400">
                    {item.entityType === "hotel" ? "/night" : ""}
                  </span>
                </p>
              </button>

              {openReason === key && (
                <div className="mt-2 text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-lg p-2 flex items-start justify-between gap-2">
                  <span>{item.reason}</span>
                  <button onClick={() => setOpenReason(null)}>
                    <X className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                {given ? (
                  <span className="text-xs text-gray-400">
                    {given === "helpful"
                      ? "Thanks — we'll show more like this."
                      : "Got it — we'll show less like this."}
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleFeedback(item, true)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 border border-gray-200 hover:border-green-300 rounded-full px-2 py-1 transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      Helpful
                    </button>
                    <button
                      onClick={() => handleFeedback(item, false)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-300 rounded-full px-2 py-1 transition-colors"
                    >
                      <ThumbsDown className="w-3 h-3" />
                      Not for me
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Recommendations;
