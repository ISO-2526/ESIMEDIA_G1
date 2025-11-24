package grupo1.esimedia.Accounts.repository;

import grupo1.esimedia.Accounts.model.EmailVerificationCode;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface VerificationCodeRepository extends MongoRepository<EmailVerificationCode, String> {
    Optional<EmailVerificationCode> findByEmail(String email);
    void deleteByEmail(String email);
}
