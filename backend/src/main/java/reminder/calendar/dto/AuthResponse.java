package reminder.calendar.dto;

/** Sikeres bejelentkezés válasza – a tokent az Angular minden kéréshez hozzáteszi. */
public record AuthResponse(
        String token,
        String username,
        long expiresInSeconds
) {
}
