package grupo1.esimedia.accounts.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import grupo1.esimedia.accounts.model.Token;

import java.util.Optional;

@Repository
public interface TokenRepository extends MongoRepository<Token, String> {
    Optional<Token> findById(String id);
    Optional<Token> findByAccountId(String accountId);
}