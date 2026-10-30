package reminder.calendar.repo;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import reminder.calendar.entity.Task;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    /** Mindig ezt használd findById helyett: más felhasználó teendőjét nem adja vissza. */
    Optional<Task> findByIdAndOwnerId(Long id, Long ownerId);

    /**
     * Egy felhasználó adott napi, még el nem végzett teendői.
     * PostgreSQL-ben két DATE kivonása egész számot (napok) ad.
     */
    @Query(value = """
            SELECT t.*
            FROM tasks t
            WHERE t.user_id = :userId
              AND t.start_date <= :day
              AND (t.end_date IS NULL OR t.end_date >= :day)
              AND (
                    (t.repeat_interval_days IS NULL AND t.start_date = :day)
                 OR (t.repeat_interval_days IS NOT NULL
                     AND (CAST(:day AS DATE) - t.start_date) % t.repeat_interval_days = 0)
              )
              AND NOT EXISTS (
                    SELECT 1 FROM task_completions tc
                    WHERE tc.task_id = t.id AND tc.occurrence_date = :day)
            ORDER BY t.due_time NULLS LAST, t.title
            """, nativeQuery = true)
    List<Task> findOpenTasksForDay(@Param("userId") Long userId, @Param("day") LocalDate day);
}