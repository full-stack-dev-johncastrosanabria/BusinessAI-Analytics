package com.businessai.documents.controller;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.businessai.documents.entity.Document;
import com.businessai.documents.entity.ExtractionStatus;
import com.businessai.documents.service.DocumentService;

/**
 * Unit tests for DocumentController using @WebMvcTest and MockMvc.
 * Tests all endpoints: upload, retrieve, list, content retrieval, and delete.
 * Covers success paths, validation errors, and not-found scenarios.
 *
 * Validates: Requirements 2.3.2
 */
@WebMvcTest(DocumentController.class)
@DisplayName("DocumentController Tests")
class DocumentControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DocumentService documentService;

    private Document sampleDocument;

    @BeforeEach
    void setUp() {
        sampleDocument = new Document("report.pdf", 2048L, "PDF");
        sampleDocument.setId(1L);
        sampleDocument.setUploadDate(LocalDateTime.of(2024, 6, 1, 10, 0, 0));
        sampleDocument.setExtractionStatus(ExtractionStatus.SUCCESS);
        sampleDocument.setExtractedText("Sample extracted text from PDF.");
    }

    // ==================== POST /api/documents/upload ====================

    @Nested
    @DisplayName("POST /api/documents/upload")
    class UploadDocumentTests {

        @Test
        @DisplayName("Should upload valid file and return 201 with document metadata")
        void uploadDocument_WithValidFile_ShouldReturn201AndDocument() throws Exception {
            // Arrange
            MockMultipartFile file = new MockMultipartFile(
                    "file", "report.pdf", "application/pdf",
                    "PDF content".getBytes());
            when(documentService.uploadDocument(any())).thenReturn(sampleDocument);

            // Act & Assert
            mockMvc.perform(multipart("/api/documents/upload").file(file))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.filename").value("report.pdf"))
                    .andExpect(jsonPath("$.fileType").value("PDF"))
                    .andExpect(jsonPath("$.fileSize").value(2048))
                    .andExpect(jsonPath("$.extractionStatus").value("SUCCESS"));

            verify(documentService, times(1)).uploadDocument(any());
        }

        @Test
        @DisplayName("Should return 400 when service throws IllegalArgumentException for empty file")
        void uploadDocument_WithEmptyFile_ShouldReturn400() throws Exception {
            // Arrange
            MockMultipartFile emptyFile = new MockMultipartFile(
                    "file", "empty.txt", "text/plain", new byte[0]);
            when(documentService.uploadDocument(any()))
                    .thenThrow(new IllegalArgumentException("File cannot be empty"));

            // Act & Assert
            mockMvc.perform(multipart("/api/documents/upload").file(emptyFile))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("File cannot be empty"));

            verify(documentService, times(1)).uploadDocument(any());
        }

        @Test
        @DisplayName("Should return 400 when service throws IllegalArgumentException for invalid format")
        void uploadDocument_WithInvalidFormat_ShouldReturn400() throws Exception {
            // Arrange
            MockMultipartFile invalidFile = new MockMultipartFile(
                    "file", "script.exe", "application/x-msdownload",
                    "binary content".getBytes());
            when(documentService.uploadDocument(any()))
                    .thenThrow(new IllegalArgumentException(
                            "File format not allowed. Allowed formats: TXT,DOCX,PDF,XLSX"));

            // Act & Assert
            mockMvc.perform(multipart("/api/documents/upload").file(invalidFile))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value(
                            "File format not allowed. Allowed formats: TXT,DOCX,PDF,XLSX"));

            verify(documentService, times(1)).uploadDocument(any());
        }

        @Test
        @DisplayName("Should return 400 when service throws IllegalArgumentException for oversized file")
        void uploadDocument_WithOversizedFile_ShouldReturn400() throws Exception {
            // Arrange
            MockMultipartFile oversizedFile = new MockMultipartFile(
                    "file", "huge.txt", "text/plain", "content".getBytes());
            when(documentService.uploadDocument(any()))
                    .thenThrow(new IllegalArgumentException(
                            "File size exceeds maximum allowed size of 52428800 bytes"));

            // Act & Assert
            mockMvc.perform(multipart("/api/documents/upload").file(oversizedFile))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value(
                            "File size exceeds maximum allowed size of 52428800 bytes"));

            verify(documentService, times(1)).uploadDocument(any());
        }

        @Test
        @DisplayName("Should upload TXT file and return 201")
        void uploadDocument_WithTxtFile_ShouldReturn201() throws Exception {
            // Arrange
            Document txtDoc = new Document("notes.txt", 512L, "TXT");
            txtDoc.setId(2L);
            txtDoc.setExtractionStatus(ExtractionStatus.SUCCESS);
            txtDoc.setExtractedText("Plain text content.");

            MockMultipartFile txtFile = new MockMultipartFile(
                    "file", "notes.txt", "text/plain", "Plain text content.".getBytes());
            when(documentService.uploadDocument(any())).thenReturn(txtDoc);

            // Act & Assert
            mockMvc.perform(multipart("/api/documents/upload").file(txtFile))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(2))
                    .andExpect(jsonPath("$.filename").value("notes.txt"))
                    .andExpect(jsonPath("$.fileType").value("TXT"));

            verify(documentService, times(1)).uploadDocument(any());
        }

        @Test
        @DisplayName("Should upload DOCX file and return 201")
        void uploadDocument_WithDocxFile_ShouldReturn201() throws Exception {
            // Arrange
            Document docxDoc = new Document("contract.docx", 10240L, "DOCX");
            docxDoc.setId(3L);
            docxDoc.setExtractionStatus(ExtractionStatus.SUCCESS);

            MockMultipartFile docxFile = new MockMultipartFile(
                    "file", "contract.docx",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "docx content".getBytes());
            when(documentService.uploadDocument(any())).thenReturn(docxDoc);

            // Act & Assert
            mockMvc.perform(multipart("/api/documents/upload").file(docxFile))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.filename").value("contract.docx"))
                    .andExpect(jsonPath("$.fileType").value("DOCX"));

            verify(documentService, times(1)).uploadDocument(any());
        }

        @Test
        @DisplayName("Should return 400 when service throws IllegalArgumentException for missing filename extension")
        void uploadDocument_WithMissingExtension_ShouldReturn400() throws Exception {
            // Arrange
            MockMultipartFile noExtFile = new MockMultipartFile(
                    "file", "noextension", "text/plain", "content".getBytes());
            when(documentService.uploadDocument(any()))
                    .thenThrow(new IllegalArgumentException("Invalid filename"));

            // Act & Assert
            mockMvc.perform(multipart("/api/documents/upload").file(noExtFile))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Invalid filename"));

            verify(documentService, times(1)).uploadDocument(any());
        }
    }

    // ==================== GET /api/documents/{id} ====================

    @Nested
    @DisplayName("GET /api/documents/{id}")
    class GetDocumentTests {

        @Test
        @DisplayName("Should return 200 and document when document exists")
        void getDocument_WithExistingId_ShouldReturn200AndDocument() throws Exception {
            // Arrange
            when(documentService.getDocument(1L)).thenReturn(Optional.of(sampleDocument));

            // Act & Assert
            mockMvc.perform(get("/api/documents/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.filename").value("report.pdf"))
                    .andExpect(jsonPath("$.fileType").value("PDF"))
                    .andExpect(jsonPath("$.fileSize").value(2048))
                    .andExpect(jsonPath("$.extractionStatus").value("SUCCESS"));

            verify(documentService, times(1)).getDocument(1L);
        }

        @Test
        @DisplayName("Should return 404 when document does not exist")
        void getDocument_WithNonExistingId_ShouldReturn404() throws Exception {
            // Arrange
            when(documentService.getDocument(999L)).thenReturn(Optional.empty());

            // Act & Assert
            mockMvc.perform(get("/api/documents/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.error").value("Document not found"));

            verify(documentService, times(1)).getDocument(999L);
        }

        @Test
        @DisplayName("Should return 400 when ID is zero")
        void getDocument_WithZeroId_ShouldReturn400() throws Exception {
            // Act & Assert
            mockMvc.perform(get("/api/documents/0"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Invalid document ID"));

            verify(documentService, never()).getDocument(any());
        }

        @Test
        @DisplayName("Should return 400 when ID is negative")
        void getDocument_WithNegativeId_ShouldReturn400() throws Exception {
            // Act & Assert
            mockMvc.perform(get("/api/documents/-1"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Invalid document ID"));

            verify(documentService, never()).getDocument(any());
        }
    }

    // ==================== GET /api/documents ====================

    @Nested
    @DisplayName("GET /api/documents")
    class ListDocumentsTests {

        @Test
        @DisplayName("Should return 200 and list of documents")
        void listDocuments_ShouldReturn200AndDocumentList() throws Exception {
            // Arrange
            Document doc2 = new Document("spreadsheet.xlsx", 4096L, "XLSX");
            doc2.setId(2L);
            doc2.setExtractionStatus(ExtractionStatus.SUCCESS);

            List<Document> documents = Arrays.asList(sampleDocument, doc2);
            when(documentService.getAllDocuments()).thenReturn(documents);

            // Act & Assert
            mockMvc.perform(get("/api/documents"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(2)))
                    .andExpect(jsonPath("$[0].id").value(1))
                    .andExpect(jsonPath("$[0].filename").value("report.pdf"))
                    .andExpect(jsonPath("$[1].id").value(2))
                    .andExpect(jsonPath("$[1].filename").value("spreadsheet.xlsx"));

            verify(documentService, times(1)).getAllDocuments();
        }

        @Test
        @DisplayName("Should return 200 and empty array when no documents exist")
        void listDocuments_WithNoDocuments_ShouldReturn200AndEmptyArray() throws Exception {
            // Arrange
            when(documentService.getAllDocuments()).thenReturn(Collections.emptyList());

            // Act & Assert
            mockMvc.perform(get("/api/documents"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));

            verify(documentService, times(1)).getAllDocuments();
        }
    }

    // ==================== GET /api/documents/{id}/content ====================

    @Nested
    @DisplayName("GET /api/documents/{id}/content")
    class GetDocumentContentTests {

        @Test
        @DisplayName("Should return 200 and extracted text when document content exists")
        void getDocumentContent_WithExistingId_ShouldReturn200AndContent() throws Exception {
            // Arrange
            when(documentService.getDocumentContent(1L))
                    .thenReturn(Optional.of("Sample extracted text from PDF."));

            // Act & Assert
            mockMvc.perform(get("/api/documents/1/content"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").value("Sample extracted text from PDF."));

            verify(documentService, times(1)).getDocumentContent(1L);
        }

        @Test
        @DisplayName("Should return 404 when document content does not exist")
        void getDocumentContent_WithNonExistingId_ShouldReturn404() throws Exception {
            // Arrange
            when(documentService.getDocumentContent(999L)).thenReturn(Optional.empty());

            // Act & Assert
            mockMvc.perform(get("/api/documents/999/content"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.error").value("Document not found"));

            verify(documentService, times(1)).getDocumentContent(999L);
        }

        @Test
        @DisplayName("Should return 400 when ID is zero for content endpoint")
        void getDocumentContent_WithZeroId_ShouldReturn400() throws Exception {
            // Act & Assert
            mockMvc.perform(get("/api/documents/0/content"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Invalid document ID"));

            verify(documentService, never()).getDocumentContent(any());
        }

        @Test
        @DisplayName("Should return 400 when ID is negative for content endpoint")
        void getDocumentContent_WithNegativeId_ShouldReturn400() throws Exception {
            // Act & Assert
            mockMvc.perform(get("/api/documents/-5/content"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Invalid document ID"));

            verify(documentService, never()).getDocumentContent(any());
        }
    }

    // ==================== DELETE /api/documents/{id} ====================

    @Nested
    @DisplayName("DELETE /api/documents/{id}")
    class DeleteDocumentTests {

        @Test
        @DisplayName("Should return 200 with success message when document is deleted")
        void deleteDocument_WithExistingId_ShouldReturn200AndSuccessMessage() throws Exception {
            // Arrange
            when(documentService.getDocument(1L)).thenReturn(Optional.of(sampleDocument));
            doNothing().when(documentService).deleteDocument(1L);

            // Act & Assert
            mockMvc.perform(delete("/api/documents/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Document deleted successfully"));

            verify(documentService, times(1)).getDocument(1L);
            verify(documentService, times(1)).deleteDocument(1L);
        }

        @Test
        @DisplayName("Should return 404 when document to delete does not exist")
        void deleteDocument_WithNonExistingId_ShouldReturn404() throws Exception {
            // Arrange
            when(documentService.getDocument(999L)).thenReturn(Optional.empty());

            // Act & Assert
            mockMvc.perform(delete("/api/documents/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.error").value("Document not found"));

            verify(documentService, times(1)).getDocument(999L);
            verify(documentService, never()).deleteDocument(any());
        }

        @Test
        @DisplayName("Should return 400 when ID is zero for delete endpoint")
        void deleteDocument_WithZeroId_ShouldReturn400() throws Exception {
            // Act & Assert
            mockMvc.perform(delete("/api/documents/0"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Invalid document ID"));

            verify(documentService, never()).getDocument(any());
            verify(documentService, never()).deleteDocument(any());
        }

        @Test
        @DisplayName("Should return 400 when ID is negative for delete endpoint")
        void deleteDocument_WithNegativeId_ShouldReturn400() throws Exception {
            // Act & Assert
            mockMvc.perform(delete("/api/documents/-3"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Invalid document ID"));

            verify(documentService, never()).getDocument(any());
            verify(documentService, never()).deleteDocument(any());
        }
    }
}
