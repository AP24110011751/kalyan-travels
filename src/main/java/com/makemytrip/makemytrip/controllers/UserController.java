package com.makemytrip.makemytrip.controllers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.services.UserServices;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "*")
public class UserController {
    @Autowired
    private UserServices userServices;

    @PostMapping("/login")
    public ResponseEntity<Users> login(@RequestParam String email, @RequestParam String password){
        Users user = userServices.login(email, password);
        if(user != null){
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    @PostMapping("/signup")
    public ResponseEntity<Users> signup(@RequestBody Users user){
        return ResponseEntity.ok(userServices.signup(user));
    }
    @GetMapping("/email")
    public ResponseEntity<Users> getuserbyemail(@RequestParam String email){
        Users user = userServices.getUserByEmail(email);
        if(user != null){
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }
    @PostMapping("/edit")
    public ResponseEntity<?> editprofile(@RequestParam String id, @RequestBody Users updatedUser){
        try {
            Users user = userServices.editprofile(id, updatedUser);
            if(user != null){
                return ResponseEntity.ok(user);
            }
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}