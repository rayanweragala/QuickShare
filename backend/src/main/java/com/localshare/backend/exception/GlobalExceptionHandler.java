package com.localshare.backend.exception;

import com.localshare.backend.dto.SessionResponse;
import com.localshare.backend.util.LoggerUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

/**
 * exception handler for all REST controller classes
 */

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<SessionResponse> handleIllegalState(IllegalStateException exception, WebRequest request){
        LoggerUtil.warn(GlobalExceptionHandler.class,"illegalState error, message=" + exception.getMessage() + ",for path=" + request.getDescription(false));

        SessionResponse response = SessionResponse.error(exception.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<SessionResponse> handleIllegalArgument(IllegalArgumentException exception, WebRequest request){
        LoggerUtil.warn(GlobalExceptionHandler.class,"illegalArgument error, message=" + exception.getMessage() + ",for path=" + request.getDescription(false));

        SessionResponse response = SessionResponse.error(exception.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<SessionResponse> handleException(Exception exception, WebRequest request){
        LoggerUtil.error(GlobalExceptionHandler.class, "unexpected error, message=" + exception.getMessage() + ",for path=" + request.getDescription(false),exception);

        SessionResponse response = SessionResponse.error("internal server error");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<SessionResponse> handleNullPointerException(Exception exception, WebRequest request){
        LoggerUtil.error(GlobalExceptionHandler.class,"null pointer error, message=" + exception.getMessage() + ",for path=" + request.getDescription(false),exception);

        SessionResponse response = SessionResponse.error("internal server error");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

}
