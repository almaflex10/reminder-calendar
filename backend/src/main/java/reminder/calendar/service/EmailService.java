package reminder.calendar.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reminder.calendar.config.AppProperties;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * app.mail.mode:
 *  - log:   nem küld semmit, csak kiírja a linket a konzolra (helyi fejlesztéshez)
 *  - smtp:  SMTP szerveren keresztül (pl. Mailpit)
 *  - brevo: a Brevo HTTP API-ján keresztül – a Renderen ez kell, ott az SMTP portok tiltva vannak
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    @PostConstruct
    void logMailSettings() {
        log.info("E-mail küldés: mód={}, feladó={}, Brevo kulcs megadva={}",
                props.mail().mode(), props.mail().from(), !props.mail().brevoApiKey().isBlank());
    }
    private static final URI BREVO_URL = URI.create("https://api.brevo.com/v3/smtp/email");

    private final ObjectProvider<JavaMailSender> mailSender;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final AppProperties props;




    public void sendVerificationEmail(String to, String username, String token) {
        String link = props.verificationUrl() + "?token=" + token;
        String subject = "Erősítsd meg az e-mail címed";
        String text = """
                Szia %s!

                Köszönjük a regisztrációt. A fiókod aktiválásához kattints az alábbi linkre:

                %s

                A link 24 óráig érvényes. Ha nem te regisztráltál, hagyd figyelmen kívül ezt a levelet.
                """.formatted(username, link);

        switch (props.mail().mode()) {
            case BREVO -> sendViaBrevo(to, subject, text);
            case SMTP -> sendViaSmtp(to, subject, text);
            case LOG -> log.info("""

                    ==================== E-MAIL (nincs elküldve, app.mail.mode=log) ====================
                    Címzett:  {}
                    Megerősítő link: {}
                    =====================================================================================
                    """, to, link);
        }
    }

    private void sendViaSmtp(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(props.mail().from());
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSender.getObject().send(message);
    }

    private void sendViaBrevo(String to, String subject, String text) {
        AppProperties.Mail mail = props.mail();
        if (mail.brevoApiKey().isBlank()) {
            throw new IllegalStateException("app.mail.mode=brevo, de nincs megadva a BREVO_API_KEY.");
        }
        String json = """
                {"sender":{"name":%s,"email":%s},"to":[{"email":%s}],"subject":%s,"textContent":%s}"""
                .formatted(json(mail.fromName()), json(mail.from()), json(to), json(subject), json(text));

        HttpRequest request = HttpRequest.newBuilder(BREVO_URL)
                .timeout(Duration.ofSeconds(15))
                .header("api-key", mail.brevoApiKey())
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();
        try {
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                log.error("Brevo hiba ({}): {}", response.statusCode(), response.body());
                throw emailFailed();
            }
            log.info("Megerősítő e-mail átadva a Brevónak: {} (válasz: {})", to, response.body());
        } catch (IOException e) {
            log.error("Brevo nem érhető el", e);
            throw emailFailed();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw emailFailed();
        }
    }

    /** 503 – a regisztráció visszagörgetődik, a felhasználó érthető üzenetet kap. */
    private static ResponseStatusException emailFailed() {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Nem sikerült elküldeni a megerősítő e-mailt. Próbáld újra pár perc múlva.");
    }

    /** Szöveg JSON-ba: idézőjelek közé, a speciális karakterek escape-elésével. */
    static String json(String s) {
        StringBuilder b = new StringBuilder(s.length() + 2).append('"');
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> b.append("\\\"");
                case '\\' -> b.append("\\\\");
                case '\n' -> b.append("\\n");
                case '\r' -> b.append("\\r");
                case '\t' -> b.append("\\t");
                default -> {
                    if (c < 0x20) b.append(String.format("\\u%04x", (int) c));
                    else b.append(c);
                }
            }
        }
        return b.append('"').toString();
    }
}