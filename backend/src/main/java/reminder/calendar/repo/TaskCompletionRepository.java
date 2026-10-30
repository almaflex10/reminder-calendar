package reminder.calendar.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import reminder.calendar.entity.TaskCompletion;
import reminder.calendar.entity.TaskCompletionId;

import java.time.LocalDate;
import java.util.List;

public interface TaskCompletionRepository extends JpaRepository<TaskCompletion, TaskCompletionId> {

    /** Egy felhasználó összes teljesítése egy időszakban (csak a kulcsok: teendő + nap). */
    @Query("""
            SELECT c.id FROM TaskCompletion c
            WHERE c.task.owner.id = :userId
              AND c.id.occurrenceDate BETWEEN :from AND :to
            """)
    List<TaskCompletionId> findIdsInRange(@Param("userId") Long userId,
                                          @Param("from") LocalDate from,
                                          @Param("to") LocalDate to);
}
