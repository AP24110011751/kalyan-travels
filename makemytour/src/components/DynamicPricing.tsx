import { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Snowflake, Info, Clock } from "lucide-react";

interface DynamicPricingProps {
  entityKey: string; // unique id, e.g. `flight-<id>` or `hotel-<id>`
  basePrice: number;
  unitLabel: string; // e.g. "per ticket" or "per night"
  onPriceChange: (currentPrice: number) => void;
}

interface PriceFreeze {
  price: number;
  frozenAt: number;
  expiresAt: number;
}

const FREEZE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const HISTORY_DAYS = 14;

const hashSeed = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const FLOOR_MULTIPLIER = 0.7; // price never drops below 70% of standard fare
const CEILING_MULTIPLIER = 1.6; // price never exceeds 160% of standard fare, even in peak+weekend+high demand

interface PriceBreakdown {
  weekend: number;
  season: number;
  demand: number;
  rawMultiplier: number;
  clampedMultiplier: number;
  guardrailApplied: boolean;
}

// Deterministic multiplier for a given entity + calendar day: demand, weekends, season.
// Returns the individual components too, so the UI can show *why* the price is what it is
// (industry-standard practice for dynamic pricing transparency) and can display the
// floor/ceiling guardrails that keep the algorithm from running wild.
const getPriceBreakdown = (entityKey: string, date: Date): PriceBreakdown => {
  const day = date.getDay(); // 0 = Sun, 6 = Sat
  const weekend = day === 0 || day === 6 ? 0.15 : 0;

  const month = date.getMonth(); // 0-11
  const isPeakSeason = month === 10 || month === 11 || month === 0; // Nov, Dec, Jan
  const season = isPeakSeason ? 0.2 : 0;

  // Deterministic pseudo-random demand swing, seeded by entity + date
  const dayKey = `${entityKey}-${date.toISOString().slice(0, 10)}`;
  const seed = hashSeed(dayKey);
  const demand = ((seed % 21) - 10) / 100; // -10% to +10%

  const rawMultiplier = 1 + weekend + season + demand;
  const clampedMultiplier = Math.min(
    CEILING_MULTIPLIER,
    Math.max(FLOOR_MULTIPLIER, rawMultiplier)
  );

  return {
    weekend,
    season,
    demand,
    rawMultiplier,
    clampedMultiplier,
    guardrailApplied: clampedMultiplier !== rawMultiplier,
  };
};

const getMultiplierForDate = (entityKey: string, date: Date): number =>
  getPriceBreakdown(entityKey, date).clampedMultiplier;

const loadFreeze = (entityKey: string): PriceFreeze | null => {
  try {
    const raw = window.localStorage.getItem(`mmt_price_freeze_${entityKey}`);
    if (!raw) return null;
    const parsed: PriceFreeze = JSON.parse(raw);
    if (parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(`mmt_price_freeze_${entityKey}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const formatTimeLeft = (ms: number): string => {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const DynamicPricing = ({
  entityKey,
  basePrice,
  unitLabel,
  onPriceChange,
}: DynamicPricingProps) => {
  const [liveNudge, setLiveNudge] = useState(0); // small extra live swing, in fraction
  const [freeze, setFreeze] = useState<PriceFreeze | null>(null);
  const [now, setNow] = useState(Date.now());
  const [showBreakdown, setShowBreakdown] = useState(false);

  const todayBreakdown = useMemo(
    () => getPriceBreakdown(entityKey, new Date()),
    [entityKey]
  );

  const history = useMemo(() => {
    const days: { label: string; price: number }[] = [];
    const today = new Date();
    for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const multiplier = getMultiplierForDate(entityKey, d);
      days.push({
        label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        price: Math.round(basePrice * multiplier),
      });
    }
    return days;
  }, [entityKey, basePrice]);

  const livePrice = Math.round(
    basePrice * (todayBreakdown.clampedMultiplier + liveNudge)
  );
  const currentPrice = freeze ? freeze.price : livePrice;

  useEffect(() => {
    setFreeze(loadFreeze(entityKey));
  }, [entityKey]);

  useEffect(() => {
    onPriceChange(currentPrice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrice]);

  // Simulate real-time demand fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveNudge((Math.random() - 0.5) * 0.06); // ±3% live jitter
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Keep freeze countdown ticking
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleFreeze = () => {
    const newFreeze: PriceFreeze = {
      price: livePrice,
      frozenAt: Date.now(),
      expiresAt: Date.now() + FREEZE_DURATION_MS,
    };
    try {
      window.localStorage.setItem(
        `mmt_price_freeze_${entityKey}`,
        JSON.stringify(newFreeze)
      );
      setFreeze(newFreeze);
    } catch {
      // ignore storage errors
    }
  };

  const handleUnfreeze = () => {
    try {
      window.localStorage.removeItem(`mmt_price_freeze_${entityKey}`);
    } catch {
      // ignore
    }
    setFreeze(null);
  };

  const maxPrice = Math.max(...history.map((h) => h.price), currentPrice);
  const minPrice = Math.min(...history.map((h) => h.price), currentPrice);
  const range = Math.max(1, maxPrice - minPrice);

  const chartWidth = 560;
  const chartHeight = 120;
  const points = history.map((h, i) => {
    const x = (i / (history.length - 1)) * chartWidth;
    const y = chartHeight - ((h.price - minPrice) / range) * chartHeight;
    return `${x},${y}`;
  });

  const priceVsBase = currentPrice - basePrice;
  const priceVsBasePercent = Math.round((priceVsBase / basePrice) * 100);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-lg font-bold flex items-center">
          {priceVsBase >= 0 ? (
            <TrendingUp className="w-5 h-5 mr-2 text-red-500" />
          ) : (
            <TrendingDown className="w-5 h-5 mr-2 text-green-500" />
          )}
          Live Pricing
        </h2>
        {freeze && (
          <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
            <Snowflake className="w-3.5 h-3.5" />
            Price frozen — {formatTimeLeft(freeze.expiresAt - now)} left
          </span>
        )}
      </div>

      <div className="flex items-end justify-between flex-wrap gap-4 mb-4">
        <div>
          <p className="text-3xl font-bold">
            ₹{currentPrice.toLocaleString("en-IN")}
            <span className="text-sm font-normal text-gray-400 ml-1">
              {unitLabel}
            </span>
          </p>
          <p
            className={`text-xs font-medium mt-1 ${
              priceVsBase >= 0 ? "text-red-500" : "text-green-600"
            }`}
          >
            {priceVsBase >= 0 ? "+" : ""}
            {priceVsBasePercent}% vs standard fare (₹{basePrice.toLocaleString("en-IN")})
          </p>
          <button
            onClick={() => setShowBreakdown((s) => !s)}
            className="text-xs text-blue-600 hover:text-blue-700 underline underline-offset-2 mt-1"
          >
            {showBreakdown ? "Hide" : "Why this price?"}
          </button>
        </div>

        {!freeze ? (
          <button
            onClick={handleFreeze}
            className="flex items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Snowflake className="w-4 h-4" />
            Freeze this price for 24h
          </button>
        ) : (
          <button
            onClick={handleUnfreeze}
            className="flex items-center gap-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Clock className="w-4 h-4" />
            Unfreeze &amp; use live price
          </button>
        )}
      </div>

      {showBreakdown && (
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-4 text-xs text-gray-600 space-y-1.5">
          <p className="font-semibold text-gray-700 mb-1">
            Today's price is built from:
          </p>
          <div className="flex justify-between">
            <span>Standard fare</span>
            <span>₹{basePrice.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span>Weekend demand</span>
            <span>{todayBreakdown.weekend > 0 ? `+${Math.round(todayBreakdown.weekend * 100)}%` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Seasonal (peak travel months)</span>
            <span>{todayBreakdown.season > 0 ? `+${Math.round(todayBreakdown.season * 100)}%` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Current demand signal</span>
            <span>
              {todayBreakdown.demand >= 0 ? "+" : ""}
              {Math.round(todayBreakdown.demand * 100)}%
            </span>
          </div>
          {todayBreakdown.guardrailApplied && (
            <p className="text-purple-600 pt-1">
              A price guardrail was applied — this fare is capped between{" "}
              {Math.round(FLOOR_MULTIPLIER * 100)}% and{" "}
              {Math.round(CEILING_MULTIPLIER * 100)}% of the standard fare, so it never runs away
              regardless of demand.
            </p>
          )}
        </div>
      )}

      {/* Price history chart */}
      <div className="mb-2">
        <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Price trend — last {HISTORY_DAYS} days
        </p>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-28"
          preserveAspectRatio="none"
        >
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          {history.map((h, i) => {
            const [x, y] = points[i].split(",").map(Number);
            return <circle key={i} cx={x} cy={y} r="2.5" fill="#3b82f6" />;
          })}
        </svg>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>{history[0].label}</span>
          <span>{history[Math.floor(history.length / 2)].label}</span>
          <span>{history[history.length - 1].label}</span>
        </div>
      </div>

      <p className="text-[11px] text-gray-400">
        Prices adjust automatically with demand, day of week, and seasonal
        trends, always within a {Math.round(FLOOR_MULTIPLIER * 100)}%–
        {Math.round(CEILING_MULTIPLIER * 100)}% guardrail of the standard fare.
        Freezing locks in today's price for 24 hours regardless of future
        changes.
      </p>
    </div>
  );
};

export default DynamicPricing;
