package reminder.calendar.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reminder.calendar.dto.CalendarDayResponse;
import reminder.calendar.entity.Task;
import reminder.calendar.entity.TaskCompletionId;
import reminder.calendar.exception.BadRequestException;
import reminder.calendar.repo.TaskCompletionRepository;
import reminder.calendar.repo.TaskRepository;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CalendarService {

    /** Egy havi nézet a szomszédos hónapok napjaival együtt max. 6 hét = 42 nap; ennyi bőven elég. */
    private static final int MAX_DAYS = 62;

    private final TaskRepository taskRepository;
    private final TaskCompletionRepository completionRepository;

    /**
     * Napi összesítés a [from, to] időszakra (mindkét végét beleértve).
     * Két lekérdezés az egész időszakra, a napokra bontás már a memóriában történik.
     */
    @Transactional(readOnly = true)
    public List<CalendarDayResponse> getRange(Long userId, LocalDate from, LocalDate to) {
        if (to.isBefore(from)) {
            throw new BadRequestException("A 'to' dátum nem lehet a 'from' előtt.");
        }
        if (ChronoUnit.DAYS.between(from, to) + 1 > MAX_DAYS) {
            throw new BadRequestException("Egyszerre legfeljebb " + MAX_DAYS + " napot lehet lekérni.");
        }

        List<Task> tasks = taskRepository.findCandidatesInRange(userId, from, to);
        Set<TaskCompletionId> done = new HashSet<>(completionRepository.findIdsInRange(userId, from, to));

        List<CalendarDayResponse> days = new ArrayList<>();
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            int total = 0;
            int completed = 0;
            Set<String> colors = new LinkedHashSet<>();

            for (Task task : tasks) {
                if (!task.isDueOn(day)) continue;
                total++;
                if (done.contains(new TaskCompletionId(task.getId(), day))) {
                    completed++;
                } else if (task.getCategory() != null) {
                    colors.add(task.getCategory().getColor());
                }
            }
            days.add(new CalendarDayResponse(day, total, completed, total - completed, List.copyOf(colors)));
        }
        return days;
    }
}
