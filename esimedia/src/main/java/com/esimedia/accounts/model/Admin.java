package com.esimedia.accounts.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "admins")
public class Admin extends Account {

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Department department;

    @Size(max = 200)
    private String picture;

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public String getPicture() {
        return picture;
    }

    public void setPicture(String picture) {
        this.picture = picture;
    }
}
