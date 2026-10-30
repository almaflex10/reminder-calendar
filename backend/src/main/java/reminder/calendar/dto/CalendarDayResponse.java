package reminder.calendar.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Egy nap összesítése a naptárhoz.
 *
 * @param date       a nap
 * @param total      hány teendő esedékes aznap
 * @param completed  ebből hány van kipipálva
 * @param open       ebből hány van még hátra (total - completed)
 * @param colors     a nyitott teendők kategóriaszínei (ismétlés nélkül) – a naptárban kis pöttyöknek
 */
public record CalendarDayResponse(
        LocalDate date,
        int total,
        int completed,
        int open,
        List<String> colors
) {
}
