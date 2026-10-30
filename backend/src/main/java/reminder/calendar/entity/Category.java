package reminder.calendar.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/** Minden felhasználónak saját kategóriái vannak; a név felhasználónként egyedi. */
@Entity
@Table(name = "categories",
       uniqueConstraints = @UniqueConstraint(name = "uq_categories_user_name",
                                             columnNames = {"user_id", "name"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA-nak kell
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ha a felhasználót törlik, a kategóriái is törlődnek. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User owner;

    @Setter
    @Column(nullable = false, length = 100)
    private String name;

    /** Hex szín a felülethez, pl. "#E74C3C". */
    @Setter
    @Column(nullable = false, length = 7)
    private String color = "#4A90D9";

    public Category(User owner, String name, String color) {
        this.owner = owner;
        this.name = name;
        this.color = color;
    }
}