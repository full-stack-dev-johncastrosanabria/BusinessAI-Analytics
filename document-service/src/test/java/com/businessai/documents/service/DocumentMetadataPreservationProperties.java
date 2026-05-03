package com.businessai.documents.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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
import net.jqwik.api.constraints.StringLength;

/**
 * Property 14: Document Metadata Preservation
 * **Validates: Requirements 6.5**
 * 
 * Test that filename, file size, and file type are preserved after upload
 */
@PropertyDefaults(tries = 100)
public class DocumentMetadataPreservationProperties {
    
    @Property
    @Label("Filename is preserved after upload")
    void filenameIsPreservedAfterUpload(
        @ForAll @StringLength(min = 1, max = 100) String baseFilename,
        @ForAll("allowedFileTypes") String fileType) throws IOException {
        
        // Arrange
        DocumentRepository mockRepository = Mockito.mock(DocumentRepository.class);
        TextExtractor mockExtractor = Mockito.mock(TextExtractor.class);
        
        DocumentService service = new DocumentService(mockRepository, mockExtractor, 52428800L, "TXT,DOCX,PDF,XLSX");
        
        String filename = baseFilename.replaceAll("[^a-zA-Z0-9_-]", "") + "." + fileType.toLowerCase();
        if (filename.startsWith(".")) {
            filename = "file" + filename;
        }
        
        MultipartFile mockFile = createMockFile(filename, 1000, "test content");
        
        when(mockExtractor.extractText(any(), any())).thenReturn("extracted text");
        when(mockRepository.save(any())).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            doc.setId(1L);
            return doc;
        });
        
        // Act
        Document result = service.uploadDocument(mockFile);
        
        // Assert
        assertEquals(filename, result.getFilename());
    }
    
    @Property
    @Label("File size is preserved after upload")
    void fileSizeIsPreservedAfterUpload(
        @ForAll("validFileSizes") long fileSize,
        @ForAll("allowedFileTypes") String fileType) throws IOException {
        
        // Arrange
        DocumentRepository mockRepository = Mockito.mock(DocumentRepository.class);
        TextExtractor mockExtractor = Mockito.mock(TextExtractor.class);
        
        DocumentService service = new DocumentService(mockRepository, mockExtractor, 52428800L, "TXT,DOCX,PDF,XLSX");
        
        MultipartFile mockFile = createMockFile("test." + fileType.toLowerCase(), fileSize, "test content");
        
        when(mockExtractor.extractText(any(), any())).thenReturn("extracted text");
        when(mockRepository.save(any())).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            doc.setId(1L);
            return doc;
        });
        
        // Act
        Document result = service.uploadDocument(mockFile);
        
        // Assert
        assertEquals(fileSize, result.getFileSize());
    }
    
    @Property
    @Label("File type is preserved after upload")
    void fileTypeIsPreservedAfterUpload(@ForAll("allowedFileTypes") String fileType) throws IOException {
        // Arrange
        DocumentRepository mockRepository = Mockito.mock(DocumentRepository.class);
        TextExtractor mockExtractor = Mockito.mock(TextExtractor.class);
        
        DocumentService service = new DocumentService(mockRepository, mockExtractor, 52428800L, "TXT,DOCX,PDF,XLSX");
        
        MultipartFile mockFile = createMockFile("test." + fileType.toLowerCase(), 1000, "test content");
        
        when(mockExtractor.extractText(any(), any())).thenReturn("extracted text");
        when(mockRepository.save(any())).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            doc.setId(1L);
            return doc;
        });
        
        // Act
        Document result = service.uploadDocument(mockFile);
        
        // Assert
        assertEquals(fileType.toUpperCase(), result.getFileType());
    }
    
    @Property
    @Label("All metadata is preserved together after upload")
    void allMetadataIsPreservedTogether(
        @ForAll @StringLength(min = 1, max = 50) String baseFilename,
        @ForAll("validFileSizes") long fileSize,
        @ForAll("allowedFileTypes") String fileType) throws IOException {
        
        // Arrange
        DocumentRepository mockRepository = Mockito.mock(DocumentRepository.class);
        TextExtractor mockExtractor = Mockito.mock(TextExtractor.class);
        
        DocumentService service = new DocumentService(mockRepository, mockExtractor, 52428800L, "TXT,DOCX,PDF,XLSX");
        
        String filename = baseFilename.replaceAll("[^a-zA-Z0-9_-]", "") + "." + fileType.toLowerCase();
        if (filename.startsWith(".")) {
            filename = "file" + filename;
        }
        
        MultipartFile mockFile = createMockFile(filename, fileSize, "test content");
        
        when(mockExtractor.extractText(any(), any())).thenReturn("extracted text");
        when(mockRepository.save(any())).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            doc.setId(1L);
            return doc;
        });
        
        // Act
        Document result = service.uploadDocument(mockFile);
        
        // Assert
        assertEquals(filename, result.getFilename());
        assertEquals(fileSize, result.getFileSize());
        assertEquals(fileType.toUpperCase(), result.getFileType());
        assertNotNull(result.getUploadDate());
    }
    
    @Provide
    Arbitrary<String> allowedFileTypes() {
        return Arbitraries.of("TXT", "DOCX", "PDF", "XLSX");
    }
    
    @Provide
    Arbitrary<Long> validFileSizes() {
        return Arbitraries.longs().between(1, 52428800);
    }
    
    private MultipartFile createMockFile(String filename, long size, String content) {
        MultipartFile mockFile = Mockito.mock(MultipartFile.class);
        when(mockFile.getOriginalFilename()).thenReturn(filename);
        when(mockFile.getSize()).thenReturn(size);
        when(mockFile.isEmpty()).thenReturn(false);
        try {
            when(mockFile.getBytes()).thenReturn(content.getBytes(StandardCharsets.UTF_8));
        } catch (IOException ignored) {
            // Mock exception
        }
        return mockFile;
    }
}
