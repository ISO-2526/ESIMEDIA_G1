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

    /**
     * Encuentra contenidos que caducan en una fecha específica
     */
    List<Content> findByAvailableUntil(LocalDate date);

    /**
     * Encuentra contenidos con fecha de caducidad anterior o igual a la fecha dada
     */
    List<Content> findByAvailableUntilLessThanEqual(LocalDate date);

    /**
     * Encuentra contenidos activos (PUBLICO) que ya vencieron
     */
    List<Content> findByStateAndAvailableUntilLessThanEqual(ContentState state, LocalDate date);
}
