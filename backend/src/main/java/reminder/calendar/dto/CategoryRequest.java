package reminder.calendar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Kategória létrehozása / módosítása – {"name": "Munka", "color": "#E74C3C"} */
public record CategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "A szín #RRGGBB formátumú legyen, pl. #E74C3C")
        String color
) {
}
