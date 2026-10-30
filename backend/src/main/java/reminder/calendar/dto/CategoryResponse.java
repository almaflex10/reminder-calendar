package reminder.calendar.dto;

import reminder.calendar.entity.Category;

public record CategoryResponse(Long id, String name, String color) {

    public static CategoryResponse of(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getColor());
    }
}
