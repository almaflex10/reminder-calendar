package reminder.calendar.repo;


import org.springframework.data.jpa.repository.JpaRepository;
import reminder.calendar.entity.TaskCompletion;
import reminder.calendar.entity.TaskCompletionId;

public interface TaskCompletionRepository extends JpaRepository<TaskCompletion, TaskCompletionId> {
}