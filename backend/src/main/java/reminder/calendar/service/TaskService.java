package reminder.calendar.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reminder.calendar.dto.TaskDetailResponse;
import reminder.calendar.dto.TaskRequest;
import reminder.calendar.dto.TaskResponse;
import reminder.calendar.entity.Task;
import reminder.calendar.entity.TaskCompletion;
import reminder.calendar.entity.TaskCompletionId;
import reminder.calendar.exception.BadRequestException;
import reminder.calendar.exception.NotFoundException;
import reminder.calendar.repo.TaskCompletionRepository;
import reminder.calendar.repo.TaskRepository;
import reminder.calendar.repo.UserRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskCompletionRepository completionRepository;
    private final UserRepository userRepository;
    private final CategoryService categoryService;

    // ===================== Lekérdezés =====================

    /** Az adott nap még el nem végzett teendői. */
    @Transactional(readOnly = true)
    public List<TaskResponse> getOpenTasks(Long userId, LocalDate day) {
        return taskRepository.findOpenTasksForDay(userId, day).stream()
                .map(task -> TaskResponse.of(task, day))
                .toList();
    }

    /** Az összes teendő (egyszeri és ismétlődő) – a kezelő listához. */
    @Transactional(readOnly = true)
    public List<TaskDetailResponse> listAll(Long userId) {
        return taskRepository.findAllByOwnerIdOrderByStartDateAscDueTimeAscTitleAsc(userId).stream()
                .map(TaskDetailResponse::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskDetailResponse get(Long userId, Long taskId) {
        return TaskDetailResponse.of(findOwnedTask(userId, taskId));
    }

    // ===================== Létrehozás / módosítás / törlés =====================

    @Transactional
    public TaskDetailResponse create(Long userId, TaskRequest req) {
        Task task = new Task(userRepository.getReferenceById(userId), req.title().trim(), req.startDate());
        apply(task, req, userId);
        return TaskDetailResponse.of(taskRepository.save(task));
    }

    /**
     * Módosítás. A korábbi teljesítések megmaradnak – ha egy ismétlődő teendő kezdőnapját
     * vagy gyakoriságát átírod, a régi napokra felírt pipák nem vesznek el.
     */
    @Transactional
    public TaskDetailResponse update(Long userId, Long taskId, TaskRequest req) {
        Task task = findOwnedTask(userId, taskId);
        apply(task, req, userId);
        return TaskDetailResponse.of(task);
    }

    /** Törlés – a teljesítései is törlődnek (ON DELETE CASCADE). */
    @Transactional
    public void delete(Long userId, Long taskId) {
        taskRepository.delete(findOwnedTask(userId, taskId));
    }

    // ===================== Teljesítés =====================

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

    // ===================== Segédmetódusok =====================

    /** A kérés adatait átmásolja a teendőre, ellenőrzésekkel. */
    private void apply(Task task, TaskRequest req, Long userId) {
        boolean recurring = req.repeatIntervalDays() != null;

        if (recurring && req.endDate() != null && req.endDate().isBefore(req.startDate())) {
            throw new BadRequestException("Az ismétlés vége nem lehet a kezdőnap előtt.");
        }

        task.setTitle(req.title().trim());
        task.setDescription(req.description() == null || req.description().isBlank() ? null : req.description().trim());
        task.setStartDate(req.startDate());
        task.setDueTime(req.dueTime());
        task.setRepeatIntervalDays(req.repeatIntervalDays());
        // egyszeri teendőnél a végdátumnak nincs értelme
        task.setEndDate(recurring ? req.endDate() : null);
        task.setCategory(req.categoryId() == null ? null : categoryService.getOwned(userId, req.categoryId()));
    }

    private Task findOwnedTask(Long userId, Long taskId) {
        return taskRepository.findByIdAndOwnerId(taskId, userId)
                .orElseThrow(() -> new NotFoundException("Nincs ilyen teendő: " + taskId));
    }
}
