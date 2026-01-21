//package com.hospital_system.hospital.controller;
//
//import com.hospital_system.hospital.entity.Cashier;
//import com.hospital_system.hospital.service.CashierService;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.Optional;
//
//@RestController
//@RequestMapping("/api/cashier")
//public class CashierController {
//
//    @Autowired
//    private CashierService cashierService;
//
//    // Get all cashiers
//    @GetMapping("/all")
//    public Iterable<Cashier> getAll() {
//        return cashierService.getAllCashiers();
//    }
//
//    // Add new cashier
//    @PostMapping("/add")
//    public Cashier add(@RequestBody Cashier cashier) {
//        return cashierService.saveCashier(cashier);
//    }
//
//    // Delete cashier
//    @DeleteMapping("/delete/{id}")
//    public String delete(@PathVariable Long id) {
//        cashierService.deleteCashier(id);
//        return "Cashier deleted!";
//    }
//
//    // Login cashier
//    @PostMapping("/login")
//    public String login(@RequestParam String username, @RequestParam String password) {
//        Optional<Cashier> cashier = cashierService.findByUsername(username);
//        if(cashier.isPresent() && cashier.get().getPassword().equals(password)) {
//            return "Login Success";
//        }
//        return "Invalid username or password";
//    }
//}