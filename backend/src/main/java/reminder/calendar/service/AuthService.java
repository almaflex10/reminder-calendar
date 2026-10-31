package reminder.calendar.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reminder.calendar.config.AppProperties;
import reminder.calendar.dto.AuthResponse;
import reminder.calendar.dto.LoginRequest;
import reminder.calendar.dto.RegisterRequest;
import reminder.calendar.entity.User;
import reminder.calendar.entity.VerificationToken;
import reminder.calendar.exception.BadRequestException;
import reminder.calendar.exception.ConflictException;
import reminder.calendar.exception.EmailNotVerifiedException;
import reminder.calendar.exception.UnauthorizedException;
import reminder.calendar.repo.UserRepository;
import reminder.calendar.repo.VerificationTokenRepository;
import reminder.calendar.security.JwtService;

import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    private final AppProperties props;

    /**
     * Regisztráció: a felhasználó letiltva jön létre, és kap egy megerősítő e-mailt.
     * Ha az e-mail küldés hibát dob, az egész visszagörgetődik, nem marad félkész fiók.
     */
    @Transactional
    public void register(RegisterRequest req) {
        if (!props.registrationEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "A regisztráció jelenleg ki van kapcsolva.");
        }
        String email = normalizeEmail(req.email());

        if (userRepository.existsByUsername(req.username())) {
            throw new ConflictException("Ez a felhasználónév már foglalt.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Ezzel az e-mail címmel már regisztráltak.");
        }

        User user = userRepository.save(
                new User(req.username(), email, passwordEncoder.encode(req.password())));

        sendNewVerificationToken(user);
    }

    /** A linkre kattintva aktiválja a fiókot. */
    @Transactional
    public AuthResponse verifyEmail(String token) {
        VerificationToken vt = tokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Érvénytelen vagy már felhasznált megerősítő link."));

        if (vt.isExpired()) {
            throw new BadRequestException("A megerősítő link lejárt. Kérj újat.");
        }

        User user = vt.getUser();
        user.setEnabled(true);
        tokenRepository.deleteAllByUserId(user.getId());
        return new AuthResponse(
                jwtService.generateToken(user.getUsername()),
                user.getUsername(),
                jwtService.getValiditySeconds());
    }

    /**
     * Új megerősítő e-mail. Akkor is "sikeresen" tér vissza, ha nincs ilyen cím,
     * így nem lehet vele kipuhatolni, ki regisztrált.
     */
    @Transactional
    public void resendVerification(String email) {
        String normalized = normalizeEmail(email);
        userRepository.findByEmail(normalized)
                .filter(user -> !user.isEnabled())
                .ifPresentOrElse(
                        this::sendNewVerificationToken,
                        () -> log.info("Újraküldés kihagyva: nincs megerősítetlen fiók ezzel a címmel: {}", normalized));
    }

    /** Bejelentkezés felhasználónévvel és jelszóval; sikeres esetben JWT tokent ad. */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByUsername(req.username())
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                // ugyanaz az üzenet rossz névre és rossz jelszóra – ne derüljön ki, melyik létezik
                .orElseThrow(() -> new UnauthorizedException("Hibás felhasználónév vagy jelszó."));

        if (!user.isEnabled()) {
            throw new EmailNotVerifiedException("Előbb erősítsd meg az e-mail címed.");
        }

        return new AuthResponse(
                jwtService.generateToken(user.getUsername()),
                user.getUsername(),
                jwtService.getValiditySeconds());
    }

    private void sendNewVerificationToken(User user) {
        tokenRepository.deleteAllByUserId(user.getId());
        VerificationToken vt = tokenRepository.save(new VerificationToken(user, props.verificationTokenValidityHours()));
        emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), vt.getToken());
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
