package grupo1.esimedia.Accounts.repository;

import grupo1.esimedia.Accounts.model.ContentCreator;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ContentCreatorRepository extends MongoRepository<ContentCreator, String> {
	boolean existsByAlias(String alias);
    Optional<ContentCreator> findByEmail(String email);
    Optional<ContentCreator> findByAlias(String alias);
    ContentCreator findByResetToken(String resetToken);
}
