import { useEffect, useMemo, useState } from "react";
import { Armchair, Info, Star } from "lucide-react";

interface SeatMapProps {
  flightId: string;
  seatsNeeded: number;
  onChange: (seats: string[], extraCost: number) => void;
}

type SeatCategory = "business" | "premium" | "economy";

interface SeatCategoryConfig {
  label: string;
  extraCost: number;
  className: string;
  legend: string;
}

const CATEGORY_CONFIG: Record<SeatCategory, SeatCategoryConfig> = {
  business: {
    label: "Business",
    extraCost: 2500,
    className: "bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200",
    legend: "bg-purple-100 border-purple-300",
  },
  premium: {
    label: "Premium Economy",
    extraCost: 800,
    className: "bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200",
    legend: "bg-blue-100 border-blue-300",
  },
  economy: {
    label: "Economy",
    extraCost: 0,
    className: "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200",
    legend: "bg-gray-100 border-gray-300",
  },
};

const COLUMNS = ["A", "B", "C", "D", "E", "F"];
const TOTAL_ROWS = 18;

const getCategory = (row: number): SeatCategory => {
  if (row <= 2) return "business";
  if (row <= 6) return "premium";
  return "economy";
};

// Deterministic pseudo-random occupancy so the map stays stable per flight/session
const hashSeed = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const isOccupied = (flightId: string, seatLabel: string): boolean => {
  const seed = hashSeed(flightId + seatLabel);
  return seed % 100 < 28; // ~28% of seats pre-occupied
};

const PREF_KEY_PREFIX = "mmt_seat_pref_";

const SeatMap = ({ flightId, seatsNeeded, onChange }: SeatMapProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [savedPref, setSavedPref] = useState<SeatCategory | null>(null);

  const initialOccupied = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (let row = 1; row <= TOTAL_ROWS; row++) {
      for (const col of COLUMNS) {
        const label = `${row}${col}`;
        map[label] = isOccupied(flightId, label);
      }
    }
    return map;
  }, [flightId]);

  const [occupiedMap, setOccupiedMap] = useState<Record<string, boolean>>(initialOccupied);

  useEffect(() => {
    setOccupiedMap(initialOccupied);
  }, [initialOccupied]);

  // Simulate other travellers booking seats in real time
  useEffect(() => {
    const interval = setInterval(() => {
      setOccupiedMap((prev) => {
        const freeSeats = Object.keys(prev).filter(
          (label) => !prev[label] && !selected.includes(label)
        );
        if (freeSeats.length === 0) return prev;
        const randomSeat = freeSeats[Math.floor(Math.random() * freeSeats.length)];
        return { ...prev, [randomSeat]: true };
      });
    }, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    // Load saved seat-type preference for this browser/user
    try {
      const pref = window.localStorage.getItem(PREF_KEY_PREFIX + "type");
      if (pref) setSavedPref(pref as SeatCategory);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Reset selection if the number of tickets changes below current selection
    if (selected.length > seatsNeeded) {
      setSelected((prev) => prev.slice(0, seatsNeeded));
    }
  }, [seatsNeeded]);

  useEffect(() => {
    const extra = selected.reduce((sum, label) => {
      const row = parseInt(label);
      return sum + CATEGORY_CONFIG[getCategory(row)].extraCost;
    }, 0);
    onChange(selected, extra);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const toggleSeat = (label: string) => {
    if (occupiedMap[label]) return;
    setSelected((prev) => {
      if (prev.includes(label)) {
        return prev.filter((s) => s !== label);
      }
      if (prev.length >= seatsNeeded) {
        return prev; // already picked enough seats
      }
      return [...prev, label];
    });
  };

  const savePreference = () => {
    if (selected.length === 0) return;
    const lastRow = parseInt(selected[selected.length - 1]);
    const category = getCategory(lastRow);
    try {
      window.localStorage.setItem(PREF_KEY_PREFIX + "type", category);
      setSavedPref(category);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-lg font-bold flex items-center">
          <Armchair className="w-5 h-5 mr-2 text-blue-600" />
          Choose Your Seats
        </h2>
        <span className="text-sm text-gray-500">
          {selected.length}/{seatsNeeded} seat{seatsNeeded > 1 ? "s" : ""} selected
        </span>
      </div>

      {savedPref && (
        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-4">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          You usually pick {CATEGORY_CONFIG[savedPref].label} seats — look for the
          highlighted rows below.
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-5 text-xs">
        {(Object.keys(CATEGORY_CONFIG) as SeatCategory[]).map((cat) => (
          <div key={cat} className="flex items-center gap-1.5">
            <span
              className={`w-4 h-4 rounded border ${CATEGORY_CONFIG[cat].legend}`}
            />
            <span className="text-gray-600">
              {CATEGORY_CONFIG[cat].label}
              {CATEGORY_CONFIG[cat].extraCost > 0 &&
                ` (+₹${CATEGORY_CONFIG[cat].extraCost.toLocaleString("en-IN")})`}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-gray-300 border border-gray-400" />
          <span className="text-gray-600">Occupied</span>
        </div>
      </div>

      {/* Seat grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[420px]">
          {Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1).map((row) => {
            const category = getCategory(row);
            return (
              <div key={row} className="flex items-center gap-2 mb-1.5">
                <span className="w-5 text-xs text-gray-400 text-right">{row}</span>
                <div className="flex gap-1.5">
                  {COLUMNS.slice(0, 3).map((col) => {
                    const label = `${row}${col}`;
                    const occupied = occupiedMap[label];
                    const isSelected = selected.includes(label);
                    return (
                      <button
                        key={label}
                        disabled={occupied}
                        onClick={() => toggleSeat(label)}
                        title={
                          occupied
                            ? "Occupied"
                            : `${label} — ${CATEGORY_CONFIG[category].label}`
                        }
                        className={`w-8 h-8 rounded border text-[10px] font-semibold flex items-center justify-center transition-colors ${
                          occupied
                            ? "bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed"
                            : isSelected
                            ? "bg-green-500 border-green-600 text-white"
                            : CATEGORY_CONFIG[category].className
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
                <div className="w-4" />
                <div className="flex gap-1.5">
                  {COLUMNS.slice(3).map((col) => {
                    const label = `${row}${col}`;
                    const occupied = occupiedMap[label];
                    const isSelected = selected.includes(label);
                    return (
                      <button
                        key={label}
                        disabled={occupied}
                        onClick={() => toggleSeat(label)}
                        title={
                          occupied
                            ? "Occupied"
                            : `${label} — ${CATEGORY_CONFIG[category].label}`
                        }
                        className={`w-8 h-8 rounded border text-[10px] font-semibold flex items-center justify-center transition-colors ${
                          occupied
                            ? "bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed"
                            : isSelected
                            ? "bg-green-500 border-green-600 text-white"
                            : CATEGORY_CONFIG[category].className
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
                {category !== "economy" && (
                  <span className="ml-2 flex items-center gap-1 text-[10px] text-gray-400">
                    <Star className="w-3 h-3" />
                    {CATEGORY_CONFIG[category].label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500">
          Selected: {selected.length > 0 ? selected.join(", ") : "None"}
        </p>
        <button
          onClick={savePreference}
          disabled={selected.length === 0}
          className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-not-allowed font-medium"
        >
          Save as my preferred seat type
        </button>
      </div>
    </div>
  );
};

export default SeatMap;
