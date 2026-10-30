package reminder.calendar.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    /** Ide mutat a link; most a backend végpontja, később az Angular oldal. */
    @Value("${app.verification-url}")
    private String verificationUrl;

    public void sendVerificationEmail(String to, String username, String token) {
        String link = verificationUrl + "?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("Erősítsd meg az e-mail címed");
        message.setText("""
                Szia %s!

                Köszönjük a regisztrációt. A fiókod aktiválásához kattints az alábbi linkre:

                %s

                A link 24 óráig érvényes. Ha nem te regisztráltál, hagyd figyelmen kívül ezt a levelet.
                """.formatted(username, link));

        mailSender.send(message);
    }
}
