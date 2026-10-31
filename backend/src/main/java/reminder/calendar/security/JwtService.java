package reminder.calendar.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reminder.calendar.config.AppProperties;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/** JWT tokenek kiadása és ellenőrzése. */
@Service
public class JwtService {

    private final SecretKey key;
    private final Duration validity;

    public JwtService(AppProperties props) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(props.jwt().secret()));
        this.validity = Duration.ofHours(props.jwt().validityHours());
    }

    public String generateToken(String username) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(username)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(validity)))
                .signWith(key)
                .compact();
    }

    /** A token felhasználóneve, ha a token érvényes (aláírás + lejárat); különben üres. */
    public Optional<String> extractUsername(String token) {
        try {
            return Optional.ofNullable(
                    Jwts.parser().verifyWith(key).build()
                            .parseSignedClaims(token)
                            .getPayload()
                            .getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public long getValiditySeconds() {
        return validity.toSeconds();
    }
}
