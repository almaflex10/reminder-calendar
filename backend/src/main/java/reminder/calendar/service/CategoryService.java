package reminder.calendar.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reminder.calendar.dto.CategoryRequest;
import reminder.calendar.dto.CategoryResponse;
import reminder.calendar.entity.Category;
import reminder.calendar.exception.ConflictException;
import reminder.calendar.exception.NotFoundException;
import reminder.calendar.repo.CategoryRepository;
import reminder.calendar.repo.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(Long userId) {
        return categoryRepository.findAllByOwnerIdOrderByNameAsc(userId).stream()
                .map(CategoryResponse::of)
                .toList();
    }

    @Transactional
    public CategoryResponse create(Long userId, CategoryRequest req) {
        String name = req.name().trim();
        if (categoryRepository.existsByOwnerIdAndNameIgnoreCase(userId, name)) {
            throw new ConflictException("Már van ilyen nevű kategóriád: " + name);
        }
        Category category = new Category(userRepository.getReferenceById(userId), name, req.color());
        return CategoryResponse.of(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long userId, Long categoryId, CategoryRequest req) {
        Category category = getOwned(userId, categoryId);
        String name = req.name().trim();
        if (categoryRepository.existsByOwnerIdAndNameIgnoreCaseAndIdNot(userId, name, categoryId)) {
            throw new ConflictException("Már van ilyen nevű kategóriád: " + name);
        }
        category.setName(name);
        category.setColor(req.color());
        return CategoryResponse.of(category);
    }

    /** Törlés – a hozzá tartozó teendők megmaradnak, csak kategória nélkül (ON DELETE SET NULL). */
    @Transactional
    public void delete(Long userId, Long categoryId) {
        categoryRepository.delete(getOwned(userId, categoryId));
    }

    /** A TaskService is ezt használja, hogy csak saját kategóriát lehessen teendőhöz rendelni. */
    @Transactional(readOnly = true)
    public Category getOwned(Long userId, Long categoryId) {
        return categoryRepository.findByIdAndOwnerId(categoryId, userId)
                .orElseThrow(() -> new NotFoundException("Nincs ilyen kategória: " + categoryId));
    }
}
