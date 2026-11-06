package com.vipulmilk.controller;

import com.vipulmilk.dto.AuthResponse;
import com.vipulmilk.dto.LoginRequest;
import com.vipulmilk.entity.Owner;
import com.vipulmilk.service.OwnerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final OwnerService ownerService;

    public AuthController(AuthenticationManager authenticationManager, OwnerService ownerService) {
        this.authenticationManager = authenticationManager;
        this.ownerService = ownerService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authToken = 
                new UsernamePasswordAuthenticationToken(loginRequest.username(), loginRequest.password());

        Authentication authentication = authenticationManager.authenticate(authToken);
        SecurityContext securityContext = SecurityContextHolder.getContext();
        securityContext.setAuthentication(authentication);

        HttpSession session = request.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);

        Owner owner = ownerService.getOwner();
        return ResponseEntity.ok(new AuthResponse(
                true,
                owner.getUsername(),
                owner.getFullName(),
                "Login successful"
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<AuthResponse> getStatus(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && 
            !authentication.getPrincipal().equals("anonymousUser")) {
            Owner owner = ownerService.getOwner();
            return ResponseEntity.ok(new AuthResponse(
                    true,
                    owner.getUsername(),
                    owner.getFullName(),
                    "Authenticated"
            ));
        }
        return ResponseEntity.ok(new AuthResponse(false, null, null, "Not authenticated"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody Map<String, String> body) {
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 6 characters"));
        }
        ownerService.changePassword(currentPassword, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}

