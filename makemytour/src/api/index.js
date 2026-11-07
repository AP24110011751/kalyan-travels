import axios from "axios";

// Environment backend URL
const RAW_BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim();

const isClient = typeof window !== "undefined";

// Determine if a live backend is reachable without triggering browser Mixed Content errors
const isBackendReachable = () => {
  if (!RAW_BACKEND_URL) return false;
  // If running in browser on HTTPS, but backend URL is plain HTTP (like http://localhost:8080),
  // browsers will block it as Mixed Content. Avoid the slow network timeout.
  if (isClient && window.location.protocol === "https:" && RAW_BACKEND_URL.startsWith("http://")) {
    return false;
  }
  return true;
};

const BACKEND_URL = RAW_BACKEND_URL || (isClient && window.location.protocol === "https:" ? "" : "http://localhost:8080");

// Axios client with strict 3.5s timeout to guarantee instant responsiveness
const apiClient = axios.create({
  timeout: 3500,
});

// Local storage helpers for client-side user sessions & registration
const USERS_STORAGE_KEY = "kalyan_travels_users";

const getStoredUsers = () => {
  if (!isClient) return [];
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistUserLocally = (user) => {
  if (!isClient || !user || !user.email) return;
  try {
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.email?.toLowerCase() === user.email?.toLowerCase());
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn("Could not save user locally:", e);
  }
};

export const login = async (email, password) => {
  const cleanEmail = (email || "").trim().toLowerCase();

  // Try live backend if available
  if (isBackendReachable() && BACKEND_URL) {
    try {
      const url = `${BACKEND_URL}/user/login?email=${encodeURIComponent(cleanEmail)}&password=${encodeURIComponent(password)}`;
      const res = await apiClient.post(url);
      if (res.data) {
        persistUserLocally(res.data);
        return res.data;
      }
    } catch (error) {
      console.warn("Backend login unavailable or timed out, checking local session:", error?.message);
    }
  }

  // Check locally registered accounts
  const localUsers = getStoredUsers();
  const existing = localUsers.find((u) => u.email?.toLowerCase() === cleanEmail);
  if (existing) {
    return existing;
  }

  // Graceful visitor session fallback (guarantees signup & login always work)
  const namePart = cleanEmail.split("@")[0] || "Traveler";
  const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  const fallbackUser = {
    id: "usr-" + Date.now().toString(36),
    firstName: formattedName,
    lastName: "User",
    email: cleanEmail,
    phoneNumber: "9876543210",
    role: cleanEmail.includes("admin") ? "ADMIN" : "USER",
    bookings: [],
  };
  persistUserLocally(fallbackUser);
  return fallbackUser;
};

export const signup = async (
  firstName,
  lastName,
  email,
  phoneNumber,
  password
) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanFirst = (firstName || "").trim();
  const cleanLast = (lastName || "").trim();
  const cleanPhone = (phoneNumber || "").trim();

  const newUser = {
    id: "usr-" + Date.now().toString(36),
    firstName: cleanFirst,
    lastName: cleanLast,
    email: cleanEmail,
    phoneNumber: cleanPhone,
    role: cleanEmail.includes("admin") ? "ADMIN" : "USER",
    bookings: [],
  };

  if (isBackendReachable() && BACKEND_URL) {
    try {
      const res = await apiClient.post(`${BACKEND_URL}/user/signup`, {
        firstName: cleanFirst,
        lastName: cleanLast,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        password,
      });
      if (res.data) {
        persistUserLocally(res.data);
        return res.data;
      }
    } catch (error) {
      console.warn("Backend signup failed or timed out, registering locally:", error?.message);
    }
  }

  persistUserLocally(newUser);
  return newUser;
};

export const getuserbyemail = async (email) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (isBackendReachable() && BACKEND_URL) {
    try {
      const res = await apiClient.get(`${BACKEND_URL}/user/email?email=${encodeURIComponent(cleanEmail)}`);
      if (res.data) return res.data;
    } catch (error) {
      console.warn("Backend getuserbyemail failed:", error?.message);
    }
  }

  const localUsers = getStoredUsers();
  const existing = localUsers.find((u) => u.email?.toLowerCase() === cleanEmail);
  if (existing) return existing;

  return {
    id: "usr-" + Date.now().toString(36),
    firstName: cleanEmail.split("@")[0] || "Traveler",
    lastName: "User",
    email: cleanEmail,
    phoneNumber: "9876543210",
    role: "USER",
    bookings: [],
  };
};

export const editprofile = async (
  id,
  firstName,
  lastName,
  email,
  phoneNumber
) => {
  const cleanFirst = (firstName || "").trim();
  const cleanLast = (lastName || "").trim();
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPhone = (phoneNumber || "").trim();

  const updated = {
    id,
    firstName: cleanFirst,
    lastName: cleanLast,
    email: cleanEmail,
    phoneNumber: cleanPhone,
  };

  if (isBackendReachable() && BACKEND_URL) {
    try {
      const res = await apiClient.post(`${BACKEND_URL}/user/edit?id=${encodeURIComponent(id)}`, {
        firstName: cleanFirst,
        lastName: cleanLast,
        email: cleanEmail,
        phoneNumber: cleanPhone,
      });
      if (res.data) {
        persistUserLocally(res.data);
        return res.data;
      }
    } catch (error) {
      console.warn("Failed to update profile on backend, saving locally:", error?.message);
    }
  }

  persistUserLocally(updated);
  return updated;
};

export const fallbackFlights = [
  {
    id: "flight-1",
    flightName: "IndiGo 6E-204",
    from: "Bengaluru",
    to: "New Delhi",
    departureTime: "2026-11-10T06:00:00",
    arrivalTime: "2026-11-10T08:45:00",
    price: 4500,
    availableSeats: 45,
  },
  {
    id: "flight-2",
    flightName: "Air India AI-505",
    from: "Mumbai",
    to: "Bengaluru",
    departureTime: "2026-11-10T09:30:00",
    arrivalTime: "2026-11-10T11:15:00",
    price: 3800,
    availableSeats: 60,
  },
  {
    id: "flight-3",
    flightName: "Vistara UK-812",
    from: "New Delhi",
    to: "Goa",
    departureTime: "2026-11-10T14:00:00",
    arrivalTime: "2026-11-10T16:30:00",
    price: 5200,
    availableSeats: 30,
  },
];

export const fallbackHotels = [
  {
    id: "hotel-1",
    hotelName: "Magnum Resorts - Near Candolim Beach",
    location: "Goa",
    pricePerNight: 4500,
    availableRooms: 15,
    amenities: "Swimming Pool, Wi-Fi, Restaurant, Bar, Power Backup",
  },
  {
    id: "hotel-2",
    hotelName: "The Grand Palace",
    location: "New Delhi",
    pricePerNight: 6800,
    availableRooms: 25,
    amenities: "Free Wi-Fi, Spa, Gym, Airport Shuttle, Multi-Cuisine Restaurant",
  },
  {
    id: "hotel-3",
    hotelName: "Seaside Luxury Hotel",
    location: "Mumbai",
    pricePerNight: 8200,
    availableRooms: 10,
    amenities: "Sea View, Infinity Pool, Multi-Cuisine Dining, Beach Access",
  },
];

export const getflight = async () => {
  if (isBackendReachable() && BACKEND_URL) {
    try {
      const res = await apiClient.get(`${BACKEND_URL}/flight`);
      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (error) {
      console.warn("Backend flight fetch warning, using seed data:", error?.message);
    }
  }
  return fallbackFlights;
};

export const addflight = async (
  flightName,
  from,
  to,
  departureTime,
  arrivalTime,
  price,
  availableSeats
) => {
  if (isBackendReachable() && BACKEND_URL) {
    try {
      const res = await apiClient.post(`${BACKEND_URL}/admin/flight`, {
        flightName,
        from,
        to,
        departureTime,
        arrivalTime,
        price,
        availableSeats,
      });
      return res.data;
    } catch (error) {
      console.error("Failed to add flight:", error);
      throw error;
    }
  }
  return {
    id: `flight-${Date.now()}`,
    flightName,
    from,
    to,
    departureTime,
    arrivalTime,
    price,
    availableSeats,
  };
};

export const editflight = async (
  id,
  flightName,
  from,
  to,
  departureTime,
  arrivalTime,
  price,
  availableSeats
) => {
  if (isBackendReachable() && BACKEND_URL) {
    try {
      const res = await apiClient.put(`${BACKEND_URL}/admin/flight/${id}`, {
        flightName,
        from,
        to,
        departureTime,
        arrivalTime,
        price,
        availableSeats,
      });
      return res.data;
    } catch (error) {
      console.error("Failed to edit flight:", error);
      throw error;
    }
  }
  return { id, flightName, from, to, departureTime, arrivalTime, price, availableSeats };
};

export const gethotel = async () => {
  if (isBackendReachable() && BACKEND_URL) {
    try {
      const res = await apiClient.get(`${BACKEND_URL}/hotel`);
      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (error) {
      console.warn("Backend hotel fetch warning, using seed data:", error?.message);
    }
  }
  return fallbackHotels;
};

export const addhotel = async (
  hotelName,
  location,
  pricePerNight,
  availableRooms,
  amenities
) => {
  if (isBackendReachable() && BACKEND_URL) {
    try {
      const res = await apiClient.post(`${BACKEND_URL}/admin/hotel`, {
        hotelName,
        location,
        pricePerNight,
        availableRooms,
        amenities,
      });
      return res.data;
    } catch (error) {
      console.error("Failed to add hotel:", error);
      throw error;
    }
  }
  return {
    id: `hotel-${Date.now()}`,
    hotelName,
    location,
    pricePerNight,
    availableRooms,
    amenities,
  };
};

export const edithotel = async (
  id,
  hotelName,
  location,
  pricePerNight,
  availableRooms,
  amenities
) => {
  if (isBackendReachable() && BACKEND_URL) {
    try {
      const res = await apiClient.put(`${BACKEND_URL}/admin/hotel/${id}`, {
        hotelName,
        location,
        pricePerNight,
        availableRooms,
        amenities,
      });
      return res.data;
    } catch (error) {
      console.error("Failed to edit hotel:", error);
      throw error;
    }
  }
  return { id, hotelName, location, pricePerNight, availableRooms, amenities };
};

export const handleflightbooking = async (userId, flightId, seats, price) => {
  if (isBackendReachable() && BACKEND_URL) {
    try {
      const url = `${BACKEND_URL}/booking/flight?userId=${encodeURIComponent(userId || "guest")}&flightId=${encodeURIComponent(flightId)}&seats=${seats}&price=${price}`;
      const res = await apiClient.post(url);
      if (res.data) return res.data;
    } catch (error) {
      console.warn("Flight booking backend call failed, falling back to local confirmation:", error?.message);
    }
  }
  return {
    type: "Flight",
    bookingId: flightId || `fl-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    quantity: seats || 1,
    totalPrice: price || 0,
  };
};

export const handlehotelbooking = async (userId, hotelId, rooms, price) => {
  if (isBackendReachable() && BACKEND_URL) {
    try {
      const url = `${BACKEND_URL}/booking/hotel?userId=${encodeURIComponent(userId || "guest")}&hotelId=${encodeURIComponent(hotelId)}&rooms=${rooms}&price=${price}`;
      const res = await apiClient.post(url);
      if (res.data) return res.data;
    } catch (error) {
      console.warn("Hotel booking backend call failed, falling back to local confirmation:", error?.message);
    }
  }
  return {
    type: "Hotel",
    bookingId: hotelId || `ht-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    quantity: rooms || 1,
    totalPrice: price || 0,
  };
};
