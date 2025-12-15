package grupo1.esimedia.Content.repository;

import grupo1.esimedia.Content.model.Content;
import grupo1.esimedia.Content.model.ContentState;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;

public interface CreatorContentRepository extends MongoRepository<Content, String> {
    List<Content> findByCreatorAlias(String alias);
    List<Content> findByState(ContentState state);
    List<Content> findByCreatorAliasAndState(String alias, ContentState state);
    
    // HDU 493 - Task 515: Buscar contenidos que caducan exactamente en una fecha
    List<Content> findByAvailableUntilAndState(LocalDate availableUntil, ContentState state);
    
    // HDU 493 - Task 517: Buscar contenidos con fecha de caducidad <= hoy y estado PUBLICO
    List<Content> findByAvailableUntilBeforeAndState(LocalDate date, ContentState state);
    
    // HDU 493: Buscar contenidos públicos con fecha de caducidad definida
    List<Content> findByStateAndAvailableUntilIsNotNull(ContentState state);
}
