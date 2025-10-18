package com.quickshare.backend.util;

import com.quickshare.backend.repository.RoomRepository;
import com.quickshare.backend.repository.SessionRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Random;

@Component
@AllArgsConstructor
public class StringUtilities {

    private final SessionRepository sessionRepository;
    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int SESSION_ID_LENGTH = 6;
    private static final int ROOM_CODE_LENGTH = 8;
    private final RoomRepository roomRepository;

    private static final Random random = new Random();

    public String generateRandomSessionId() {
        StringBuilder sessionId = new StringBuilder(SESSION_ID_LENGTH);

        for (int i = 0; i < SESSION_ID_LENGTH; i++) {
            int index = random.nextInt(CHARS.length());
            sessionId.append(CHARS.charAt(index));
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

    public String generateUniqueRoomCode() {
        String code;
        do {
            code = generateRandomCode();
        }while (roomRepository.findByRoomCode(code).isPresent());
        return code;
    }

    private String generateRandomCode() {
        StringBuilder code = new StringBuilder();
        for(int i=0; i<ROOM_CODE_LENGTH; i++) {
            code.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        return code.toString();
    }
}
