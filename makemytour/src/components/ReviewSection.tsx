import { useEffect, useRef, useState } from "react";
import {
    Star,
    ThumbsUp,
    Flag,
    MessageCircle,
    ImagePlus,
    X,
    Send,
    ShieldAlert,
} from "lucide-react";

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

interface ReviewSectionProps {
    entityKey: string;
    entityLabel: string;
}

type SortOption = "helpful" | "newest" | "highest";

const STORAGE_PREFIX = "mmt_reviews_";

const loadReviews = (entityKey: string): Review[] => {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(
            localStorage.getItem(STORAGE_PREFIX + entityKey) || "[]"
        );
    } catch {
        return [];
    }
};

const saveReviews = (entityKey: string, reviews: Review[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_PREFIX + entityKey, JSON.stringify(reviews));
};

const timeAgo = (isoString: string): string => {
    const seconds = Math.floor(
        (Date.now() - new Date(isoString).getTime()) / 1000
    );
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const StarRow = ({
    rating,
    size = "w-4 h-4",
}: {
    rating: number;
    size?: string;
}) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
            <Star
                key={n}
                className={`${size} ${n <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
                    }`}
            />
        ))}
    </div>
);

const ReviewSection = ({ entityKey, entityLabel }: ReviewSectionProps) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>("helpful");
    const [showForm, setShowForm] = useState(false);
    const [newRating, setNewRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [newText, setNewText] = useState("");
    const [newPhotos, setNewPhotos] = useState<string[]>([]);
    const [authorName, setAuthorName] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setReviews(loadReviews(entityKey));
    }, [entityKey]);

    const persist = (updated: Review[]) => {
        setReviews(updated);
        saveReviews(entityKey, updated);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const readers = Array.from(files)
            .slice(0, 3 - newPhotos.length)
            .map(
                (file) =>
                    new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                    })
            );
        Promise.all(readers).then((results) => {
            setNewPhotos((prev) => [...prev, ...results].slice(0, 3));
        });
    };

    const handleSubmitReview = () => {
        if (newRating === 0 || newText.trim().length === 0) return;
        const review: Review = {
            id: `rev-${Date.now()}`,
            author: authorName.trim() || "Anonymous Traveler",
            rating: newRating,
            text: newText.trim(),
            photos: newPhotos,
            createdAt: new Date().toISOString(),
            helpfulCount: 0,
            flagged: false,
            replies: [],
        };
        persist([review, ...reviews]);
        setNewRating(0);
        setNewText("");
        setNewPhotos([]);
        setAuthorName("");
        setShowForm(false);
    };

    const handleMarkHelpful = (id: string) => {
        persist(
            reviews.map((r) =>
                r.id === id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
            )
        );
    };

    const handleFlag = (id: string) => {
        persist(
            reviews.map((r) => (r.id === id ? { ...r, flagged: true } : r))
        );
    };

    const handleAddReply = (reviewId: string) => {
        if (!replyText.trim()) return;
        const reply: ReviewReply = {
            id: `reply-${Date.now()}`,
            author: "You",
            text: replyText.trim(),
            createdAt: new Date().toISOString(),
        };
        persist(
            reviews.map((r) =>
                r.id === reviewId ? { ...r, replies: [...r.replies, reply] } : r
            )
        );
        setReplyText("");
        setReplyingTo(null);
    };

    const sortedReviews = [...reviews].sort((a, b) => {
        if (sortBy === "newest")
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === "highest") return b.rating - a.rating;
        return b.helpfulCount - a.helpfulCount;
    });

    const avgRating =
        reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div>
                    <h2 className="text-xl font-bold">
                        Reviews & Ratings for {entityLabel}
                    </h2>
                    {reviews.length > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                            <StarRow rating={Math.round(avgRating)} />
                            <span className="text-sm text-gray-500">
                                {avgRating.toFixed(1)} ({reviews.length}{" "}
                                {reviews.length === 1 ? "review" : "reviews"})
                            </span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setShowForm((prev) => !prev)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    {showForm ? "Cancel" : "Write a Review"}
                </button>
            </div>

            {showForm && (
                <div className="border border-blue-100 bg-blue-50 rounded-lg p-4 mb-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Your Rating <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <Star
                                    key={n}
                                    onClick={() => setNewRating(n)}
                                    onMouseEnter={() => setHoverRating(n)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className={`w-7 h-7 cursor-pointer transition-colors ${n <= (hoverRating || newRating)
                                            ? "text-yellow-400 fill-current"
                                            : "text-gray-300"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            placeholder="Anonymous Traveler"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Your Review <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            rows={4}
                            placeholder="Share details of your experience..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Add Photos (up to 3)
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {newPhotos.map((photo, i) => (
                                <div key={i} className="relative">
                                    <img
                                        src={photo}
                                        alt={`upload-${i}`}
                                        className="w-16 h-16 object-cover rounded-lg"
                                    />
                                    <button
                                        onClick={() =>
                                            setNewPhotos((prev) => prev.filter((_, idx) => idx !== i))
                                        }
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {newPhotos.length < 3 && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
                                >
                                    <ImagePlus className="w-5 h-5" />
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoUpload}
                                className="hidden"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmitReview}
                        disabled={newRating === 0 || newText.trim().length === 0}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm px-5 py-2 rounded-lg transition-colors"
                    >
                        Submit Review
                    </button>
                </div>
            )}

            {reviews.length > 0 && (
                <div className="flex items-center justify-end mb-4">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    >
                        <option value="helpful">Most Helpful</option>
                        <option value="newest">Newest</option>
                        <option value="highest">Highest Rated</option>
                    </select>
                </div>
            )}

            {sortedReviews.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                    No reviews yet. Be the first to share your experience!
                </p>
            ) : (
                <div className="space-y-5">
                    {sortedReviews.map((review) => (
                        <div
                            key={review.id}
                            className="border-b border-gray-100 pb-5 last:border-b-0"
                        >
                            <div className="flex items-start justify-between flex-wrap gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{review.author}</span>
                                        {review.flagged && (
                                            <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                                <ShieldAlert className="w-3 h-3" />
                                                Under Review
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <StarRow rating={review.rating} />
                                        <span className="text-xs text-gray-400">
                                            {timeAgo(review.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-700 mt-2">{review.text}</p>

                            {review.photos.length > 0 && (
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {review.photos.map((photo, i) => (
                                        <img
                                            key={i}
                                            src={photo}
                                            alt={`review-photo-${i}`}
                                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-4 mt-3">
                                <button
                                    onClick={() => handleMarkHelpful(review.id)}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    Helpful ({review.helpfulCount})
                                </button>
                                <button
                                    onClick={() =>
                                        setReplyingTo(replyingTo === review.id ? null : review.id)
                                    }
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    Reply
                                </button>
                                {!review.flagged && (
                                    <button
                                        onClick={() => handleFlag(review.id)}
                                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                                    >
                                        <Flag className="w-3.5 h-3.5" />
                                        Flag
                                    </button>
                                )}
                            </div>

                            {review.replies.length > 0 && (
                                <div className="mt-3 ml-4 pl-4 border-l-2 border-gray-100 space-y-2">
                                    {review.replies.map((reply) => (
                                        <div key={reply.id} className="text-sm">
                                            <span className="font-semibold">{reply.author}</span>{" "}
                                            <span className="text-xs text-gray-400">
                                                {timeAgo(reply.createdAt)}
                                            </span>
                                            <p className="text-gray-600 text-sm">{reply.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {replyingTo === review.id && (
                                <div className="mt-3 ml-4 flex gap-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Write a reply..."
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <button
                                        onClick={() => handleAddReply(review.id)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewSection;