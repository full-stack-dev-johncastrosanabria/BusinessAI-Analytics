package com.businessai.documents.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.businessai.documents.entity.Document;
import com.businessai.documents.service.DocumentService;

/**
 * REST Controller for document management operations.
 * 
 * Security considerations:
 * - File uploads are validated for type, size, and content
 * - Extracted text is limited to prevent memory exhaustion
 * - All inputs are sanitized and validated
 * - Database queries use parameterized statements (JPA)
 */
@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    
    @Autowired
    private DocumentService documentService;
    
    /**
     * Upload a document
     * @param file the document file to upload (max 50MB)
     * @return the uploaded document metadata
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(@RequestParam("file") MultipartFile file) {
        // Validate file is not null
        if (file == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("File is required"));
        }
        
        try {
            Document document = documentService.uploadDocument(file);
            return ResponseEntity.status(HttpStatus.CREATED).body(document);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to upload document: " + e.getMessage()));
        }
    }
    
    /**
     * Retrieve document metadata by ID
     * @param id the document ID (must be positive)
     * @return the document metadata
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(@PathVariable Long id) {
        if (id == null || id <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("Invalid document ID"));
        }
        
        Optional<Document> document = documentService.getDocument(id);
        if (document.isPresent()) {
            return ResponseEntity.ok(document.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("Document not found"));
        }
    }
    
    /**
     * List all documents
     * @return list of all documents
     */
    @GetMapping
    public ResponseEntity<List<Document>> listDocuments() {
        List<Document> documents = documentService.getAllDocuments();
        return ResponseEntity.ok(documents);
    }
    
    /**
     * Retrieve extracted text content for a document
     * @param id the document ID (must be positive)
     * @return the extracted text content
     */
    @GetMapping("/{id}/content")
    public ResponseEntity<?> getDocumentContent(@PathVariable Long id) {
        if (id == null || id <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("Invalid document ID"));
        }
        
        Optional<String> content = documentService.getDocumentContent(id);
        if (content.isPresent()) {
            return ResponseEntity.ok(new ContentResponse(content.get()));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("Document not found"));
        }
    }
    
    /**
     * Delete a document
     * @param id the document ID (must be positive)
     * @return success response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        if (id == null || id <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("Invalid document ID"));
        }
        
        Optional<Document> document = documentService.getDocument(id);
        if (document.isPresent()) {
            documentService.deleteDocument(id);
            return ResponseEntity.ok(new SuccessResponse("Document deleted successfully"));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("Document not found"));
        }
    }
    
    // Response DTOs
    public static class ErrorResponse {
        public String error;
        
        public ErrorResponse(String error) {
            this.error = error;
        }
    }
    
    public static class SuccessResponse {
        public String message;
        
        public SuccessResponse(String message) {
            this.message = message;
        }
    }
    
    public static class ContentResponse {
        public String content;
        
        public ContentResponse(String content) {
            this.content = content;
        }
    }
}
