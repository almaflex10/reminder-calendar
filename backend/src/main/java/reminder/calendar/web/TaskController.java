package reminder.calendar.web;


import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reminder.calendar.dto.TaskResponse;
import reminder.calendar.entity.User;
import reminder.calendar.repo.UserRepository;
import reminder.calendar.service.TaskService;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final UserRepository userRepository;

    /** GET /api/tasks?date=2026-10-19 – az adott nap nyitott teendői (alapból a mai nap). */
    @GetMapping
    public List<TaskResponse> openTasks(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return taskService.getOpenTasks(currentUserId(principal), dateOrToday(date));
    }

    /** POST /api/tasks/{id}/complete?date=2026-10-19 – teljesítés (alapból mára). */
    @PostMapping("/{id}/complete")
    public ResponseEntity<Void> complete(
            Principal principal,
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        taskService.completeTask(currentUserId(principal), id, dateOrToday(date));
        return ResponseEntity.noContent().build();
    }

    /** DELETE /api/tasks/{id}/complete?date=2026-10-19 – teljesítés visszavonása. */
    @DeleteMapping("/{id}/complete")
    public ResponseEntity<Void> undoComplete(
            Principal principal,
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        taskService.undoCompletion(currentUserId(principal), id, dateOrToday(date));
        return ResponseEntity.noContent().build();
    }

    /** A bejelentkezett felhasználó – a Principal-t Spring Security tölti ki. */
    private Long currentUserId(Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nincs bejelentkezett felhasználó.");
        }
        return userRepository.findByUsername(principal.getName())
                .map(User::getId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Ismeretlen felhasználó."));
    }

    private static LocalDate dateOrToday(LocalDate date) {
        return date != null ? date : LocalDate.now();
    }
}