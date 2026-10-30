package reminder.calendar.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import reminder.calendar.entity.Category;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByOwnerIdOrderByNameAsc(Long ownerId);

    /** Mindig ezt használd findById helyett: más felhasználó kategóriáját nem adja vissza. */
    Optional<Category> findByIdAndOwnerId(Long id, Long ownerId);

    boolean existsByOwnerIdAndNameIgnoreCase(Long ownerId, String name);

    /** Átnevezéskor: van-e MÁSIK ilyen nevű kategóriája. */
    boolean existsByOwnerIdAndNameIgnoreCaseAndIdNot(Long ownerId, String name, Long id);
}
