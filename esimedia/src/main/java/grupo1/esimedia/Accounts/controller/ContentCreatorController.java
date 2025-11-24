package grupo1.esimedia.Accounts.controller;

import grupo1.esimedia.Accounts.model.ContentCreator;
import grupo1.esimedia.Accounts.model.Token;
import grupo1.esimedia.Accounts.service.ContentCreatorService;
import grupo1.esimedia.Accounts.repository.TokenRepository;
import grupo1.esimedia.Content.model.Content;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/creators")
public class ContentCreatorController {

    @Autowired
    private ContentCreatorService contentCreatorService;

    @Autowired
    private TokenRepository tokenRepository;

    private Optional<String> resolveEmailFromToken(String tokenId) {
        if (tokenId == null || tokenId.isBlank()) return Optional.empty();
        Optional<Token> tok = tokenRepository.findById(tokenId);
        if (tok.isEmpty()) return Optional.empty();
        Token t = tok.get();
        if (t.getExpiration() != null && t.getExpiration().isBefore(LocalDateTime.now())) return Optional.empty();
        return Optional.ofNullable(t.getAccountId());
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@CookieValue(value = "access_token", required = false) String tokenId,
                                        @RequestParam(required = false) String email) {
        String effectiveEmail = resolveEmailFromToken(tokenId).orElse(null);
        if (effectiveEmail == null) return ResponseEntity.status(401).build();
        return contentCreatorService.findByEmail(effectiveEmail)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{alias}/contents")
    public ResponseEntity<List<Content>> getCreatorContents(@PathVariable String alias) {
        List<Content> contents = contentCreatorService.getContentsByCreator(alias);
        return ResponseEntity.ok(contents);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @CookieValue(value = "access_token", required = false) String tokenId,
            @RequestParam(required = false) String email,
            @RequestBody ContentCreator updated) {

        String effectiveEmail = resolveEmailFromToken(tokenId).orElse(null);
        if (effectiveEmail == null) return ResponseEntity.status(401).build();

        ContentCreator result = contentCreatorService.updateProfile(
                effectiveEmail,
                updated.getName(),
                updated.getSurname(),
                updated.getAlias(),
                updated.getDescription(),
                updated.getPicture()
        );
        return ResponseEntity.ok(result);
    }
}
