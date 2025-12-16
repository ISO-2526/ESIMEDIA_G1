package grupo1.esimedia.accounts.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "content_creators")
public class ContentCreator extends Account {

    @NotNull
    @Size(max = 12)
    @Pattern(regexp = "[A-Za-z0-9]+")
    @Indexed(unique = true)
    private String alias;

    @Size(max = 400)
    @Column(length = 400)
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Specialty specialty;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false)
    private ContentType contentType; // cannot be edited

    @Size(max = 200)
    private String picture;

    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Specialty getSpecialty() {
        return specialty;
    }

    public void setSpecialty(Specialty specialty) {
        this.specialty = specialty;
    }

    public ContentType getContentType() {
        return contentType;
    }

    public void setContentType(ContentType contentType) {
        this.contentType = contentType;
    }

    public String getPicture() {
        return picture;
    }

    public void setPicture(String picture) {
        this.picture = picture;
    }
}
