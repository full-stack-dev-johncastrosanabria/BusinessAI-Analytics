package com.businessai.documents.service;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mockito;
import static org.mockito.Mockito.when;
import org.springframework.web.multipart.MultipartFile;

import com.businessai.documents.component.TextExtractor;
import com.businessai.documents.entity.Document;
import com.businessai.documents.repository.DocumentRepository;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Label;
import net.jqwik.api.Property;
import net.jqwik.api.PropertyDefaults;
import net.jqwik.api.Provide;

/**
 * Property 13: Document Format Validation
 * **Validates: Requirements 6.1, 6.2**
 * 
 * Test that allowed formats are accepted and others are rejected
 */
@PropertyDefaults(tries = 100)
public class DocumentFormatValidationProperties {
    
    @Property
    @Label("Allowed formats (TXT, DOCX, PDF, XLSX) are accepted")
    void allowedFormatsAreAccepted(@ForAll("allowedFileTypes") String fileType) throws IOException {
        // Arrange
        DocumentRepository mockRepository = Mockito.mock(DocumentRepository.class);
        TextExtractor mockExtractor = Mockito.mock(TextExtractor.class);
        
        DocumentService service = new DocumentService();
        service.documentRepository = mockRepository;
        service.textExtractor = mockExtractor;
        service.maxFileSize = 52428800L;
        service.allowedTypes = "TXT,DOCX,PDF,XLSX";
        
        MultipartFile mockFile = createMockFile("test." + fileType.toLowerCase(), 1000, "test content");
        
        when(mockExtractor.extractText(any(), any())).thenReturn("extracted text");
        when(mockRepository.save(any())).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            doc.setId(1L);
            return doc;
        });
        
        // Act & Assert
        assertDoesNotThrow(() -> {
            Document result = service.uploadDocument(mockFile);
            assertNotNull(result);
            assertEquals(fileType.toUpperCase(), result.getFileType());
        });
    }
    
    @Property
    @Label("Disallowed formats are rejected")
    void disallowedFormatsAreRejected(@ForAll("disallowedFileTypes") String fileType) {
        // Arrange
        DocumentRepository mockRepository = Mockito.mock(DocumentRepository.class);
        TextExtractor mockExtractor = Mockito.mock(TextExtractor.class);
        
        DocumentService service = new DocumentService();
        service.documentRepository = mockRepository;
        service.textExtractor = mockExtractor;
        service.maxFileSize = 52428800L;
        service.allowedTypes = "TXT,DOCX,PDF,XLSX";
        
        MultipartFile mockFile = createMockFile("test." + fileType.toLowerCase(), 1000, "test content");
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            service.uploadDocument(mockFile);
        });
    }
    
    @Property
    @Label("File size validation rejects files exceeding 50MB")
    void fileSizeValidationRejectsLargeFiles() {
        // Arrange
        DocumentRepository mockRepository = Mockito.mock(DocumentRepository.class);
        TextExtractor mockExtractor = Mockito.mock(TextExtractor.class);
        
        DocumentService service = new DocumentService();
        service.documentRepository = mockRepository;
        service.textExtractor = mockExtractor;
        service.maxFileSize = 52428800L;
        service.allowedTypes = "TXT,DOCX,PDF,XLSX";
        
        // 51MB file
        long oversizeFileSize = 52428800 + 1;
        MultipartFile mockFile = createMockFile("test.txt", oversizeFileSize, "test content");
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            service.uploadDocument(mockFile);
        });
    }
    
    @Property
    @Label("File size validation accepts files up to 50MB")
    void fileSizeValidationAcceptsValidSizeFiles() throws IOException {
        // Arrange
        DocumentRepository mockRepository = Mockito.mock(DocumentRepository.class);
        TextExtractor mockExtractor = Mockito.mock(TextExtractor.class);
        
        DocumentService service = new DocumentService();
        service.documentRepository = mockRepository;
        service.textExtractor = mockExtractor;
        service.maxFileSize = 52428800L;
        service.allowedTypes = "TXT,DOCX,PDF,XLSX";
        
        // Exactly 50MB
        long validFileSize = 52428800;
        MultipartFile mockFile = createMockFile("test.txt", validFileSize, "test content");
        
        when(mockExtractor.extractText(any(), any())).thenReturn("extracted text");
        when(mockRepository.save(any())).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            doc.setId(1L);
            return doc;
        });
        
        // Act & Assert
        assertDoesNotThrow(() -> {
            Document result = service.uploadDocument(mockFile);
            assertNotNull(result);
            assertEquals(validFileSize, result.getFileSize());
        });
    }
    
    @Provide
    Arbitrary<String> allowedFileTypes() {
        return Arbitraries.of("TXT", "DOCX", "PDF", "XLSX");
    }
    
    @Provide
    Arbitrary<String> disallowedFileTypes() {
        return Arbitraries.of("DOC", "XLS", "PPT", "PPTX", "JPG", "PNG", "ZIP", "EXE", "BAT", "SH");
    }
    
    private MultipartFile createMockFile(String filename, long size, String content) {
        MultipartFile mockFile = Mockito.mock(MultipartFile.class);
        when(mockFile.getOriginalFilename()).thenReturn(filename);
        when(mockFile.getSize()).thenReturn(size);
        when(mockFile.isEmpty()).thenReturn(false);
        try {
            when(mockFile.getBytes()).thenReturn(content.getBytes());
        } catch (Exception e) {
            // Mock exception
        }
        return mockFile;
    }
}
