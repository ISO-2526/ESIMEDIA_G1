package grupo1.esimedia.accounts.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import grupo1.esimedia.accounts.model.EmailVerificationCode;

import java.util.Optional;

public interface VerificationCodeRepository extends MongoRepository<EmailVerificationCode, String> {
    Optional<EmailVerificationCode> findByEmail(String email);
    void deleteByEmail(String email);
}
