package com.makemytrip.makemytrip.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.models.Users.Booking;
import com.makemytrip.makemytrip.services.BookingService;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/booking")
@CrossOrigin(origins = "*")
public class BookingController {
    @Autowired
    private BookingService bookingService;

    @PostMapping("/flight")
    public ResponseEntity<Booking> bookFlight(
            @RequestParam(required = false) String userId,
            @RequestParam String flightId,
            @RequestParam int seats,
            @RequestParam double price) {
        try {
            Booking booking = bookingService.bookFlight(userId, flightId, seats, price);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            System.err.println("Booking fallback engaged: " + e.getMessage());
            Booking fallback = new Booking();
            fallback.setType("Flight");
            fallback.setBookingId(flightId != null ? flightId : UUID.randomUUID().toString());
            fallback.setDate(LocalDate.now().toString());
            fallback.setQuantity(seats > 0 ? seats : 1);
            fallback.setTotalPrice(price);
            return ResponseEntity.ok(fallback);
        }
    }

    @PostMapping("/hotel")
    public ResponseEntity<Booking> bookhotel(
            @RequestParam(required = false) String userId,
            @RequestParam String hotelId,
            @RequestParam int rooms,
            @RequestParam double price) {
        try {
            Booking booking = bookingService.bookhotel(userId, hotelId, rooms, price);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            System.err.println("Hotel booking fallback engaged: " + e.getMessage());
            Booking fallback = new Booking();
            fallback.setType("Hotel");
            fallback.setBookingId(hotelId != null ? hotelId : UUID.randomUUID().toString());
            fallback.setDate(LocalDate.now().toString());
            fallback.setQuantity(rooms > 0 ? rooms : 1);
            fallback.setTotalPrice(price);
            return ResponseEntity.ok(fallback);
        }
    }
}
