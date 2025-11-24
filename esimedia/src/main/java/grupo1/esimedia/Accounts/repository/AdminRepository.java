package grupo1.esimedia.Accounts.repository;

import grupo1.esimedia.Accounts.model.Admin;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AdminRepository extends MongoRepository<Admin, String> {

    Admin findByResetToken(String resetToken);

}
