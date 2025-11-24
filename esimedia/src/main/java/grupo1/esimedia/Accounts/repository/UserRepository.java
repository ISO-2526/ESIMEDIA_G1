package grupo1.esimedia.Accounts.repository;

import grupo1.esimedia.Accounts.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {
    //findBytoken
    User findByResetToken(String resetToken);
}
