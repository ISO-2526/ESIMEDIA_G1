package grupo1.esimedia.accounts.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import grupo1.esimedia.accounts.model.Admin;

public interface AdminRepository extends MongoRepository<Admin, String> {

    Admin findByResetToken(String resetToken);

}
