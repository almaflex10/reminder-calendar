package reminder.calendar.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Bekapcsolja az AppProperties-t, hogy bárhol injektálható legyen. */
@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class PropertiesConfig {
}