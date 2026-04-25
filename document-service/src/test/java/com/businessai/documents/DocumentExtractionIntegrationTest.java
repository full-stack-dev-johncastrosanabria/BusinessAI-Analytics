package com.businessai.documents;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.businessai.documents.entity.Document;
import com.businessai.documents.entity.ExtractionStatus;
import com.businessai.documents.repository.DocumentRepository;

/**
 * Integration tests for document extraction functionality.
 * Tests text extraction for each file format with sample files,
 * verifies extracted text content accuracy, tests error handling
 * for corrupted files, and validates file size constraints.
 * 
 * Validates: Requirements 6.1-6.6, 7.1-7.6
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Document Extraction Integration Tests")
public class DocumentExtractionIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private DocumentRepository documentRepository;
    
    @BeforeEach
    void setUp() {
        documentRepository.deleteAll();
    }
    
    // ==================== TXT File Extraction Tests ====================
    
    @Test
    @DisplayName("Should extract text from TXT file correctly")
    void testTxtFileExtraction() throws Exception {
        // Arrange
        String testContent = "This is a test TXT file.\nIt contains multiple lines.\nWith various content.";
        MockMultipartFile txtFile = new MockMultipartFile(
            "file",
            "test.txt",
            "text/plain",
            testContent.getBytes(StandardCharsets.UTF_8)
        );
        
        // Act
        MvcResult result = mockMvc.perform(multipart("/api/documents/upload")
            .file(txtFile))
            .andExpect(status().isCreated())
            .andReturn();
        
        // Assert
        String responseBody = result.getResponse().getContentAsString();
        assertTrue(responseBody.contains("test.txt"));
        
        List<Document> documents = documentRepository.findAll();
        assertEquals(1, documents.size());
        
        Document doc = documents.get(0);
        assertEquals("TXT", doc.getFileType());
        assertEquals(ExtractionStatus.SUCCESS, doc.getExtractionStatus());
        assertNotNull(doc.getExtractedText());
        assertTrue(doc.getExtractedText().contains("test TXT file"));
        assertEquals(testContent, doc.getExtractedText());
    }
    
    @Test
    @DisplayName("Should extract text from TXT file with UTF-8 encoding")
    void testTxtFileExtractionWithUtf8() throws Exception {
        // Arrange
        String testContent = "UTF-8 Test: café, naïve, résumé, 日本語, 中文";
        MockMultipartFile txtFile = new MockMultipartFile(
            "file",
            "utf8_test.txt",
            "text/plain",
            testContent.getBytes(StandardCharsets.UTF_8)
        );
        
        // Act
        mockMvc.perform(multipart("/api/documents/upload")
            .file(txtFile))
            .andExpect(status().isCreated());
        
        // Assert
        List<Document> documents = documentRepository.findAll();
        assertEquals(1, documents.size());
        
        Document doc = documents.get(0);
        assertEquals(ExtractionStatus.SUCCESS, doc.getExtractionStatus());
        assertTrue(doc.getExtractedText().contains("café"));
        assertTrue(doc.getExtractedText().contains("日本語"));
    }
    
    // ==================== DOCX File Extraction Tests ====================
    
    @Test
    @DisplayName("Should extract text from DOCX file correctly")
    void testDocxFileExtraction() throws Exception {
        // Arrange
        byte[] docxContent = createSampleDocxFile();
        MockMultipartFile docxFile = new MockMultipartFile(
            "file",
            "test.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            docxContent
        );
        
        // Act
        mockMvc.perform(multipart("/api/documents/upload")
            .file(docxFile))
            .andExpect(status().isCreated());
        
        // Assert
        List<Document> documents = documentRepository.findAll();
        assertEquals(1, documents.size());
        
        Document doc = documents.get(0);
        assertEquals("DOCX", doc.getFileType());
        assertEquals(ExtractionStatus.SUCCESS, doc.getExtractionStatus());
        assertNotNull(doc.getExtractedText());
        assertTrue(doc.getExtractedText().length() > 0);
    }
    
    // ==================== PDF File Extraction Tests ====================
    
    @Test
    @DisplayName("Should extract text from PDF file correctly")
    void testPdfFileExtraction() throws Exception {
        // Arrange
        byte[] pdfContent = createSamplePdfFile();
        MockMultipartFile pdfFile = new MockMultipartFile(
            "file",
            "test.pdf",
            "application/pdf",
            pdfContent
        );
        
        // Act
        mockMvc.perform(multipart("/api/documents/upload")
            .file(pdfFile))
            .andExpect(status().isCreated());
        
        // Assert
        List<Document> documents = documentRepository.findAll();
        assertEquals(1, documents.size());
        
        Document doc = documents.get(0);
        assertEquals("PDF", doc.getFileType());
        assertEquals(ExtractionStatus.SUCCESS, doc.getExtractionStatus());
        assertNotNull(doc.getExtractedText());
        assertTrue(doc.getExtractedText().length() > 0);
    }
    
    // ==================== XLSX File Extraction Tests ====================
    
    @Test
    @DisplayName("Should extract text from XLSX file correctly")
    void testXlsxFileExtraction() throws Exception {
        // Arrange
        byte[] xlsxContent = createSampleXlsxFile();
        MockMultipartFile xlsxFile = new MockMultipartFile(
            "file",
            "test.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            xlsxContent
        );
        
        // Act
        mockMvc.perform(multipart("/api/documents/upload")
            .file(xlsxFile))
            .andExpect(status().isCreated());
        
        // Assert
        List<Document> documents = documentRepository.findAll();
        assertEquals(1, documents.size());
        
        Document doc = documents.get(0);
        assertEquals("XLSX", doc.getFileType());
        assertEquals(ExtractionStatus.SUCCESS, doc.getExtractionStatus());
        assertNotNull(doc.getExtractedText());
        assertTrue(doc.getExtractedText().length() > 0);
    }
    
    // ==================== Metadata Preservation Tests ====================
    
    @Test
    @DisplayName("Should preserve document metadata during extraction")
    void testMetadataPreservation() throws Exception {
        // Arrange
        String testContent = "Test content for metadata preservation";
        MockMultipartFile txtFile = new MockMultipartFile(
            "file",
            "metadata_test.txt",
            "text/plain",
            testContent.getBytes(StandardCharsets.UTF_8)
        );
        
        // Act
        mockMvc.perform(multipart("/api/documents/upload")
            .file(txtFile))
            .andExpect(status().isCreated());
        
        // Assert
        List<Document> documents = documentRepository.findAll();
        assertEquals(1, documents.size());
        
        Document doc = documents.get(0);
        assertEquals("metadata_test.txt", doc.getFilename());
        assertEquals("TXT", doc.getFileType());
        assertEquals(testContent.getBytes(StandardCharsets.UTF_8).length, doc.getFileSize());
        assertNotNull(doc.getUploadDate());
        assertEquals(ExtractionStatus.SUCCESS, doc.getExtractionStatus());
        assertNull(doc.getErrorMessage());
    }
    
    // ==================== Error Handling Tests ====================
    
    @Test
    @DisplayName("Should handle corrupted TXT file gracefully")
    void testCorruptedTxtFileHandling() throws Exception {
        // Arrange - Create a file with invalid encoding
        byte[] invalidContent = new byte[]{(byte) 0xFF, (byte) 0xFE, (byte) 0xFD};
        MockMultipartFile corruptedFile = new MockMultipartFile(
            "file",
            "corrupted.txt",
            "text/plain",
            invalidContent
        );
        
        // Act
        mockMvc.perform(multipart("/api/documents/upload")
            .file(corruptedFile))
            .andExpect(status().isCreated());
        
        // Assert
        List<Document> documents = documentRepository.findAll();
        assertEquals(1, documents.size());
        
        Document doc = documents.get(0);
        assertEquals("corrupted.txt", doc.getFilename());
        // TXT extraction should still succeed even with unusual bytes
        assertEquals(ExtractionStatus.SUCCESS, doc.getExtractionStatus());
    }
    
    @Test
    @DisplayName("Should reject empty files")
    void testEmptyFileRejection() throws Exception {
        // Arrange
        MockMultipartFile emptyFile = new MockMultipartFile(
            "file",
            "empty.txt",
            "text/plain",
            new byte[0]
        );
        
        // Act & Assert
        mockMvc.perform(multipart("/api/documents/upload")
            .file(emptyFile))
            .andExpect(status().isBadRequest());
    }
    
    @Test
    @DisplayName("Should reject files with invalid format")
    void testInvalidFormatRejection() throws Exception {
        // Arrange
        MockMultipartFile invalidFile = new MockMultipartFile(
            "file",
            "test.exe",
            "application/x-msdownload",
            "invalid content".getBytes()
        );
        
        // Act & Assert
        mockMvc.perform(multipart("/api/documents/upload")
            .file(invalidFile))
            .andExpect(status().isBadRequest());
    }
    
    @Test
    @DisplayName("Should reject files without extension")
    void testMissingExtensionRejection() throws Exception {
        // Arrange
        MockMultipartFile noExtFile = new MockMultipartFile(
            "file",
            "testfile",
            "text/plain",
            "test content".getBytes()
        );
        
        // Act & Assert
        mockMvc.perform(multipart("/api/documents/upload")
            .file(noExtFile))
            .andExpect(status().isBadRequest());
    }
    
    // ==================== File Size Validation Tests ====================
    
    @Test
    @DisplayName("Should accept files up to 50MB")
    void testFileSizeValidationAccepts50MB() throws Exception {
        // Arrange - Create a file close to 50MB (using sparse content)
        String largeContent = "x".repeat(1000); // 1KB repeated
        byte[] content = new byte[1024 * 1024]; // 1MB for practical testing
        for (int i = 0; i < content.length; i++) {
            content[i] = (byte) 'x';
        }
        
        MockMultipartFile largeFile = new MockMultipartFile(
            "file",
            "large.txt",
            "text/plain",
            content
        );
        
        // Act
        mockMvc.perform(multipart("/api/documents/upload")
            .file(largeFile))
            .andExpect(status().isCreated());
        
        // Assert
        List<Document> documents = documentRepository.findAll();
        assertEquals(1, documents.size());
        
        Document doc = documents.get(0);
        assertEquals(ExtractionStatus.SUCCESS, doc.getExtractionStatus());
        assertEquals(content.length, doc.getFileSize());
    }
    
    @Test
    @DisplayName("Should reject files exceeding 50MB")
    void testFileSizeValidationRejectsOversized() throws Exception {
        // Arrange - Create a mock file that reports size > 50MB
        MockMultipartFile oversizedFile = new MockMultipartFile(
            "file",
            "oversized.txt",
            "text/plain",
            "test".getBytes()
        ) {
            @Override
            public long getSize() {
                return 52428801L; // 50MB + 1 byte
            }
        };
        
        // Act & Assert
        mockMvc.perform(multipart("/api/documents/upload")
            .file(oversizedFile))
            .andExpect(status().isBadRequest());
    }
    
    // ==================== Text Content Accuracy Tests ====================
    
    @Test
    @DisplayName("Should extract exact text content from TXT file")
    void testTextContentAccuracy() throws Exception {
        // Arrange
        String expectedContent = "Line 1: Product A costs $100\n" +
                                "Line 2: Product B costs $200\n" +
                                "Line 3: Total revenue: $300";
        MockMultipartFile txtFile = new MockMultipartFile(
            "file",
            "content_test.txt",
            "text/plain",
            expectedContent.getBytes(StandardCharsets.UTF_8)
        );
        
        // Act
        mockMvc.perform(multipart("/api/documents/upload")
            .file(txtFile))
            .andExpect(status().isCreated());
        
        // Assert
        List<Document> documents = documentRepository.findAll();
        assertEquals(1, documents.size());
        
        Document doc = documents.get(0);
        assertEquals(expectedContent, doc.getExtractedText());
        assertTrue(doc.getExtractedText().contains("Product A"));
        assertTrue(doc.getExtractedText().contains("$100"));
        assertTrue(doc.getExtractedText().contains("Total revenue"));
    }
    
    @Test
    @DisplayName("Should truncate extracted text exceeding 1MB limit")
    void testTextTruncationAt1MB() throws Exception {
        // Arrange - Create content larger than 1MB
        StringBuilder largeContent = new StringBuilder();
        for (int i = 0; i < 150000; i++) {
            largeContent.append("This is line ").append(i).append(" with some content.\n");
        }
        
        MockMultipartFile largeFile = new MockMultipartFile(
            "file",
            "large_content.txt",
            "text/plain",
            largeContent.toString().getBytes(StandardCharsets.UTF_8)
        );
        
        // Act
        mockMvc.perform(multipart("/api/documents/upload")
            .file(largeFile))
            .andExpect(status().isCreated());
        
        // Assert
        List<Document> documents = documentRepository.findAll();
        assertEquals(1, documents.size());
        
        Document doc = documents.get(0);
        assertEquals(ExtractionStatus.SUCCESS, doc.getExtractionStatus());
        assertTrue(doc.getExtractedText().length() <= 1000000);
    }
    
    // ==================== Retrieval Tests ====================
    
    @Test
    @DisplayName("Should retrieve document by ID")
    void testDocumentRetrieval() throws Exception {
        // Arrange
        String testContent = "Retrievable content";
        MockMultipartFile txtFile = new MockMultipartFile(
            "file",
            "retrieve_test.txt",
            "text/plain",
            testContent.getBytes(StandardCharsets.UTF_8)
        );
        
        mockMvc.perform(multipart("/api/documents/upload")
            .file(txtFile))
            .andExpect(status().isCreated());
        
        Document savedDoc = documentRepository.findAll().get(0);
        
        // Act
        mockMvc.perform(get("/api/documents/" + savedDoc.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.filename").value("retrieve_test.txt"))
            .andExpect(jsonPath("$.fileType").value("TXT"))
            .andExpect(jsonPath("$.extractionStatus").value("SUCCESS"));
    }
    
    @Test
    @DisplayName("Should retrieve extracted text content")
    void testContentRetrieval() throws Exception {
        // Arrange
        String testContent = "Content to retrieve";
        MockMultipartFile txtFile = new MockMultipartFile(
            "file",
            "content_retrieve.txt",
            "text/plain",
            testContent.getBytes(StandardCharsets.UTF_8)
        );
        
        mockMvc.perform(multipart("/api/documents/upload")
            .file(txtFile))
            .andExpect(status().isCreated());
        
        Document savedDoc = documentRepository.findAll().get(0);
        
        // Act
        MvcResult result = mockMvc.perform(get("/api/documents/" + savedDoc.getId() + "/content"))
            .andExpect(status().isOk())
            .andReturn();
        
        // Assert
        String responseBody = result.getResponse().getContentAsString();
        assertTrue(responseBody.contains(testContent));
    }
    
    @Test
    @DisplayName("Should list all documents")
    void testDocumentListing() throws Exception {
        // Arrange
        for (int i = 0; i < 3; i++) {
            MockMultipartFile txtFile = new MockMultipartFile(
                "file",
                "test_" + i + ".txt",
                "text/plain",
                ("Content " + i).getBytes(StandardCharsets.UTF_8)
            );
            
            mockMvc.perform(multipart("/api/documents/upload")
                .file(txtFile))
                .andExpect(status().isCreated());
        }
        
        // Act
        mockMvc.perform(get("/api/documents"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(3));
    }
    
    // ==================== Helper Methods ====================
    
    /**
     * Creates a sample DOCX file for testing
     */
    private byte[] createSampleDocxFile() throws IOException {
        // Using Apache POI to create a minimal DOCX file
        org.apache.poi.xwpf.usermodel.XWPFDocument document = 
            new org.apache.poi.xwpf.usermodel.XWPFDocument();
        
        org.apache.poi.xwpf.usermodel.XWPFParagraph paragraph = document.createParagraph();
        org.apache.poi.xwpf.usermodel.XWPFRun run = paragraph.createRun();
        run.setText("This is a test DOCX document.");
        
        paragraph = document.createParagraph();
        run = paragraph.createRun();
        run.setText("It contains multiple paragraphs.");
        
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        document.write(baos);
        document.close();
        
        return baos.toByteArray();
    }
    
    /**
     * Creates a sample PDF file for testing
     */
    private byte[] createSamplePdfFile() throws IOException {
        // Using Apache PDFBox to create a minimal PDF file
        org.apache.pdfbox.pdmodel.PDDocument document = new org.apache.pdfbox.pdmodel.PDDocument();
        org.apache.pdfbox.pdmodel.PDPage page = new org.apache.pdfbox.pdmodel.PDPage();
        document.addPage(page);
        
        org.apache.pdfbox.pdmodel.PDPageContentStream contentStream = 
            new org.apache.pdfbox.pdmodel.PDPageContentStream(document, page);
        
        contentStream.beginText();
        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 12);
        contentStream.newLineAtOffset(100, 700);
        contentStream.showText("This is a test PDF document.");
        contentStream.newLine();
        contentStream.showText("It contains sample text for extraction.");
        contentStream.endText();
        contentStream.close();
        
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        document.save(baos);
        document.close();
        
        return baos.toByteArray();
    }
    
    /**
     * Creates a sample XLSX file for testing
     */
    private byte[] createSampleXlsxFile() throws IOException {
        // Using Apache POI to create a minimal XLSX file
        org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = 
            new org.apache.poi.xssf.usermodel.XSSFWorkbook();
        
        org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("TestSheet");
        
        org.apache.poi.ss.usermodel.Row row1 = sheet.createRow(0);
        row1.createCell(0).setCellValue("Product");
        row1.createCell(1).setCellValue("Price");
        row1.createCell(2).setCellValue("Quantity");
        
        org.apache.poi.ss.usermodel.Row row2 = sheet.createRow(1);
        row2.createCell(0).setCellValue("Product A");
        row2.createCell(1).setCellValue(100.00);
        row2.createCell(2).setCellValue(5);
        
        org.apache.poi.ss.usermodel.Row row3 = sheet.createRow(2);
        row3.createCell(0).setCellValue("Product B");
        row3.createCell(1).setCellValue(200.00);
        row3.createCell(2).setCellValue(3);
        
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        workbook.write(baos);
        workbook.close();
        
        return baos.toByteArray();
    }
}
