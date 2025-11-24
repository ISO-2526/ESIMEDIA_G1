package grupo1.esimedia.Accounts.repository;

import grupo1.esimedia.Accounts.model.Token;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TokenRepository extends MongoRepository<Token, String> {
    Optional<Token> findById(String id);
    Optional<Token> findByAccountId(String accountId);
}