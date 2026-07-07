import { useEffect, useState } from "react";
import { BedDouble, Check, Info, Images } from "lucide-react";

interface RoomTypeGridProps {
  hotelId: string;
  basePricePerNight: number;
  roomsNeeded: number;
  onChange: (roomType: RoomTypeKey, extraCostPerRoom: number) => void;
}

type RoomTypeKey = "standard" | "deluxe" | "suite";

interface RoomTypeOption {
  key: RoomTypeKey;
  label: string;
  multiplier: number; // multiplier on base price per night
  description: string;
  amenities: string[];
  images: string[];
}

const ROOM_TYPES: RoomTypeOption[] = [
  {
    key: "standard",
    label: "Standard Room",
    multiplier: 1,
    description: "Comfortable room with all essential amenities.",
    amenities: ["Queen Bed", "Free Wi-Fi", "AC"],
    images: [
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600",
    ],
  },
  {
    key: "deluxe",
    label: "Deluxe Room",
    multiplier: 1.35,
    description: "Extra space, city view, and premium furnishings.",
    amenities: ["King Bed", "City View", "Mini Bar", "Free Wi-Fi"],
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600",
    ],
  },
  {
    key: "suite",
    label: "Premium Suite",
    multiplier: 1.8,
    description: "Separate living area, top-floor views, and 3D walkthrough preview.",
    amenities: ["King Bed", "Living Room", "Jacuzzi", "Butler Service"],
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=600",
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600",
    ],
  },
];

const PREF_KEY = "mmt_room_pref_type";

const seedFromString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const RoomCard = ({
  option,
  basePricePerNight,
  selected,
  onSelect,
  hotelId,
}: {
  option: RoomTypeOption;
  basePricePerNight: number;
  selected: boolean;
  onSelect: () => void;
  hotelId: string;
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const price = Math.round(basePricePerNight * option.multiplier);
  const extra = price - basePricePerNight;

  const [roomsLeft, setRoomsLeft] = useState(() => 3 + (seedFromString(hotelId + option.key) % 6));

  // Simulate real-time availability changes
  useEffect(() => {
    const interval = setInterval(() => {
      setRoomsLeft((prev) => {
        if (prev <= 1) return prev; // never fully sell out in this simulation
        return Math.random() > 0.5 ? prev - 1 : prev;
      });
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all cursor-pointer ${
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:shadow-md"
      }`}
      onClick={onSelect}
    >
      <div className="relative">
        <img
          src={option.images[photoIndex]}
          alt={option.label}
          className="w-full h-40 object-cover"
        />
        {option.images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPhotoIndex((i) => (i + 1) % option.images.length);
            }}
            className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1"
          >
            <Images className="w-3 h-3" />
            {photoIndex + 1}/{option.images.length} · 3D Preview
          </button>
        )}
        {selected && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
            <Check className="w-3.5 h-3.5" />
          </div>
        )}
        {option.key !== "standard" && (
          <span className="absolute top-2 left-2 bg-white/90 text-[10px] font-semibold px-2 py-0.5 rounded-full text-amber-600">
            Upgrade
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold">{option.label}</h3>
          <div className="text-right">
            <p className="font-bold">₹{price.toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-gray-400">per night</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-2">{option.description}</p>
        {extra > 0 && (
          <p className="text-xs text-amber-600 font-medium mb-2">
            +₹{extra.toLocaleString("en-IN")} vs Standard
          </p>
        )}
        <p className={`text-[11px] font-medium mb-2 ${roomsLeft <= 2 ? "text-red-500" : "text-green-600"}`}>
          {roomsLeft} room{roomsLeft > 1 ? "s" : ""} left at this rate
        </p>
        <div className="flex flex-wrap gap-1.5">
          {option.amenities.map((a) => (
            <span
              key={a}
              className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
            >
              {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const RoomTypeGrid = ({
  hotelId,
  basePricePerNight,
  roomsNeeded,
  onChange,
}: RoomTypeGridProps) => {
  const [selectedType, setSelectedType] = useState<RoomTypeKey>("standard");
  const [savedPref, setSavedPref] = useState<RoomTypeKey | null>(null);

  useEffect(() => {
    try {
      const pref = window.localStorage.getItem(PREF_KEY) as RoomTypeKey | null;
      if (pref) {
        setSavedPref(pref);
        setSelectedType(pref);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  useEffect(() => {
    const option = ROOM_TYPES.find((r) => r.key === selectedType)!;
    const extraPerRoom = Math.round(basePricePerNight * (option.multiplier - 1));
    onChange(selectedType, extraPerRoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, basePricePerNight]);

  const handleSelect = (key: RoomTypeKey) => {
    setSelectedType(key);
    try {
      window.localStorage.setItem(PREF_KEY, key);
      setSavedPref(key);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-lg font-bold flex items-center">
          <BedDouble className="w-5 h-5 mr-2 text-blue-600" />
          Choose Your Room Type
        </h2>
        <span className="text-sm text-gray-500">
          {roomsNeeded} room{roomsNeeded > 1 ? "s" : ""} × selected type
        </span>
      </div>

      {savedPref && (
        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-4">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          Pre-selected based on your saved preference: {ROOM_TYPES.find((r) => r.key === savedPref)?.label}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROOM_TYPES.map((option) => (
          <RoomCard
            key={option.key}
            option={option}
            basePricePerNight={basePricePerNight}
            selected={selectedType === option.key}
            onSelect={() => handleSelect(option.key)}
            hotelId={hotelId}
          />
        ))}
      </div>
    </div>
  );
};

export default RoomTypeGrid;
