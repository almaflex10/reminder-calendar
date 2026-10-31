package reminder.calendar.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/**
 * Az application.yml "app:" része, típusosan. Induláskor ellenőrződik:
 * ha valami hiányzik vagy hibás, az alkalmazás el sem indul, és megmondja, mi a baj.
 */
@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @Valid @NotNull Jwt jwt,

        /** CORS: innen hívhatja az Angular a backendet. A yml-ben vesszővel elválasztva is megadható. */
        @NotEmpty List<String> frontendUrl,

        /** Az e-mailben küldött link ide mutat (az Angular /verify oldala). */
        @NotBlank String verificationUrl,

        @DefaultValue("24") @Min(1) long verificationTokenValidityHours,

        /** false: senki nem tud új fiókot létrehozni. */
        @DefaultValue("true") boolean registrationEnabled,

        @Valid @NotNull Mail mail
) {

    public record Jwt(
            /** Base64 kódolt, legalább 32 bájtos titok (openssl rand -base64 32). */
            @NotBlank String secret,
            @DefaultValue("720") @Min(1) long validityHours
    ) {
    }

    public record Mail(
            @DefaultValue("log") MailMode mode,
            @NotBlank String from,
            @DefaultValue("Teendőnaptár") String fromName,
            @DefaultValue("") String brevoApiKey
    ) {
    }

    /** log: csak kiírja a linket; smtp: SMTP szerveren át; brevo: Brevo HTTP API (Render). */
    public enum MailMode {
        LOG, SMTP, BREVO
    }
}