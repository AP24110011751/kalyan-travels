import { useEffect, useState } from "react";
import { ShieldAlert, Trash2, Undo2, Star } from "lucide-react";

interface ReviewReply {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  photos: string[];
  createdAt: string;
  helpfulCount: number;
  flagged: boolean;
  replies: ReviewReply[];
}

interface FlaggedItem {
  entityKey: string;
  review: Review;
}

const STORAGE_PREFIX = "mmt_reviews_";

const StarRow = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`w-3.5 h-3.5 ${n <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
      />
    ))}
  </div>
);

// Scans every entity's review list in localStorage and pulls out flagged ones
const loadFlaggedReviews = (): FlaggedItem[] => {
  if (typeof window === "undefined") return [];
  const flagged: FlaggedItem[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
    try {
      const reviews: Review[] = JSON.parse(window.localStorage.getItem(key) || "[]");
      reviews
        .filter((r) => r.flagged)
        .forEach((r) => flagged.push({ entityKey: key.replace(STORAGE_PREFIX, ""), review: r }));
    } catch {
      // skip malformed entries
    }
  }
  return flagged.sort(
    (a, b) => new Date(b.review.createdAt).getTime() - new Date(a.review.createdAt).getTime()
  );
};

const ReviewModeration = () => {
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);

  useEffect(() => {
    setFlaggedItems(loadFlaggedReviews());
  }, []);

  const updateEntityReviews = (entityKey: string, updater: (reviews: Review[]) => Review[]) => {
    const storageKey = STORAGE_PREFIX + entityKey;
    const current: Review[] = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    const updated = updater(current);
    window.localStorage.setItem(storageKey, JSON.stringify(updated));
    setFlaggedItems(loadFlaggedReviews());
  };

  const handleRemove = (entityKey: string, reviewId: string) => {
    updateEntityReviews(entityKey, (reviews) => reviews.filter((r) => r.id !== reviewId));
  };

  const handleRestore = (entityKey: string, reviewId: string) => {
    updateEntityReviews(entityKey, (reviews) =>
      reviews.map((r) => (r.id === reviewId ? { ...r, flagged: false } : r))
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Reviews flagged as inappropriate by users appear here for moderator review.
        </p>
        <button
          onClick={() => setFlaggedItems(loadFlaggedReviews())}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      {flaggedItems.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No flagged reviews awaiting moderation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {flaggedItems.map(({ entityKey, review }) => (
            <div
              key={review.id}
              className="border border-orange-200 bg-orange-50 rounded-xl p-4"
            >
              <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{review.author}</span>
                    <span className="text-xs text-gray-400">on</span>
                    <span className="text-xs font-medium text-gray-600">{entityKey}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRow rating={review.rating} />
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                  <ShieldAlert className="w-3 h-3" />
                  Flagged
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-3">{review.text}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(entityKey, review.id)}
                  className="flex items-center gap-1 text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  {"Approve & Unflag"}
                </button>
                <button
                  onClick={() => handleRemove(entityKey, review.id)}
                  className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewModeration;
