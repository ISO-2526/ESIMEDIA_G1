package grupo1.esimedia.Content.repository;

import grupo1.esimedia.Content.model.Content;
import grupo1.esimedia.Content.model.ContentState;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CreatorContentRepository extends MongoRepository<Content, String> {
    List<Content> findByCreatorAlias(String alias);
    List<Content> findByState(ContentState state);
    List<Content> findByCreatorAliasAndState(String alias, ContentState state);
}
