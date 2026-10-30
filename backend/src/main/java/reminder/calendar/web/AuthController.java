package reminder.calendar.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reminder.calendar.dto.*;
import reminder.calendar.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** POST /api/auth/register – {"username", "email", "password"} */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return new MessageResponse("Sikeres regisztráció. Elküldtük a megerősítő e-mailt.");
    }

    /** GET /api/auth/verify?token=... – ide mutat az e-mailben kapott link. */
    @GetMapping("/verify")
    public MessageResponse verify(@RequestParam String token) {
        authService.verifyEmail(token);
        return new MessageResponse("Az e-mail címed megerősítve. Most már bejelentkezhetsz.");
    }

    /** POST /api/auth/resend-verification – {"email"} */
    @PostMapping("/resend-verification")
    public MessageResponse resend(@Valid @RequestBody ResendVerificationRequest req) {
        authService.resendVerification(req.email());
        return new MessageResponse("Ha a cím regisztrálva van és még nincs megerősítve, új e-mailt küldtünk.");
    }

    /** POST /api/auth/login – {"username", "password"} → {"token", ...} */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }
}
