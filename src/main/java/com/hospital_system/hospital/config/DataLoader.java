//package com.hospital_system.hospital.config;
//
//import com.hospital_system.hospital.entity.Role;
//import com.hospital_system.hospital.entity.User;
//import com.hospital_system.hospital.repository.UserRepository;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Component;
//
//@Component
//public class DataLoader implements CommandLineRunner {
//
//    @Autowired
//    private UserRepository userRepository;
//
//    @Autowired
//    private PasswordEncoder passwordEncoder;
//
//    @Override
//    public void run(String... args) throws Exception {
//        // Create default admin user if not exists
//        if (!userRepository.existsByUsername("admin")) {
//            User admin = new User(
//                    "System Administrator",
//                    "admin",
//                    passwordEncoder.encode("admin123"),
//                    Role.ADMIN
//            );
//            userRepository.save(admin);
//            System.out.println("✅ Default admin user created!");
//            System.out.println("   Username: admin");
//            System.out.println("   Password: admin123");
//        }
//
//        // Create sample receptionist
//        if (!userRepository.existsByUsername("receptionist")) {
//            User receptionist = new User(
//                    "Jane Receptionist",
//                    "receptionist",
//                    passwordEncoder.encode("rec123"),
//                    Role.RECEPTIONIST
//            );
//            userRepository.save(receptionist);
//            System.out.println("✅ Sample receptionist created!");
//            System.out.println("   Username: receptionist");
//            System.out.println("   Password: rec123");
//        }
//
//        // Create sample cashier
//        if (!userRepository.existsByUsername("cashier")) {
//            User cashier = new User(
//                    "John Cashier",
//                    "cashier",
//                    passwordEncoder.encode("cash123"),
//                    Role.CASHIER
//            );
//            userRepository.save(cashier);
//            System.out.println("✅ Sample cashier created!");
//            System.out.println("   Username: cashier");
//            System.out.println("   Password: cash123");
//        }
//    }
//}