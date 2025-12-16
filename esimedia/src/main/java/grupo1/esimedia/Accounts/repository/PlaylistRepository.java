package grupo1.esimedia.accounts.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import grupo1.esimedia.accounts.model.Playlist;

import java.util.List;

@Repository
public interface PlaylistRepository extends MongoRepository<Playlist, String> {
    List<Playlist> findByUserEmail(String userEmail);
    List<Playlist> findByOwnerType(String ownerType);
    List<Playlist> findByOwnerTypeAndUserEmail(String ownerType, String userEmail);
    List<Playlist> findByOwnerTypeAndVisibleIsTrue(String ownerType);
    boolean existsByOwnerTypeAndNombreIgnoreCase(String ownerType, String nombre);
    boolean existsByOwnerTypeAndNombreIgnoreCaseAndIdNot(String ownerType, String nombre, String id);
}
