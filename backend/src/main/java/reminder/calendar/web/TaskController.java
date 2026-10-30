package reminder.calendar.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reminder.calendar.dto.TaskDetailResponse;
import reminder.calendar.dto.TaskRequest;
import reminder.calendar.dto.TaskResponse;
import reminder.calendar.security.CurrentUserService;
import reminder.calendar.service.TaskService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final CurrentUserService currentUser;

    // ===================== Napi nézet + teljesítés =====================

    /** GET /api/tasks?date=2026-10-30 – az adott nap nyitott teendői (alapból a mai nap). */
    @GetMapping
    public List<TaskResponse> openTasks(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return taskService.getOpenTasks(currentUser.getId(), dateOrToday(date));
    }

    /** POST /api/tasks/{id}/complete?date=2026-10-30 – teljesítés (alapból mára). */
    @PostMapping("/{id}/complete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void complete(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        taskService.completeTask(currentUser.getId(), id, dateOrToday(date));
    }

    /** DELETE /api/tasks/{id}/complete?date=2026-10-30 – teljesítés visszavonása. */
    @DeleteMapping("/{id}/complete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void undoComplete(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        taskService.undoCompletion(currentUser.getId(), id, dateOrToday(date));
    }

    // ===================== Teendők kezelése =====================

    /** GET /api/tasks/all – az összes teendőd (egyszeri és ismétlődő). */
    @GetMapping("/all")
    public List<TaskDetailResponse> listAll() {
        return taskService.listAll(currentUser.getId());
    }

    /** GET /api/tasks/{id} – egy teendő minden adata (pl. a szerkesztő űrlaphoz). */
    @GetMapping("/{id}")
    public TaskDetailResponse get(@PathVariable Long id) {
        return taskService.get(currentUser.getId(), id);
    }

    /** POST /api/tasks – új teendő. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDetailResponse create(@Valid @RequestBody TaskRequest req) {
        return taskService.create(currentUser.getId(), req);
    }

    /** PUT /api/tasks/{id} – teendő módosítása. */
    @PutMapping("/{id}")
    public TaskDetailResponse update(@PathVariable Long id, @Valid @RequestBody TaskRequest req) {
        return taskService.update(currentUser.getId(), id, req);
    }

    /** DELETE /api/tasks/{id} – teendő végleges törlése (minden ismétlődésével együtt). */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        taskService.delete(currentUser.getId(), id);
    }

    private static LocalDate dateOrToday(LocalDate date) {
        return date != null ? date : LocalDate.now();
    }
}
