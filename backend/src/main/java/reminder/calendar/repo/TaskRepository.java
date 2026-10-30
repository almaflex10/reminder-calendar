package reminder.calendar.repo;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import reminder.calendar.entity.Task;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    /** Mindig ezt használd findById helyett: más felhasználó teendőjét nem adja vissza. */
    @EntityGraph(attributePaths = "category")
    Optional<Task> findByIdAndOwnerId(Long id, Long ownerId);

    /** Egy felhasználó összes teendője (a kategóriával együtt, egy lekérdezésben). */
    @EntityGraph(attributePaths = "category")
    List<Task> findAllByOwnerIdOrderByStartDateAscDueTimeAscTitleAsc(Long ownerId);

    /**
     * Azok a teendők, amelyeknek lehet előfordulása a [from, to] időszakban:
     * nem kezdődnek a "to" után, és nem érnek véget a "from" előtt.
     * Egyszeri teendőnél az end_date null, ezért ide bekerülhet egy korábbi is –
     * a pontos napokat a Task.isDueOn() dönti el.
     */
    @EntityGraph(attributePaths = "category")
    @Query("""
            SELECT t FROM Task t
            WHERE t.owner.id = :userId
              AND t.startDate <= :to
              AND (t.repeatIntervalDays IS NOT NULL OR t.repeatWeekdays IS NOT NULL OR t.startDate >= :from)
              AND (t.endDate IS NULL OR t.endDate >= :from)
            """)
    List<Task> findCandidatesInRange(@Param("userId") Long userId,
                                     @Param("from") LocalDate from,
                                     @Param("to") LocalDate to);


}
