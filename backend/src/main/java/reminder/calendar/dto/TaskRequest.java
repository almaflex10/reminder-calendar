package reminder.calendar.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 *
 * {
 *   "title": "Virág locsolás",
 *   "categoryId": 2,
 *   "startDate": "2026-10-30",
 *   "dueTime": "08:00",
 *   "repeatIntervalDays": 2,
 *   "endDate": null
 * }
 */
public record TaskRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 5000) String description,
        Long categoryId,
        @NotNull LocalDate startDate,
        LocalTime dueTime,
        @Min(1) @Max(365) Integer repeatIntervalDays,
        LocalDate endDate
) {
}
