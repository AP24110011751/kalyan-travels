import { useEffect, useState } from "react";
import {
  Plane,
  Clock,
  Bell,
  BellOff,
  Plus,
  X,
  RefreshCw,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Timer,
} from "lucide-react";

type FlightStatus = "On Time" | "Delayed" | "Boarding" | "Departed" | "Landed" | "Cancelled";

interface FlightStatusEntry {
  flightNo: string;
  airline: string;
  from: string;
  to: string;
  scheduledDeparture: string;
  estimatedDeparture: string;
  estimatedArrival: string;
  status: FlightStatus;
  gate: string;
  terminal: string;
  delayReason: string | null;
  delayMinutes: number;
  lastUpdated: string;
}

// Mock flight database
const MOCK_FLIGHTS: Record<string, Omit<FlightStatusEntry, "lastUpdated">> = {
  "AI-202": {
    flightNo: "AI-202",
    airline: "Air India",
    from: "Delhi (DEL)",
    to: "Mumbai (BOM)",
    scheduledDeparture: "08:00",
    estimatedDeparture: "08:00",
    estimatedArrival: "10:05",
    status: "On Time",
    gate: "12A",
    terminal: "T3",
    delayReason: null,
    delayMinutes: 0,
  },
  "6E-456": {
    flightNo: "6E-456",
    airline: "IndiGo",
    from: "Bengaluru (BLR)",
    to: "Hyderabad (HYD)",
    scheduledDeparture: "10:30",
    estimatedDeparture: "11:30",
    estimatedArrival: "12:15",
    status: "Delayed",
    gate: "5B",
    terminal: "T1",
    delayReason: "Air Traffic Congestion",
    delayMinutes: 60,
  },
  "SG-101": {
    flightNo: "SG-101",
    airline: "SpiceJet",
    from: "Chennai (MAA)",
    to: "Kolkata (CCU)",
    scheduledDeparture: "13:15",
    estimatedDeparture: "13:30",
    estimatedArrival: "15:45",
    status: "Boarding",
    gate: "8C",
    terminal: "T2",
    delayReason: "Late incoming aircraft",
    delayMinutes: 15,
  },
  "UK-833": {
    flightNo: "UK-833",
    airline: "Vistara",
    from: "Mumbai (BOM)",
    to: "Goa (GOI)",
    scheduledDeparture: "15:00",
    estimatedDeparture: "15:00",
    estimatedArrival: "16:10",
    status: "Departed",
    gate: "22D",
    terminal: "T2",
    delayReason: null,
    delayMinutes: 0,
  },
  "IX-747": {
    flightNo: "IX-747",
    airline: "Air India Express",
    from: "Kochi (COK)",
    to: "Dubai (DXB)",
    scheduledDeparture: "02:30",
    estimatedDeparture: "04:00",
    estimatedArrival: "06:00",
    status: "Delayed",
    gate: "3A",
    terminal: "T1",
    delayReason: "Technical inspection required",
    delayMinutes: 90,
  },
};

const STATUS_CONFIG: Record<FlightStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  "On Time": {
    color: "text-green-700",
    bg: "bg-green-100",
    icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  },
  Delayed: {
    color: "text-red-700",
    bg: "bg-red-100",
    icon: <AlertCircle className="w-4 h-4 text-red-600" />,
  },
  Boarding: {
    color: "text-blue-700",
    bg: "bg-blue-100",
    icon: <Plane className="w-4 h-4 text-blue-600" />,
  },
  Departed: {
    color: "text-gray-700",
    bg: "bg-gray-100",
    icon: <Plane className="w-4 h-4 text-gray-500" />,
  },
  Landed: {
    color: "text-purple-700",
    bg: "bg-purple-100",
    icon: <CheckCircle2 className="w-4 h-4 text-purple-600" />,
  },
  Cancelled: {
    color: "text-orange-700",
    bg: "bg-orange-100",
    icon: <X className="w-4 h-4 text-orange-600" />,
  },
};

// Simulate random status updates every 30 seconds
const simulateUpdate = (flight: FlightStatusEntry): FlightStatusEntry => {
  const rand = Math.random();
  if (flight.status === "Boarding" && rand > 0.6) {
    return { ...flight, status: "Departed", lastUpdated: new Date().toLocaleTimeString() };
  }
  if (flight.status === "Departed" && rand > 0.7) {
    return { ...flight, status: "Landed", lastUpdated: new Date().toLocaleTimeString() };
  }
  if (flight.status === "Delayed" && rand > 0.7) {
    return {
      ...flight,
      status: "Boarding",
      lastUpdated: new Date().toLocaleTimeString(),
      delayReason: flight.delayReason,
    };
  }
  return { ...flight, lastUpdated: new Date().toLocaleTimeString() };
};

const FlightStatusPage = () => {
  const [trackedFlights, setTrackedFlights] = useState<FlightStatusEntry[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [notifications, setNotifications] = useState<string[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load default flights on first visit
    const defaults = ["AI-202", "6E-456", "SG-101"];
    const initial: FlightStatusEntry[] = defaults.map((code) => ({
      ...MOCK_FLIGHTS[code],
      lastUpdated: new Date().toLocaleTimeString(),
    }));
    setTrackedFlights(initial);
  }, []);

  // Auto-refresh every 30 seconds to simulate live updates
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setTrackedFlights((prev) => {
        const updated = prev.map((f) => simulateUpdate(f));
        // Check for status changes and push notifications
        updated.forEach((newF, i) => {
          if (prev[i] && newF.status !== prev[i].status) {
            const msg = `${newF.flightNo}: Status changed to ${newF.status}`;
            setNotifications((n) => [msg, ...n].slice(0, 5));
            if (notifEnabled && "Notification" in window && Notification.permission === "granted") {
              new Notification(`Kalyan Travels Flight Update`, { body: msg });
            }
          }
        });
        return updated;
      });
      setLastRefresh(new Date().toLocaleTimeString());
    }, 30000);
    return () => clearInterval(interval);
  }, [mounted, notifEnabled]);

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      setNotifEnabled(true);
    } else {
      const perm = await Notification.requestPermission();
      if (perm === "granted") setNotifEnabled(true);
    }
  };

  const handleAddFlight = () => {
    const code = searchInput.trim().toUpperCase();
    if (!code) return;

    if (trackedFlights.find((f) => f.flightNo === code)) {
      setSearchError("Flight already being tracked.");
      return;
    }

    const found = MOCK_FLIGHTS[code];
    if (!found) {
      setSearchError(`Flight "${code}" not found. Try: AI-202, 6E-456, SG-101, UK-833, IX-747`);
      return;
    }

    setTrackedFlights((prev) => [
      ...prev,
      { ...found, lastUpdated: new Date().toLocaleTimeString() },
    ]);
    setSearchInput("");
    setSearchError("");
  };

  const handleRemoveFlight = (flightNo: string) => {
    setTrackedFlights((prev) => prev.filter((f) => f.flightNo !== flightNo));
  };

  const handleManualRefresh = () => {
    setTrackedFlights((prev) => prev.map((f) => simulateUpdate(f)));
    setLastRefresh(new Date().toLocaleTimeString());
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Plane className="w-7 h-7 text-blue-600" />
              Live Flight Status
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Real-time updates for your tracked flights
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Last updated: {lastRefresh}
            </span>
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-1 text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={notifEnabled ? () => setNotifEnabled(false) : handleEnableNotifications}
              className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                notifEnabled
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {notifEnabled ? (
                <><Bell className="w-4 h-4" /> Notifications On</>
              ) : (
                <><BellOff className="w-4 h-4" /> Enable Notifications</>
              )}
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1">
              <Bell className="w-4 h-4" /> Recent Alerts
            </h3>
            <ul className="space-y-1">
              {notifications.map((n, i) => (
                <li key={i} className="text-sm text-blue-600">• {n}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Search / Add Flight */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h2 className="text-base font-semibold mb-3">Track a Flight</h2>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setSearchError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleAddFlight()}
              placeholder="Enter flight number e.g. 6E-456"
              className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleAddFlight}
              className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Flight
            </button>
          </div>
          {searchError && (
            <p className="text-red-500 text-xs mt-2">{searchError}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Available: AI-202, 6E-456, SG-101, UK-833, IX-747
          </p>
        </div>

        {/* Flight Cards */}
        {trackedFlights.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Plane className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No flights tracked yet. Add a flight number above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trackedFlights.map((flight) => {
              const config = STATUS_CONFIG[flight.status];
              return (
                <div
                  key={flight.flightNo}
                  className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
                >
                  {/* Top Row */}
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <Plane className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{flight.flightNo}</p>
                        <p className="text-sm text-gray-500">{flight.airline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
                        {config.icon}
                        {flight.status}
                        {flight.delayMinutes > 0 && ` (+${flight.delayMinutes}m)`}
                      </span>
                      <button
                        onClick={() => handleRemoveFlight(flight.flightNo)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <p className="font-bold text-lg">{flight.scheduledDeparture}</p>
                      <p className="text-xs text-gray-500">{flight.from}</p>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <Plane className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg">{flight.estimatedArrival}</p>
                      <p className="text-xs text-gray-500">{flight.to}</p>
                    </div>
                  </div>

                  {/* Details Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-xs text-gray-400 mb-0.5">Gate</p>
                      <p className="font-semibold">{flight.gate}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-xs text-gray-400 mb-0.5">Terminal</p>
                      <p className="font-semibold">{flight.terminal}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-xs text-gray-400 mb-0.5">Est. Departure</p>
                      <p className={`font-semibold ${flight.delayMinutes > 0 ? "text-red-600" : "text-green-600"}`}>
                        {flight.estimatedDeparture}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-xs text-gray-400 mb-0.5">Last Updated</p>
                      <p className="font-semibold text-xs">{flight.lastUpdated}</p>
                    </div>
                  </div>

                  {/* Delay Reason */}
                  {flight.delayReason && (
                    <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-700">
                      <Timer className="w-4 h-4 flex-shrink-0" />
                      <span>
                        <strong>Delay Reason:</strong> {flight.delayReason}. Revised departure at {flight.estimatedDeparture}.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightStatusPage;
