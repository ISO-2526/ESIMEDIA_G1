package grupo1.esimedia.accounts.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import grupo1.esimedia.accounts.model.User;

import java.util.List;

public interface UserRepository extends MongoRepository<User, String> {
    //findBytoken
    User findByResetToken(String resetToken);
    
    /**
     * Encuentra usuarios que tengan al menos un tag coincidente con la lista proporcionada.
     * Optimización para notificaciones: filtra directamente en MongoDB en lugar de traer todos los usuarios.
     * @param tags Lista de tags del contenido
     * @return Usuarios que tienen al menos un tag en común
     */
    @Query("{ 'tags': { $in: ?0 } }")
    List<User> findByTagsIn(List<String> tags);
}
