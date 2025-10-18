package com.localshare.backend.component;

import com.localshare.backend.repository.SessionRepository;
import com.localshare.backend.util.LoggerUtil;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Random;

@Component
@AllArgsConstructor
public class StringUtilities {

    private final SessionRepository sessionRepository;
    private static final String SESSION_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int SESSION_ID_LENGTH = 6;
    private static final Random random = new Random();

    public String generateRandomSessionId() {
        StringBuilder sessionId = new StringBuilder(SESSION_ID_LENGTH);

        for (int i = 0; i < SESSION_ID_LENGTH; i++) {
            int index = random.nextInt(SESSION_ID_CHARS.length());
            sessionId.append(SESSION_ID_CHARS.charAt(index));
        }

        return sessionId.toString();
    }
    public String generateUniqueSessionId(){
        String sessionId;
        int attempts = 0;
        int maxAttempts = 5;

        do{
            sessionId = generateRandomSessionId();
            attempts++;

            if(attempts > maxAttempts){
                LoggerUtil.error(StringUtilities.class,
                        "Failed to generate unique session ID after " + maxAttempts + " attempts",
                        null);
                throw new RuntimeException("unable to generate a session ID");
            }
        }while (sessionRepository.exists(sessionId));
        return sessionId;
    }
}
