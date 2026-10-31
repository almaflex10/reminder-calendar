package reminder.calendar.dto;

import reminder.calendar.entity.Task;

import java.time.LocalDate;
import java.time.LocalTime;

/** Egy teendő minden adata – a szerkesztő űrlaphoz és a teendők listájához. */
public record TaskDetailResponse(
        Long id,
        String title,
        String description,
        CategoryResponse category,
        LocalDate startDate,
        LocalTime dueTime,
        Integer repeatIntervalDays,
        LocalDate endDate,
        LocalTime endTime,
        Integer repeatWeekdays
) {
    public static TaskDetailResponse of(Task t) {
        return new TaskDetailResponse(
                t.getId(),
                t.getTitle(),
                t.getDescription(),
                t.getCategory() != null ? CategoryResponse.of(t.getCategory()) : null,
                t.getStartDate(),
                t.getDueTime(),
                t.getRepeatIntervalDays(),
                t.getEndDate(),
                t.getEndTime(),
                t.getRepeatWeekdays()
        );
    }
}
