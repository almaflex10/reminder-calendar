package reminder.calendar.service;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reminder.calendar.dto.TaskResponse;
import reminder.calendar.entity.Task;
import reminder.calendar.entity.TaskCompletion;
import reminder.calendar.entity.TaskCompletionId;
import reminder.calendar.exception.BadRequestException;
import reminder.calendar.exception.NotFoundException;
import reminder.calendar.repo.TaskCompletionRepository;
import reminder.calendar.repo.TaskRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskCompletionRepository completionRepository;

    /** Az adott nap még el nem végzett teendői. */
    @Transactional(readOnly = true)
    public List<TaskResponse> getOpenTasks(Long userId, LocalDate day) {
        return taskRepository.findOpenTasksForDay(userId, day).stream()
                .map(task -> TaskResponse.of(task, day))
                .toList();
    }

    /**
     * Teendő teljesítése egy adott napra.
     * Ismétlődő teendőnél csak az aznapi előfordulás tűnik el, a többi marad.
     * Ha már teljesítve van, nem csinál semmit (kétszeri kattintás nem hiba).
     */
    @Transactional
    public void completeTask(Long userId, Long taskId, LocalDate day) {
        Task task = findOwnedTask(userId, taskId);

        if (!task.isDueOn(day)) {
            throw new BadRequestException("Ez a teendő nem esedékes ezen a napon: " + day);
        }

        TaskCompletionId id = new TaskCompletionId(taskId, day);
        if (!completionRepository.existsById(id)) {
            completionRepository.save(new TaskCompletion(task, day));
        }
    }

    /** Teljesítés visszavonása, ha véletlenül pipáltad ki. */
    @Transactional
    public void undoCompletion(Long userId, Long taskId, LocalDate day) {
        findOwnedTask(userId, taskId);
        completionRepository.deleteById(new TaskCompletionId(taskId, day));
    }

    private Task findOwnedTask(Long userId, Long taskId) {
        return taskRepository.findByIdAndOwnerId(taskId, userId)
                .orElseThrow(() -> new NotFoundException("Nincs ilyen teendő: " + taskId));
    }
}