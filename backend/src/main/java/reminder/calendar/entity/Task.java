package reminder.calendar.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "tasks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA-nak kell
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ha a felhasználót törlik, a teendői (és azok elvégzései) is törlődnek. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User owner;

    @Setter
    @Column(nullable = false, length = 200)
    private String title;

    @Setter
    @Column(columnDefinition = "TEXT")
    private String description;

    /** Ha a kategóriát törlik, a teendő kategória nélkül marad. Setter lent, ellenőrzéssel. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Category category;

    /** Egyszeri teendőnél ez a nap, ismétlődőnél az első nap. */
    @Setter
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /** Opcionális időpont, pl. 08:00. */
    @Setter
    @Column(name = "due_time")
    private LocalTime dueTime;

    /** null = egyszeri, 1 = naponta, 2 = kétnaponta, n = n naponta. Setter lent, ellenőrzéssel. */
    @Column(name = "repeat_interval_days")
    private Integer repeatIntervalDays;

    /** Opcionális: meddig ismétlődjön (null = örökké). */
    @Setter
    @Column(name = "end_date")
    private LocalDate endDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public Task(User owner, String title, LocalDate startDate) {
        this.owner = owner;
        this.title = title;
        this.startDate = startDate;
    }

    /** Csak a teendő tulajdonosának saját kategóriája állítható be. */
    public void setCategory(Category category) {
        if (category != null && !category.getOwner().getId().equals(owner.getId())) {
            throw new IllegalArgumentException("A kategória egy másik felhasználóé.");
        }
        this.category = category;
    }

    public void setRepeatIntervalDays(Integer repeatIntervalDays) {
        if (repeatIntervalDays != null && repeatIntervalDays < 1) {
            throw new IllegalArgumentException("Az ismétlési időköz legalább 1 nap legyen.");
        }
        this.repeatIntervalDays = repeatIntervalDays;
    }

    public boolean isRecurring() {
        return repeatIntervalDays != null;
    }

    /** Esedékes-e a teendő az adott napon (az elvégzést nem nézi). */
    public boolean isDueOn(LocalDate day) {
        if (day.isBefore(startDate)) return false;
        if (endDate != null && day.isAfter(endDate)) return false;
        if (!isRecurring()) return day.equals(startDate);
        long daysSinceStart = ChronoUnit.DAYS.between(startDate, day);
        return daysSinceStart % repeatIntervalDays == 0;
    }
}