package reminder.calendar.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    /** Csak akkor létezik, ha a spring.mail.host be van állítva. */
    private final ObjectProvider<JavaMailSender> mailSender;

    /** false: nem küld levelet, csak kiírja a linket a konzolra (fejlesztéshez). */
    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    @Value("${app.mail.from}")
    private String from;

    /** Ide mutat a link: az Angular /verify oldala. */
    @Value("${app.verification-url}")
    private String verificationUrl;

    public void sendVerificationEmail(String to, String username, String token) {
        String link = verificationUrl + "?token=" + token;

        if (!enabled) {
            log.info("""

                    ==================== E-MAIL (nincs elküldve, app.mail.enabled=false) ====================
                    Címzett:  {}
                    Megerősítő link: {}
                    ==========================================================================================
                    """, to, link);
            return;
        }

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

        mailSender.getObject().send(message);
    }
}