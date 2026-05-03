package com.businessai.documents.service;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import com.businessai.documents.component.TextExtractor;
import com.businessai.documents.entity.Document;
import com.businessai.documents.entity.ExtractionStatus;
import com.businessai.documents.repository.DocumentRepository;

/**
 * Unit tests for DocumentService.
 * Tests document storage logic, metadata extraction, file validation,
 * search/retrieval, and error handling.
 * Mocks DocumentRepository and TextExtractor (file system operations).
 *
 * Validates: Requirements 2.3.2
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DocumentService Tests")
class DocumentServiceTests {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private TextExtractor textExtractor;

    private DocumentService documentService;

    // Default config: 50 MB max, standard allowed types
    private static final long MAX_FILE_SIZE = 52_428_800L; // 50 MB
    private static final String ALLOWED_TYPES = "TXT,DOCX,PDF,XLSX";

    @BeforeEach
    void setUp() {
        documentService = new DocumentService(
                documentRepository, textExtractor, MAX_FILE_SIZE, ALLOWED_TYPES);
    }

    // ==================== Helper factory ====================

    private MultipartFile mockFile(String filename, long size, boolean empty) {
        MultipartFile file = org.mockito.Mockito.mock(MultipartFile.class);
        // Use lenient() so unused stubs don't fail tests that throw early
        org.mockito.Mockito.lenient().when(file.getOriginalFilename()).thenReturn(filename);
        org.mockito.Mockito.lenient().when(file.getSize()).thenReturn(size);
        org.mockito.Mockito.lenient().when(file.isEmpty()).thenReturn(empty);
        return file;
    }

    private Document savedDocument(String filename, long size, String fileType) {
        Document doc = new Document(filename, size, fileType);
        doc.setId(1L);
        return doc;
    }

    // ==================== uploadDocument ====================

    @Nested
    @DisplayName("uploadDocument()")
    class UploadDocumentTests {

        // --- Happy path: each allowed type ---

        @Test
        @DisplayName("Should upload TXT file, extract text, and save document")
        void uploadTxtFile_ShouldExtractAndSave() throws IOException {
            // Arrange
            MultipartFile file = mockFile("notes.txt", 512L, false);
            when(textExtractor.extractText(file, "TXT")).thenReturn("Hello world");
            when(documentRepository.save(any())).thenAnswer(inv -> {
                Document d = inv.getArgument(0);
                d.setId(1L);
                return d;
            });

            // Act
            Document result = documentService.uploadDocument(file);

            // Assert
            assertNotNull(result);
            assertEquals("notes.txt", result.getFilename());
            assertEquals(512L, result.getFileSize());
            assertEquals("TXT", result.getFileType());
            assertEquals("Hello world", result.getExtractedText());
            assertEquals(ExtractionStatus.SUCCESS, result.getExtractionStatus());
            verify(documentRepository, times(1)).save(any());
        }

        @Test
        @DisplayName("Should upload PDF file, extract text, and save document")
        void uploadPdfFile_ShouldExtractAndSave() throws IOException {
            // Arrange
            MultipartFile file = mockFile("report.pdf", 2048L, false);
            when(textExtractor.extractText(file, "PDF")).thenReturn("PDF content");
            when(documentRepository.save(any())).thenAnswer(inv -> {
                Document d = inv.getArgument(0);
                d.setId(2L);
                return d;
            });

            // Act
            Document result = documentService.uploadDocument(file);

            // Assert
            assertEquals("report.pdf", result.getFilename());
            assertEquals("PDF", result.getFileType());
            assertEquals("PDF content", result.getExtractedText());
            assertEquals(ExtractionStatus.SUCCESS, result.getExtractionStatus());
        }

        @Test
        @DisplayName("Should upload DOCX file, extract text, and save document")
        void uploadDocxFile_ShouldExtractAndSave() throws IOException {
            // Arrange
            MultipartFile file = mockFile("contract.docx", 10240L, false);
            when(textExtractor.extractText(file, "DOCX")).thenReturn("Contract text");
            when(documentRepository.save(any())).thenAnswer(inv -> {
                Document d = inv.getArgument(0);
                d.setId(3L);
                return d;
            });

            // Act
            Document result = documentService.uploadDocument(file);

            // Assert
            assertEquals("contract.docx", result.getFilename());
            assertEquals("DOCX", result.getFileType());
            assertEquals(ExtractionStatus.SUCCESS, result.getExtractionStatus());
        }

        @Test
        @DisplayName("Should upload XLSX file, extract text, and save document")
        void uploadXlsxFile_ShouldExtractAndSave() throws IOException {
            // Arrange
            MultipartFile file = mockFile("data.xlsx", 4096L, false);
            when(textExtractor.extractText(file, "XLSX")).thenReturn("Sheet data");
            when(documentRepository.save(any())).thenAnswer(inv -> {
                Document d = inv.getArgument(0);
                d.setId(4L);
                return d;
            });

            // Act
            Document result = documentService.uploadDocument(file);

            // Assert
            assertEquals("data.xlsx", result.getFilename());
            assertEquals("XLSX", result.getFileType());
            assertEquals(ExtractionStatus.SUCCESS, result.getExtractionStatus());
        }

        // --- Metadata preservation ---

        @Test
        @DisplayName("Should preserve filename, size, and type in saved document")
        void uploadDocument_ShouldPreserveMetadata() throws IOException {
            // Arrange
            MultipartFile file = mockFile("invoice.pdf", 20480L, false);
            when(textExtractor.extractText(any(), any())).thenReturn("Invoice text");
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Document result = documentService.uploadDocument(file);

            // Assert
            assertEquals("invoice.pdf", result.getFilename());
            assertEquals(20480L, result.getFileSize());
            assertEquals("PDF", result.getFileType());
            assertNotNull(result.getUploadDate());
        }

        @Test
        @DisplayName("Should set uploadDate on the saved document")
        void uploadDocument_ShouldSetUploadDate() throws IOException {
            // Arrange
            MultipartFile file = mockFile("file.txt", 100L, false);
            when(textExtractor.extractText(any(), any())).thenReturn("text");
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Document result = documentService.uploadDocument(file);

            // Assert
            assertNotNull(result.getUploadDate());
        }

        // --- Extracted text truncation ---

        @Test
        @DisplayName("Should truncate extracted text exceeding 1,000,000 characters")
        void uploadDocument_WhenExtractedTextExceedsLimit_ShouldTruncate() throws IOException {
            // Arrange
            String longText = "A".repeat(1_500_000);
            MultipartFile file = mockFile("big.txt", 1_500_000L, false);
            when(textExtractor.extractText(file, "TXT")).thenReturn(longText);
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Document result = documentService.uploadDocument(file);

            // Assert
            assertEquals(1_000_000, result.getExtractedText().length());
            assertEquals(ExtractionStatus.SUCCESS, result.getExtractionStatus());
        }

        @Test
        @DisplayName("Should not truncate extracted text at exactly 1,000,000 characters")
        void uploadDocument_WhenExtractedTextAtLimit_ShouldNotTruncate() throws IOException {
            // Arrange
            String exactText = "B".repeat(1_000_000);
            MultipartFile file = mockFile("exact.txt", 1_000_000L, false);
            when(textExtractor.extractText(file, "TXT")).thenReturn(exactText);
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Document result = documentService.uploadDocument(file);

            // Assert
            assertEquals(1_000_000, result.getExtractedText().length());
        }

        // --- File validation: empty file ---

        @Test
        @DisplayName("Should throw IllegalArgumentException when file is empty")
        void uploadDocument_WhenFileIsEmpty_ShouldThrow() {
            // Arrange
            MultipartFile file = mockFile("empty.txt", 0L, true);

            // Act & Assert
            IllegalArgumentException ex = assertThrows(
                    IllegalArgumentException.class,
                    () -> documentService.uploadDocument(file));
            assertEquals("File cannot be empty", ex.getMessage());
            verify(documentRepository, never()).save(any());
        }

        // --- File validation: filename issues ---

        @Test
        @DisplayName("Should throw IllegalArgumentException when filename is null")
        void uploadDocument_WhenFilenameIsNull_ShouldThrow() {
            // Arrange
            MultipartFile file = org.mockito.Mockito.mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(false);
            when(file.getOriginalFilename()).thenReturn(null);

            // Act & Assert
            IllegalArgumentException ex = assertThrows(
                    IllegalArgumentException.class,
                    () -> documentService.uploadDocument(file));
            assertEquals("Invalid filename", ex.getMessage());
            verify(documentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when filename has no extension")
        void uploadDocument_WhenFilenameHasNoExtension_ShouldThrow() {
            // Arrange
            MultipartFile file = org.mockito.Mockito.mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(false);
            when(file.getOriginalFilename()).thenReturn("noextension");

            // Act & Assert
            IllegalArgumentException ex = assertThrows(
                    IllegalArgumentException.class,
                    () -> documentService.uploadDocument(file));
            assertEquals("Invalid filename", ex.getMessage());
        }

        // --- File validation: disallowed types ---

        @Test
        @DisplayName("Should throw IllegalArgumentException for disallowed file type EXE")
        void uploadDocument_WhenFileTypeIsExe_ShouldThrow() {
            // Arrange
            MultipartFile file = mockFile("virus.exe", 1024L, false);

            // Act & Assert
            IllegalArgumentException ex = assertThrows(
                    IllegalArgumentException.class,
                    () -> documentService.uploadDocument(file));
            assertTrue(ex.getMessage().contains("File format not allowed"));
            verify(documentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException for disallowed file type ZIP")
        void uploadDocument_WhenFileTypeIsZip_ShouldThrow() {
            // Arrange
            MultipartFile file = mockFile("archive.zip", 1024L, false);

            // Act & Assert
            assertThrows(IllegalArgumentException.class,
                    () -> documentService.uploadDocument(file));
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException for disallowed file type JPG")
        void uploadDocument_WhenFileTypeIsJpg_ShouldThrow() {
            // Arrange
            MultipartFile file = mockFile("photo.jpg", 1024L, false);

            // Act & Assert
            assertThrows(IllegalArgumentException.class,
                    () -> documentService.uploadDocument(file));
        }

        @Test
        @DisplayName("Should accept file type in lowercase (case-insensitive extension)")
        void uploadDocument_WhenFileTypeIsLowercase_ShouldAccept() throws IOException {
            // Arrange — filename has lowercase extension, service uppercases it
            MultipartFile file = mockFile("notes.txt", 100L, false);
            when(textExtractor.extractText(file, "TXT")).thenReturn("text");
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Document result = documentService.uploadDocument(file);

            // Assert
            assertEquals("TXT", result.getFileType());
        }

        // --- File validation: size limits ---

        @Test
        @DisplayName("Should throw IllegalArgumentException when file exceeds max size")
        void uploadDocument_WhenFileSizeExceedsLimit_ShouldThrow() {
            // Arrange
            long oversized = MAX_FILE_SIZE + 1;
            MultipartFile file = mockFile("huge.txt", oversized, false);

            // Act & Assert
            IllegalArgumentException ex = assertThrows(
                    IllegalArgumentException.class,
                    () -> documentService.uploadDocument(file));
            assertTrue(ex.getMessage().contains("File size exceeds maximum allowed size"));
            verify(documentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should accept file at exactly the max size boundary")
        void uploadDocument_WhenFileSizeAtMaxBoundary_ShouldSucceed() throws IOException {
            // Arrange
            MultipartFile file = mockFile("boundary.txt", MAX_FILE_SIZE, false);
            when(textExtractor.extractText(file, "TXT")).thenReturn("content");
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Document result = documentService.uploadDocument(file);

            // Assert
            assertEquals(MAX_FILE_SIZE, result.getFileSize());
            assertEquals(ExtractionStatus.SUCCESS, result.getExtractionStatus());
        }

        @Test
        @DisplayName("Should accept file of 1 byte (minimum valid size)")
        void uploadDocument_WhenFileSizeIsOne_ShouldSucceed() throws IOException {
            // Arrange
            MultipartFile file = mockFile("tiny.txt", 1L, false);
            when(textExtractor.extractText(file, "TXT")).thenReturn("x");
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Document result = documentService.uploadDocument(file);

            // Assert
            assertEquals(1L, result.getFileSize());
        }

        // --- Error handling: extraction failures ---

        @Test
        @DisplayName("Should set FAILED status and error message when IOException occurs during extraction")
        void uploadDocument_WhenExtractionThrowsIOException_ShouldSetFailedStatus() throws IOException {
            // Arrange
            MultipartFile file = mockFile("corrupt.pdf", 1024L, false);
            when(textExtractor.extractText(file, "PDF"))
                    .thenThrow(new IOException("Corrupted PDF stream"));
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Document result = documentService.uploadDocument(file);

            // Assert
            assertEquals(ExtractionStatus.FAILED, result.getExtractionStatus());
            assertNotNull(result.getErrorMessage());
            assertTrue(result.getErrorMessage().contains("Text extraction failed"));
            assertTrue(result.getErrorMessage().contains("Corrupted PDF stream"));
            assertNull(result.getExtractedText());
            // Document is still saved even when extraction fails
            verify(documentRepository, times(1)).save(any());
        }

        @Test
        @DisplayName("Should set FAILED status and error message when RuntimeException occurs during extraction")
        void uploadDocument_WhenExtractionThrowsRuntimeException_ShouldSetFailedStatus() throws IOException {
            // Arrange
            MultipartFile file = mockFile("bad.docx", 2048L, false);
            when(textExtractor.extractText(file, "DOCX"))
                    .thenThrow(new RuntimeException("Unexpected parsing error"));
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Document result = documentService.uploadDocument(file);

            // Assert
            assertEquals(ExtractionStatus.FAILED, result.getExtractionStatus());
            assertNotNull(result.getErrorMessage());
            assertTrue(result.getErrorMessage().contains("Unexpected error during extraction"));
            assertTrue(result.getErrorMessage().contains("Unexpected parsing error"));
            verify(documentRepository, times(1)).save(any());
        }

        @Test
        @DisplayName("Should still save document to repository even when extraction fails")
        void uploadDocument_WhenExtractionFails_ShouldStillSaveDocument() throws IOException {
            // Arrange
            MultipartFile file = mockFile("fail.xlsx", 512L, false);
            when(textExtractor.extractText(file, "XLSX"))
                    .thenThrow(new IOException("XLSX parse error"));
            when(documentRepository.save(any())).thenAnswer(inv -> {
                Document d = inv.getArgument(0);
                d.setId(99L);
                return d;
            });

            // Act
            Document result = documentService.uploadDocument(file);

            // Assert
            assertNotNull(result);
            assertEquals(ExtractionStatus.FAILED, result.getExtractionStatus());
            verify(documentRepository, times(1)).save(any());
        }
    }

    // ==================== getDocument ====================

    @Nested
    @DisplayName("getDocument()")
    class GetDocumentTests {

        @Test
        @DisplayName("Should return document when it exists in repository")
        void getDocument_WhenExists_ShouldReturnDocument() {
            // Arrange
            Document doc = savedDocument("report.pdf", 2048L, "PDF");
            when(documentRepository.findById(1L)).thenReturn(Optional.of(doc));

            // Act
            Optional<Document> result = documentService.getDocument(1L);

            // Assert
            assertTrue(result.isPresent());
            assertEquals("report.pdf", result.get().getFilename());
            verify(documentRepository, times(1)).findById(1L);
        }

        @Test
        @DisplayName("Should return empty Optional when document does not exist")
        void getDocument_WhenNotExists_ShouldReturnEmpty() {
            // Arrange
            when(documentRepository.findById(999L)).thenReturn(Optional.empty());

            // Act
            Optional<Document> result = documentService.getDocument(999L);

            // Assert
            assertTrue(result.isEmpty());
            verify(documentRepository, times(1)).findById(999L);
        }

        @Test
        @DisplayName("Should return empty Optional when ID is null (no repository call)")
        void getDocument_WhenIdIsNull_ShouldReturnEmpty() {
            // Act
            Optional<Document> result = documentService.getDocument(null);

            // Assert
            assertTrue(result.isEmpty());
            verify(documentRepository, never()).findById(any());
        }
    }

    // ==================== getAllDocuments ====================

    @Nested
    @DisplayName("getAllDocuments()")
    class GetAllDocumentsTests {

        @Test
        @DisplayName("Should return all documents from repository")
        void getAllDocuments_ShouldReturnAllDocuments() {
            // Arrange
            Document doc1 = savedDocument("file1.txt", 100L, "TXT");
            Document doc2 = savedDocument("file2.pdf", 200L, "PDF");
            doc2.setId(2L);
            when(documentRepository.findAll()).thenReturn(Arrays.asList(doc1, doc2));

            // Act
            List<Document> result = documentService.getAllDocuments();

            // Assert
            assertEquals(2, result.size());
            verify(documentRepository, times(1)).findAll();
        }

        @Test
        @DisplayName("Should return empty list when no documents exist")
        void getAllDocuments_WhenNoneExist_ShouldReturnEmptyList() {
            // Arrange
            when(documentRepository.findAll()).thenReturn(Collections.emptyList());

            // Act
            List<Document> result = documentService.getAllDocuments();

            // Assert
            assertTrue(result.isEmpty());
            verify(documentRepository, times(1)).findAll();
        }

        @Test
        @DisplayName("Should return single-element list when one document exists")
        void getAllDocuments_WhenOneExists_ShouldReturnSingletonList() {
            // Arrange
            Document doc = savedDocument("only.docx", 512L, "DOCX");
            when(documentRepository.findAll()).thenReturn(Collections.singletonList(doc));

            // Act
            List<Document> result = documentService.getAllDocuments();

            // Assert
            assertEquals(1, result.size());
            assertEquals("only.docx", result.get(0).getFilename());
        }
    }

    // ==================== getDocumentContent ====================

    @Nested
    @DisplayName("getDocumentContent()")
    class GetDocumentContentTests {

        @Test
        @DisplayName("Should return extracted text when document exists and has content")
        void getDocumentContent_WhenDocumentHasText_ShouldReturnText() {
            // Arrange
            Document doc = savedDocument("report.pdf", 2048L, "PDF");
            doc.setExtractedText("Extracted PDF content");
            when(documentRepository.findById(1L)).thenReturn(Optional.of(doc));

            // Act
            Optional<String> result = documentService.getDocumentContent(1L);

            // Assert
            assertTrue(result.isPresent());
            assertEquals("Extracted PDF content", result.get());
            verify(documentRepository, times(1)).findById(1L);
        }

        @Test
        @DisplayName("Should return empty Optional when document does not exist")
        void getDocumentContent_WhenDocumentNotFound_ShouldReturnEmpty() {
            // Arrange
            when(documentRepository.findById(42L)).thenReturn(Optional.empty());

            // Act
            Optional<String> result = documentService.getDocumentContent(42L);

            // Assert
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Should return empty Optional when ID is null (no repository call)")
        void getDocumentContent_WhenIdIsNull_ShouldReturnEmpty() {
            // Act
            Optional<String> result = documentService.getDocumentContent(null);

            // Assert
            assertTrue(result.isEmpty());
            verify(documentRepository, never()).findById(any());
        }

        @Test
        @DisplayName("Should return Optional of null when document has no extracted text")
        void getDocumentContent_WhenDocumentHasNoText_ShouldReturnOptionalOfNull() {
            // Arrange
            Document doc = savedDocument("failed.pdf", 1024L, "PDF");
            doc.setExtractionStatus(ExtractionStatus.FAILED);
            doc.setExtractedText(null);
            when(documentRepository.findById(5L)).thenReturn(Optional.of(doc));

            // Act
            Optional<String> result = documentService.getDocumentContent(5L);

            // Assert
            // Optional.of(null) would throw, but map returns Optional.empty() for null
            assertTrue(result.isEmpty());
        }
    }

    // ==================== deleteDocument ====================

    @Nested
    @DisplayName("deleteDocument()")
    class DeleteDocumentTests {

        @Test
        @DisplayName("Should call repository deleteById with correct ID")
        void deleteDocument_WithValidId_ShouldCallRepository() {
            // Act
            documentService.deleteDocument(1L);

            // Assert
            verify(documentRepository, times(1)).deleteById(1L);
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when ID is null")
        void deleteDocument_WhenIdIsNull_ShouldThrow() {
            // Act & Assert
            IllegalArgumentException ex = assertThrows(
                    IllegalArgumentException.class,
                    () -> documentService.deleteDocument(null));
            assertEquals("Document ID cannot be null", ex.getMessage());
            verify(documentRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("Should call deleteById with large ID value")
        void deleteDocument_WithLargeId_ShouldCallRepository() {
            // Act
            documentService.deleteDocument(Long.MAX_VALUE);

            // Assert
            verify(documentRepository, times(1)).deleteById(Long.MAX_VALUE);
        }
    }

    // ==================== isAllowedFileType (via uploadDocument) ====================

    @Nested
    @DisplayName("File type validation (via uploadDocument)")
    class FileTypeValidationTests {

        @Test
        @DisplayName("Should accept TXT type (case-insensitive check)")
        void fileTypeValidation_TxtIsAllowed() throws IOException {
            MultipartFile file = mockFile("doc.TXT", 100L, false);
            when(textExtractor.extractText(any(), any())).thenReturn("text");
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Document result = documentService.uploadDocument(file);
            assertEquals("TXT", result.getFileType());
        }

        @Test
        @DisplayName("Should accept PDF type")
        void fileTypeValidation_PdfIsAllowed() throws IOException {
            MultipartFile file = mockFile("doc.PDF", 100L, false);
            when(textExtractor.extractText(any(), any())).thenReturn("text");
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Document result = documentService.uploadDocument(file);
            assertEquals("PDF", result.getFileType());
        }

        @Test
        @DisplayName("Should reject DOC type (not in allowed list)")
        void fileTypeValidation_DocIsRejected() {
            MultipartFile file = mockFile("old.doc", 100L, false);
            assertThrows(IllegalArgumentException.class,
                    () -> documentService.uploadDocument(file));
        }

        @Test
        @DisplayName("Should reject XLS type (not in allowed list)")
        void fileTypeValidation_XlsIsRejected() {
            MultipartFile file = mockFile("old.xls", 100L, false);
            assertThrows(IllegalArgumentException.class,
                    () -> documentService.uploadDocument(file));
        }

        @Test
        @DisplayName("Should reject PPT type")
        void fileTypeValidation_PptIsRejected() {
            MultipartFile file = mockFile("slides.ppt", 100L, false);
            assertThrows(IllegalArgumentException.class,
                    () -> documentService.uploadDocument(file));
        }

        @Test
        @DisplayName("Should work with custom allowed types configuration")
        void fileTypeValidation_CustomAllowedTypes() throws IOException {
            // Arrange — service configured with only CSV allowed
            DocumentService customService = new DocumentService(
                    documentRepository, textExtractor, MAX_FILE_SIZE, "CSV");

            MultipartFile csvFile = mockFile("data.csv", 100L, false);
            when(textExtractor.extractText(any(), any())).thenReturn("col1,col2");
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Document result = customService.uploadDocument(csvFile);

            // Assert
            assertEquals("CSV", result.getFileType());
        }

        @Test
        @DisplayName("Should reject TXT when custom config only allows CSV")
        void fileTypeValidation_TxtRejectedWithCustomConfig() {
            // Arrange
            DocumentService customService = new DocumentService(
                    documentRepository, textExtractor, MAX_FILE_SIZE, "CSV");

            MultipartFile txtFile = mockFile("notes.txt", 100L, false);

            // Act & Assert
            assertThrows(IllegalArgumentException.class,
                    () -> customService.uploadDocument(txtFile));
        }

        @Test
        @DisplayName("Should handle allowed types with spaces around commas")
        void fileTypeValidation_AllowedTypesWithSpaces() throws IOException {
            // Arrange — spaces around type names in config
            DocumentService spacedService = new DocumentService(
                    documentRepository, textExtractor, MAX_FILE_SIZE, "TXT , PDF , DOCX");

            MultipartFile file = mockFile("notes.txt", 100L, false);
            when(textExtractor.extractText(any(), any())).thenReturn("text");
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Document result = spacedService.uploadDocument(file);

            // Assert
            assertEquals("TXT", result.getFileType());
        }
    }
}
