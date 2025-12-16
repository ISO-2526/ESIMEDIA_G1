package com.esimedia.accounts.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.esimedia.accounts.model.ContentCreator;

import java.util.Optional;

public interface ContentCreatorRepository extends MongoRepository<ContentCreator, String> {
	boolean existsByAlias(String alias);
    Optional<ContentCreator> findByEmail(String email);
    Optional<ContentCreator> findByAlias(String alias);
    ContentCreator findByResetToken(String resetToken);
}
