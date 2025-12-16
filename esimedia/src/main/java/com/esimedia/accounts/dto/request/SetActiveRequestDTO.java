package com.esimedia.accounts.dto.request;

import jakarta.validation.constraints.NotNull;

public class SetActiveRequestDTO {
    @NotNull(message = "El campo active es obligatorio")
    private Boolean active;

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
