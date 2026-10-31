package reminder.calendar.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** GET /api/health – "ok". A Render állapotellenőrzése és az ébren tartó ping hívja; nem nyúl az adatbázishoz. */
@RestController
public class HealthController {

    @GetMapping("/api/health")
    public String health() {
        return "ok";
    }
}