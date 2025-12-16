package grupo1.esimedia.accounts.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import grupo1.esimedia.accounts.model.Content;

import java.util.List;

@Repository
public interface PublicContentRepository extends MongoRepository<Content, String> {
    List<Content> findByCategoria(String categoria);
    List<Content> findByCreatorEmail(String creatorEmail);
    List<Content> findByActiveTrue();
    List<Content> findByTituloContainingIgnoreCase(String titulo);
}
