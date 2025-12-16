package com.esimedia.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {
    
    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> otpBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> otpDailyBuckets = new ConcurrentHashMap<>();
    
    /**
     * Verificar rate limit para login: 5 intentos / 5 min por IP+email
     */
    public boolean allowLogin(String ipAddress, String email) {
        String key = ipAddress + ":" + email;
        Bucket bucket = loginBuckets.computeIfAbsent(key, k -> createLoginBucket());
        return bucket.tryConsume(1);
    }
    
    /**
     * Verificar rate limit para OTP: 3 envíos / hora
     */
    public boolean allowOtpHourly(String email) {
        Bucket bucket = otpBuckets.computeIfAbsent(email, k -> createOtpHourlyBucket());
        return bucket.tryConsume(1);
    }
    
    /**
     * Verificar rate limit para OTP: 10 envíos / día
     */
    public boolean allowOtpDaily(String email) {
        Bucket bucket = otpDailyBuckets.computeIfAbsent(email, k -> createOtpDailyBucket());
        return bucket.tryConsume(1);
    }
    
    private Bucket createLoginBucket() {
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(5)));
        return Bucket.builder().addLimit(limit).build();
    }
    
    private Bucket createOtpHourlyBucket() {
        Bandwidth limit = Bandwidth.classic(3, Refill.intervally(3, Duration.ofHours(1)));
        return Bucket.builder().addLimit(limit).build();
    }
    
    private Bucket createOtpDailyBucket() {
        Bandwidth limit = Bandwidth.classic(10, Refill.intervally(10, Duration.ofDays(1)));
        return Bucket.builder().addLimit(limit).build();
    }
}