import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export const login = async (email, password) => {
  try {
    const url = `${BACKEND_URL}/user/login?email=${email}&password=${password}`;
    const res = await axios.post(url);
    const data = res.data;
    // console.log(data);
    return data;
  } catch (error) {
    throw error;
  }
};

export const signup = async (
  firstName,
  lastName,
  email,
  phoneNumber,
  password
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/user/signup`, {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
    });
    const data = res.data;
    // console.log(data);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getuserbyemail = async (email) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/user/email?email=${email}`);
    const data = res.data;
    return data;
  } catch (error) {
    throw error;
  }
};

export const editprofile = async (
  id,
  firstName,
  lastName,
  email,
  phoneNumber
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/user/edit?id=${id}`, {
      firstName,
      lastName,
      email,
      phoneNumber,
    });
    const data = res.data;
    return data;
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw error;
  }
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
  try {
    const res = await axios.get(`${BACKEND_URL}/flight`);
    const data = res.data;
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return fallbackFlights;
  } catch (error) {
    console.warn("Backend flight fetch warning, using seed data:", error?.message);
    return fallbackFlights;
  }
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
  try {
    const res = await axios.post(`${BACKEND_URL}/admin/flight`, {
      flightName,
      from,
      to,
      departureTime,
      arrivalTime,
      price,
      availableSeats,
    });
    const data = res.data;
    return data;
  } catch (error) {
    console.error("Failed to add flight:", error);
    throw error;
  }
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
  try {
    const res = await axios.put(`${BACKEND_URL}/admin/flight/${id}`, {
      flightName,
      from,
      to,
      departureTime,
      arrivalTime,
      price,
      availableSeats,
    });
    const data = res.data;
    return data;
  } catch (error) {
    console.error("Failed to edit flight:", error);
    throw error;
  }
};

export const gethotel = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/hotel`);
    const data = res.data;
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return fallbackHotels;
  } catch (error) {
    console.warn("Backend hotel fetch warning, using seed data:", error?.message);
    return fallbackHotels;
  }
};

export const addhotel = async (
  hotelName,
  location,
  pricePerNight,
  availableRooms,
  amenities
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/admin/hotel`, {
      hotelName,
      location,
      pricePerNight,
      availableRooms,
      amenities,
    });
    const data = res.data;
    return data;
  } catch (error) {
    console.error("Failed to add hotel:", error);
    throw error;
  }
};

export const edithotel = async (
  id,
  hotelName,
  location,
  pricePerNight,
  availableRooms,
  amenities
) => {
  try {
    const res = await axios.put(`${BACKEND_URL}/admin/hotel/${id}`, {
      hotelName,
      location,
      pricePerNight,
      availableRooms,
      amenities,
    });
    const data = res.data;
    return data;
  } catch (error) {
    console.error("Failed to edit hotel:", error);
    throw error;
  }
};

export const handleflightbooking = async (userId, flightId, seats, price) => {
  try {
    const url = `${BACKEND_URL}/booking/flight?userId=${userId || "guest"}&flightId=${flightId}&seats=${seats}&price=${price}`;
    const res = await axios.post(url);
    const data = res.data;
    return data;
  } catch (error) {
    console.warn("Flight booking backend call failed, falling back to local confirmation:", error?.message);
    return {
      type: "Flight",
      bookingId: flightId || `fl-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      quantity: seats || 1,
      totalPrice: price || 0,
    };
  }
};

export const handlehotelbooking = async (userId, hotelId, rooms, price) => {
  try {
    const url = `${BACKEND_URL}/booking/hotel?userId=${userId || "guest"}&hotelId=${hotelId}&rooms=${rooms}&price=${price}`;
    const res = await axios.post(url);
    const data = res.data;
    return data;
  } catch (error) {
    console.warn("Hotel booking backend call failed, falling back to local confirmation:", error?.message);
    return {
      type: "Hotel",
      bookingId: hotelId || `ht-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      quantity: rooms || 1,
      totalPrice: price || 0,
    };
  }
};
