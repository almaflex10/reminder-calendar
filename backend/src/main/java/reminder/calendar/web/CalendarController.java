package reminder.calendar.web;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reminder.calendar.dto.CalendarDayResponse;
import reminder.calendar.security.CurrentUserService;
import reminder.calendar.service.CalendarService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;
    private final CurrentUserService currentUser;

    /**
     * GET /api/calendar?from=2026-09-28&to=2026-11-08
     * Minden napra: hány teendő van, mennyi kész, mennyi nyitott, és a nyitottak kategóriaszínei.
     * A from/to-t az Angular a havi nézet első és utolsó látható napjára állítja.
     */
    @GetMapping
    public List<CalendarDayResponse> range(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return calendarService.getRange(currentUser.getId(), from, to);
    }
}
