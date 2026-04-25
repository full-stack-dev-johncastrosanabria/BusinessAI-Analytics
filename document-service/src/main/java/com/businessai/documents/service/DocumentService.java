package com.businessai.documents.service;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.businessai.documents.component.TextExtractor;
import com.businessai.documents.entity.Document;
import com.businessai.documents.entity.ExtractionStatus;
import com.businessai.documents.repository.DocumentRepository;

@Service
public class DocumentService {
    
    @Autowired
    public DocumentRepository documentRepository;
    
    @Autowired
    public TextExtractor textExtractor;
    
    @Value("${document.upload.max-file-size:52428800}")
    public long maxFileSize;
    
    @Value("${document.upload.allowed-types:TXT,DOCX,PDF,XLSX}")
    public String allowedTypes;
    
    /**
     * Upload a document and extract its text
     * @param file the document file to upload
     * @return the saved Document entity
     * @throws IllegalArgumentException if file format is invalid or file size exceeds limit
     */
    public Document uploadDocument(MultipartFile file) {
        // Validate file is not empty
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }
        
        // Extract file type from filename
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.contains(".")) {
            throw new IllegalArgumentException("Invalid filename");
        }
        
        String fileType = filename.substring(filename.lastIndexOf(".") + 1).toUpperCase();
        
        // Validate file format
        if (!isAllowedFileType(fileType)) {
            throw new IllegalArgumentException("File format not allowed. Allowed formats: " + allowedTypes);
        }
        
        // Validate file size
        long fileSize = file.getSize();
        if (fileSize > maxFileSize) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size of " + maxFileSize + " bytes");
        }
        
        // Create document entity
        Document document = new Document(filename, fileSize, fileType);
        
        // Extract text
        try {
            String extractedText = textExtractor.extractText(file, fileType);
            
            // Limit extracted text to 1000000 characters
            if (extractedText.length() > 1000000) {
                extractedText = extractedText.substring(0, 1000000);
            }
            
            document.setExtractedText(extractedText);
            document.setExtractionStatus(ExtractionStatus.SUCCESS);
        } catch (IOException e) {
            document.setExtractionStatus(ExtractionStatus.FAILED);
            document.setErrorMessage("Text extraction failed: " + e.getMessage());
        } catch (Exception e) {
            document.setExtractionStatus(ExtractionStatus.FAILED);
            document.setErrorMessage("Unexpected error during extraction: " + e.getMessage());
        }
        
        // Save document
        return documentRepository.save(document);
    }
    
    /**
     * Retrieve a document by ID
     * @param id the document ID
     * @return the Document if found
     */
    public Optional<Document> getDocument(Long id) {
        return documentRepository.findById(id);
    }
    
    /**
     * Get all documents
     * @return list of all documents
     */
    public List<Document> getAllDocuments() {
        return documentRepository.findAll();
    }
    
    /**
     * Get extracted text content for a document
     * @param id the document ID
     * @return the extracted text content
     */
    public Optional<String> getDocumentContent(Long id) {
        return documentRepository.findById(id)
            .map(Document::getExtractedText);
    }
    
    /**
     * Delete a document
     * @param id the document ID
     */
    public void deleteDocument(Long id) {
        documentRepository.deleteById(id);
    }
    
    /**
     * Check if file type is allowed
     * @param fileType the file type to check
     * @return true if file type is allowed
     */
    private boolean isAllowedFileType(String fileType) {
        String[] types = allowedTypes.split(",");
        for (String type : types) {
            if (type.trim().equalsIgnoreCase(fileType)) {
                return true;
            }
        }
        return false;
    }
}
