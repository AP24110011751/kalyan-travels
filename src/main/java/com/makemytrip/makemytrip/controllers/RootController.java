package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.Hotel;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.HotelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class RootController {
    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private FlightRepository flightRepository;

    @GetMapping("/")
    public String home() {
        return "✅ It's running on port 8080!";
    }

    @GetMapping("/hotel")
    public ResponseEntity<List<Hotel>> getallhotel(){
        try {
            List<Hotel> hotels = hotelRepository.findAll();
            if (hotels != null && !hotels.isEmpty()) {
                return ResponseEntity.ok(hotels);
            }
        } catch (Exception e) {
            System.err.println("Database unreachable for hotels (using seed fallback): " + e.getMessage());
        }
        return ResponseEntity.ok(getDefaultHotels());
    }

    @GetMapping("/flight")
    public ResponseEntity<List<Flight>> getallflights(){
        try {
            List<Flight> flights = flightRepository.findAll();
            if (flights != null && !flights.isEmpty()) {
                return ResponseEntity.ok(flights);
            }
        } catch (Exception e) {
            System.err.println("Database unreachable for flights (using seed fallback): " + e.getMessage());
        }
        return ResponseEntity.ok(getDefaultFlights());
    }

    private List<Hotel> getDefaultHotels() {
        List<Hotel> list = new ArrayList<>();

        Hotel h1 = new Hotel();
        h1.setId("hotel-1");
        h1.setHotelName("Magnum Resorts - Near Candolim Beach");
        h1.setLocation("Goa");
        h1.setPricePerNight(4500);
        h1.setAvailableRooms(15);
        h1.setAmenities("Swimming Pool, Wi-Fi, Restaurant, Bar, Power Backup");
        list.add(h1);

        Hotel h2 = new Hotel();
        h2.setId("hotel-2");
        h2.setHotelName("The Grand Palace");
        h2.setLocation("New Delhi");
        h2.setPricePerNight(6800);
        h2.setAvailableRooms(25);
        h2.setAmenities("Free Wi-Fi, Spa, Gym, Airport Shuttle, Multi-Cuisine Restaurant");
        list.add(h2);

        Hotel h3 = new Hotel();
        h3.setId("hotel-3");
        h3.setHotelName("Seaside Luxury Hotel");
        h3.setLocation("Mumbai");
        h3.setPricePerNight(8200);
        h3.setAvailableRooms(10);
        h3.setAmenities("Sea View, Infinity Pool, Multi-Cuisine Dining, Beach Access");
        list.add(h3);

        return list;
    }

    private List<Flight> getDefaultFlights() {
        List<Flight> list = new ArrayList<>();

        Flight f1 = new Flight();
        f1.setId("flight-1");
        f1.setFlightName("IndiGo 6E-204");
        f1.setFrom("Bengaluru");
        f1.setTo("New Delhi");
        f1.setDepartureTime("2026-11-10T06:00:00");
        f1.setArrivalTime("2026-11-10T08:45:00");
        f1.setPrice(4500);
        f1.setAvailableSeats(45);
        list.add(f1);

        Flight f2 = new Flight();
        f2.setId("flight-2");
        f2.setFlightName("Air India AI-505");
        f2.setFrom("Mumbai");
        f2.setTo("Bengaluru");
        f2.setDepartureTime("2026-11-10T09:30:00");
        f2.setArrivalTime("2026-11-10T11:15:00");
        f2.setPrice(3800);
        f2.setAvailableSeats(60);
        list.add(f2);

        Flight f3 = new Flight();
        f3.setId("flight-3");
        f3.setFlightName("Vistara UK-812");
        f3.setFrom("New Delhi");
        f3.setTo("Goa");
        f3.setDepartureTime("2026-11-10T14:00:00");
        f3.setArrivalTime("2026-11-10T16:30:00");
        f3.setPrice(5200);
        f3.setAvailableSeats(30);
        list.add(f3);

        return list;
    }
}
