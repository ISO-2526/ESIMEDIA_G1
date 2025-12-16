package com.esimedia.accounts.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.esimedia.accounts.model.EmailVerificationCode;

import java.util.Optional;

public interface VerificationCodeRepository extends MongoRepository<EmailVerificationCode, String> {
    Optional<EmailVerificationCode> findByEmail(String email);
    void deleteByEmail(String email);
}
