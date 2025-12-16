package grupo1.esimedia.accounts.dto.response;

public class ErrorResponseDTO {
    private String error;
    private Integer remainingAttempts;
    private Boolean locked;
    private Long lockoutTime;

    public ErrorResponseDTO() {}

    public ErrorResponseDTO(String error) {
        this.error = error;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public Integer getRemainingAttempts() {
        return remainingAttempts;
    }

    public void setRemainingAttempts(Integer remainingAttempts) {
        this.remainingAttempts = remainingAttempts;
    }

    public Boolean getLocked() {
        return locked;
    }

    public void setLocked(Boolean locked) {
        this.locked = locked;
    }

    public Long getLockoutTime() {
        return lockoutTime;
    }

    public void setLockoutTime(Long lockoutTime) {
        this.lockoutTime = lockoutTime;
    }
}
