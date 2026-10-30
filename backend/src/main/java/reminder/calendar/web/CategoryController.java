package reminder.calendar.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reminder.calendar.dto.CategoryRequest;
import reminder.calendar.dto.CategoryResponse;
import reminder.calendar.security.CurrentUserService;
import reminder.calendar.service.CategoryService;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final CurrentUserService currentUser;

    /** GET /api/categories – a saját kategóriáid, név szerint. */
    @GetMapping
    public List<CategoryResponse> list() {
        return categoryService.list(currentUser.getId());
    }

    /** POST /api/categories – {"name": "Munka", "color": "#E74C3C"} */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@Valid @RequestBody CategoryRequest req) {
        return categoryService.create(currentUser.getId(), req);
    }

    /** PUT /api/categories/{id} – átnevezés / átszínezés. */
    @PutMapping("/{id}")
    public CategoryResponse update(@PathVariable Long id, @Valid @RequestBody CategoryRequest req) {
        return categoryService.update(currentUser.getId(), id, req);
    }

    /** DELETE /api/categories/{id} – a teendők megmaradnak, kategória nélkül. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        categoryService.delete(currentUser.getId(), id);
    }
}
