package reminder.calendar.dto;



import reminder.calendar.entity.Category;
import reminder.calendar.entity.Task;

import java.time.LocalDate;
import java.time.LocalTime;

/** Ami a kliensnek egy napi teendőről kimegy (az entitást nem adjuk ki közvetlenül). */
public record TaskResponse(
        Long id,
        String title,
        String description,
        LocalDate date,
        LocalTime dueTime,
        Integer repeatIntervalDays,
        Long categoryId,
        String categoryName,
        String categoryColor
) {
    public static TaskResponse of(Task task, LocalDate date) {
        Category c = task.getCategory();
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                date,
                task.getDueTime(),
                task.getRepeatIntervalDays(),
                c != null ? c.getId() : null,
                c != null ? c.getName() : null,
                c != null ? c.getColor() : null
        );
    }
}