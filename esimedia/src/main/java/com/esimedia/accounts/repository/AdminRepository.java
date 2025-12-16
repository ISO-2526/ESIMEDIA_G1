package com.esimedia.accounts.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.esimedia.accounts.model.Admin;

public interface AdminRepository extends MongoRepository<Admin, String> {

    Admin findByResetToken(String resetToken);

}
