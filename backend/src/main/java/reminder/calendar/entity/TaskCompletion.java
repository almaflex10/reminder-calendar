package reminder.calendar.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/** Egy teendő egy adott napi előfordulása elvégezve. */
@Entity
@Table(name = "task_completions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TaskCompletion {

    @EmbeddedId
    private TaskCompletionId id;

    /** Ha a teendőt törlik, az elvégzései is törlődnek. */
    @MapsId("taskId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Task task;

    @CreationTimestamp
    @Column(name = "completed_at", nullable = false, updatable = false)
    private OffsetDateTime completedAt;

    public TaskCompletion(Task task, LocalDate occurrenceDate) {
        this.task = task;
        this.id = new TaskCompletionId(task.getId(), occurrenceDate);
    }

    public LocalDate getOccurrenceDate() {
        return id.getOccurrenceDate();
    }
}