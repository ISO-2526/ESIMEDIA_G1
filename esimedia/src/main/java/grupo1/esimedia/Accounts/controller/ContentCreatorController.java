package grupo1.esimedia.Accounts.controller;

import grupo1.esimedia.Accounts.model.ContentCreator;
import grupo1.esimedia.Accounts.service.ContentCreatorService;
import grupo1.esimedia.Content.model.Content;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/creators")
@PreAuthorize("hasAnyRole('ADMIN', 'CREATOR')")
public class ContentCreatorController {

    @Autowired
    private ContentCreatorService contentCreatorService;



    @GetMapping("/profile")
    @PreAuthorize("hasRole('CREATOR')") // ✅ Solo el creador
    public ResponseEntity<?> getProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        return contentCreatorService.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{alias}/contents")
    @PreAuthorize("permitAll()") // ✅ Público - cualquiera puede ver contenidos de un creador
    public ResponseEntity<List<Content>> getCreatorContents(@PathVariable String alias) {
        List<Content> contents = contentCreatorService.getContentsByCreator(alias);
        return ResponseEntity.ok(contents);
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('CREATOR')") // ✅ Solo el creador puede actualizar su perfil
    public ResponseEntity<?> updateProfile(@RequestBody ContentCreator updated) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        ContentCreator result = contentCreatorService.updateProfile(
                email,
                updated.getName(),
                updated.getSurname(),
                updated.getAlias(),
                updated.getDescription(),
                updated.getPicture()
        );
        return ResponseEntity.ok(result);
    }
}