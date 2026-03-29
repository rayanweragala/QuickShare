package com.quickshare.backend.exception;

import com.quickshare.backend.dto.SessionResponse;
import com.quickshare.backend.util.LoggerUtil;
import org.apache.catalina.connector.ClientAbortException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.util.HashMap;
import java.util.Map;

/**
 * exception handler for all REST controller classes
 */

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ClientAbortException.class)
    public void handleClientAbortException(ClientAbortException exception, WebRequest request){
        LoggerUtil.dev("Client disconnected: " + exception.getMessage() + " for path=" + request.getDescription(false));
    }

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<SessionResponse> handleNullPointerException(NullPointerException exception, WebRequest request){
        LoggerUtil.error(GlobalExceptionHandler.class,"null pointer error, message=" + exception.getMessage() + ",for path=" + request.getDescription(false),exception);

        SessionResponse response = SessionResponse.error("internal server error");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<SessionResponse> handleIllegalArgument(IllegalArgumentException exception, WebRequest request){
        LoggerUtil.warn(GlobalExceptionHandler.class,"illegalArgument error, message=" + exception.getMessage() + ",for path=" + request.getDescription(false));

        SessionResponse response = SessionResponse.error(exception.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<SessionResponse> handleIllegalState(IllegalStateException exception, WebRequest request){
        LoggerUtil.warn(GlobalExceptionHandler.class,"illegalState error, message=" + exception.getMessage() + ",for path=" + request.getDescription(false));

        SessionResponse response = SessionResponse.error(exception.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<SessionResponse> handleRuntimeException(RuntimeException exception, WebRequest request){
        LoggerUtil.warn(GlobalExceptionHandler.class, "runtime error, message=" + exception.getMessage() + ",for path=" + request.getDescription(false));
        SessionResponse response = SessionResponse.error(exception.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<SessionResponse> handleException(Exception exception, WebRequest request){
        LoggerUtil.error(GlobalExceptionHandler.class, "unexpected error, message=" + exception.getMessage() + ",for path=" + request.getDescription(false),exception);

        SessionResponse response = SessionResponse.error("internal server error");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

}
