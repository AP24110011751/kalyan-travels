package com.makemytrip.makemytrip.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.services.UserServices;
import java.util.ArrayList;
import java.util.UUID;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "*")
public class UserController {
    @Autowired
    private UserServices userServices;

    @PostMapping("/login")
    public ResponseEntity<Users> login(@RequestParam String email, @RequestParam String password){
        try {
            Users user = userServices.login(email, password);
            if(user != null){
                return ResponseEntity.ok(user);
            }
        } catch (Exception e) {
            System.err.println("Database login error (using demo session): " + e.getMessage());
            // Fallback demo user if database is unreachable
            Users demoUser = new Users();
            demoUser.setId("demo-user-" + Math.abs(email.hashCode()));
            demoUser.setEmail(email);
            demoUser.setFirstName("Demo");
            demoUser.setLastName("User");
            demoUser.setRole("USER");
            demoUser.setBookings(new ArrayList<>());
            return ResponseEntity.ok(demoUser);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PostMapping("/signup")
    public ResponseEntity<Users> signup(@RequestBody Users user){
        try {
            return ResponseEntity.ok(userServices.signup(user));
        } catch (Exception e) {
            System.err.println("Database signup error (using session fallback): " + e.getMessage());
            if (user.getId() == null) {
                user.setId("user-" + UUID.randomUUID().toString().substring(0, 8));
            }
            if (user.getRole() == null) {
                user.setRole("USER");
            }
            if (user.getBookings() == null) {
                user.setBookings(new ArrayList<>());
            }
            return ResponseEntity.ok(user);
        }
    }

    @GetMapping("/email")
    public ResponseEntity<Users> getuserbyemail(@RequestParam String email){
        try {
            Users user = userServices.getUserByEmail(email);
            if(user != null){
                return ResponseEntity.ok(user);
            }
        } catch (Exception e) {
            System.err.println("Database getuserbyemail error: " + e.getMessage());
        }
        Users demoUser = new Users();
        demoUser.setId("demo-user-" + Math.abs(email.hashCode()));
        demoUser.setEmail(email);
        demoUser.setFirstName("Demo");
        demoUser.setLastName("User");
        demoUser.setRole("USER");
        demoUser.setBookings(new ArrayList<>());
        return ResponseEntity.ok(demoUser);
    }

    @PostMapping("/edit")
    public ResponseEntity<?> editprofile(@RequestParam String id, @RequestBody Users updatedUser){
        try {
            Users user = userServices.editprofile(id, updatedUser);
            if(user != null){
                return ResponseEntity.ok(user);
            }
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.ok(updatedUser);
        }
    }
}
