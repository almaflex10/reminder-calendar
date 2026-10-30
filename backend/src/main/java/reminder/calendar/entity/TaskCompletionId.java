package reminder.calendar.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;

/** Összetett kulcs: melyik teendő + melyik nap. */
@Embeddable
@Getter
@EqualsAndHashCode
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA-nak kell
public class TaskCompletionId implements Serializable {

    @Column(name = "task_id")
    private Long taskId;

    @Column(name = "occurrence_date")
    private LocalDate occurrenceDate;
}