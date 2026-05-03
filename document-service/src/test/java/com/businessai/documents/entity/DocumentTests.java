package com.businessai.documents.entity;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * Comprehensive unit tests for Document entity.
 * Tests entity validation, field constraints, metadata fields,
 * ExtractionStatus lifecycle, and equals/hashCode identity contracts.
 * Validates: Requirements 2.3.2
 */
@DisplayName("Document Entity Tests")
class DocumentTests {

    private Document document;

    @BeforeEach
    void setUp() {
        document = new Document();
    }

    // ==================== Entity Validation Tests ====================

    @Nested
    @DisplayName("Entity Validation Tests")
    class EntityValidationTests {

        @Test
        @DisplayName("Should create valid document with parameterized constructor")
        void testValidDocumentCreation() {
            // Arrange
            String filename = "report.pdf";
            Long fileSize = 1024L;
            String fileType = "PDF";

            // Act
            Document doc = new Document(filename, fileSize, fileType);

            // Assert
            assertNull(doc.getId());
            assertEquals(filename, doc.getFilename());
            assertEquals(fileSize, doc.getFileSize());
            assertEquals(fileType, doc.getFileType());
            assertNotNull(doc.getUploadDate());
            assertEquals(ExtractionStatus.PENDING, doc.getExtractionStatus());
            assertNull(doc.getExtractedText());
            assertNull(doc.getErrorMessage());
        }

        @Test
        @DisplayName("Should set uploadDate to current time on parameterized construction")
        void testUploadDateSetOnConstruction() {
            // Arrange
            LocalDateTime before = LocalDateTime.now().minusSeconds(1);

            // Act
            Document doc = new Document("file.txt", 500L, "TXT");
            LocalDateTime after = LocalDateTime.now().plusSeconds(1);

            // Assert
            assertNotNull(doc.getUploadDate());
            assertTrue(doc.getUploadDate().isAfter(before) || doc.getUploadDate().isEqual(before));
            assertTrue(doc.getUploadDate().isBefore(after) || doc.getUploadDate().isEqual(after));
        }

        @Test
        @DisplayName("Should set extractionStatus to PENDING on parameterized construction")
        void testExtractionStatusPendingOnConstruction() {
            // Act
            Document doc = new Document("file.docx", 2048L, "DOCX");

            // Assert
            assertEquals(ExtractionStatus.PENDING, doc.getExtractionStatus());
        }

        @Test
        @DisplayName("Should create document with default constructor leaving all fields null")
        void testDefaultConstructor() {
            // Act
            Document doc = new Document();

            // Assert
            assertNull(doc.getId());
            assertNull(doc.getFilename());
            assertNull(doc.getUploadDate());
            assertNull(doc.getFileSize());
            assertNull(doc.getFileType());
            assertNull(doc.getExtractedText());
            assertNull(doc.getExtractionStatus());
            assertNull(doc.getErrorMessage());
        }

        @Test
        @DisplayName("Should set and get all fields via setters")
        void testAllFieldsSetAndGet() {
            // Arrange
            Long id = 1L;
            String filename = "spreadsheet.xlsx";
            LocalDateTime uploadDate = LocalDateTime.of(2024, 3, 15, 10, 30, 0);
            Long fileSize = 4096L;
            String fileType = "XLSX";
            String extractedText = "Cell A1: Revenue\nCell B1: 100000";
            ExtractionStatus status = ExtractionStatus.SUCCESS;
            String errorMessage = null;

            // Act
            document.setId(id);
            document.setFilename(filename);
            document.setUploadDate(uploadDate);
            document.setFileSize(fileSize);
            document.setFileType(fileType);
            document.setExtractedText(extractedText);
            document.setExtractionStatus(status);
            document.setErrorMessage(errorMessage);

            // Assert
            assertEquals(id, document.getId());
            assertEquals(filename, document.getFilename());
            assertEquals(uploadDate, document.getUploadDate());
            assertEquals(fileSize, document.getFileSize());
            assertEquals(fileType, document.getFileType());
            assertEquals(extractedText, document.getExtractedText());
            assertEquals(status, document.getExtractionStatus());
            assertNull(document.getErrorMessage());
        }
    }

    // ==================== Field Constraints Tests ====================

    @Nested
    @DisplayName("Field Constraints Tests")
    class FieldConstraintsTests {

        @Test
        @DisplayName("Should accept valid filename")
        void testValidFilename() {
            // Act
            document.setFilename("annual_report_2024.pdf");

            // Assert
            assertEquals("annual_report_2024.pdf", document.getFilename());
        }

        @Test
        @DisplayName("Should accept filename with spaces and special characters")
        void testFilenameWithSpecialCharacters() {
            // Act
            document.setFilename("My Document (Final) v2.docx");

            // Assert
            assertEquals("My Document (Final) v2.docx", document.getFilename());
        }

        @Test
        @DisplayName("Should accept null filename via setter")
        void testNullFilename() {
            // Act
            document.setFilename(null);

            // Assert
            assertNull(document.getFilename());
        }

        @Test
        @DisplayName("Should accept valid file size")
        void testValidFileSize() {
            // Act
            document.setFileSize(52428800L); // 50 MB

            // Assert
            assertEquals(52428800L, document.getFileSize());
        }

        @Test
        @DisplayName("Should accept minimum file size of 1 byte")
        void testMinimumFileSize() {
            // Act
            document.setFileSize(1L);

            // Assert
            assertEquals(1L, document.getFileSize());
        }

        @Test
        @DisplayName("Should accept large file size")
        void testLargeFileSize() {
            // Act
            document.setFileSize(Long.MAX_VALUE);

            // Assert
            assertEquals(Long.MAX_VALUE, document.getFileSize());
        }

        @Test
        @DisplayName("Should accept null file size via setter")
        void testNullFileSize() {
            // Act
            document.setFileSize(null);

            // Assert
            assertNull(document.getFileSize());
        }

        @Test
        @DisplayName("Should accept valid file type TXT")
        void testFileTypeTxt() {
            // Act
            document.setFileType("TXT");

            // Assert
            assertEquals("TXT", document.getFileType());
        }

        @Test
        @DisplayName("Should accept valid file type DOCX")
        void testFileTypeDocx() {
            // Act
            document.setFileType("DOCX");

            // Assert
            assertEquals("DOCX", document.getFileType());
        }

        @Test
        @DisplayName("Should accept valid file type PDF")
        void testFileTypePdf() {
            // Act
            document.setFileType("PDF");

            // Assert
            assertEquals("PDF", document.getFileType());
        }

        @Test
        @DisplayName("Should accept valid file type XLSX")
        void testFileTypeXlsx() {
            // Act
            document.setFileType("XLSX");

            // Assert
            assertEquals("XLSX", document.getFileType());
        }

        @Test
        @DisplayName("Should accept null file type via setter")
        void testNullFileType() {
            // Act
            document.setFileType(null);

            // Assert
            assertNull(document.getFileType());
        }
    }

    // ==================== Metadata Field Tests ====================

    @Nested
    @DisplayName("Metadata Field Tests")
    class MetadataFieldTests {

        @Test
        @DisplayName("Should set and get extracted text")
        void testExtractedText() {
            // Arrange
            String text = "This is the extracted content from the document.";

            // Act
            document.setExtractedText(text);

            // Assert
            assertEquals(text, document.getExtractedText());
        }

        @Test
        @DisplayName("Should accept null extracted text")
        void testNullExtractedText() {
            // Act
            document.setExtractedText(null);

            // Assert
            assertNull(document.getExtractedText());
        }

        @Test
        @DisplayName("Should accept large extracted text")
        void testLargeExtractedText() {
            // Arrange
            String largeText = "A".repeat(1_000_000); // 1 MB of text

            // Act
            document.setExtractedText(largeText);

            // Assert
            assertEquals(largeText, document.getExtractedText());
            assertEquals(1_000_000, document.getExtractedText().length());
        }

        @Test
        @DisplayName("Should set and get error message")
        void testErrorMessage() {
            // Arrange
            String errorMsg = "Failed to extract text: unsupported encoding";

            // Act
            document.setErrorMessage(errorMsg);

            // Assert
            assertEquals(errorMsg, document.getErrorMessage());
        }

        @Test
        @DisplayName("Should accept null error message")
        void testNullErrorMessage() {
            // Act
            document.setErrorMessage(null);

            // Assert
            assertNull(document.getErrorMessage());
        }

        @Test
        @DisplayName("Should set and get upload date")
        void testUploadDate() {
            // Arrange
            LocalDateTime uploadDate = LocalDateTime.of(2024, 6, 1, 9, 0, 0);

            // Act
            document.setUploadDate(uploadDate);

            // Assert
            assertEquals(uploadDate, document.getUploadDate());
        }

        @Test
        @DisplayName("Should accept null upload date via setter")
        void testNullUploadDate() {
            // Act
            document.setUploadDate(null);

            // Assert
            assertNull(document.getUploadDate());
        }

        @Test
        @DisplayName("Should set and get ID")
        void testIdField() {
            // Act
            document.setId(42L);

            // Assert
            assertEquals(42L, document.getId());
        }

        @Test
        @DisplayName("Should accept null ID")
        void testNullId() {
            // Act
            document.setId(null);

            // Assert
            assertNull(document.getId());
        }
    }

    // ==================== ExtractionStatus Lifecycle Tests ====================

    @Nested
    @DisplayName("ExtractionStatus Lifecycle Tests")
    class ExtractionStatusLifecycleTests {

        @Test
        @DisplayName("Should transition from PENDING to SUCCESS")
        void testStatusTransitionPendingToSuccess() {
            // Arrange
            Document doc = new Document("file.txt", 100L, "TXT");
            assertEquals(ExtractionStatus.PENDING, doc.getExtractionStatus());

            // Act
            doc.setExtractionStatus(ExtractionStatus.SUCCESS);
            doc.setExtractedText("Extracted content");

            // Assert
            assertEquals(ExtractionStatus.SUCCESS, doc.getExtractionStatus());
            assertNotNull(doc.getExtractedText());
        }

        @Test
        @DisplayName("Should transition from PENDING to FAILED")
        void testStatusTransitionPendingToFailed() {
            // Arrange
            Document doc = new Document("file.pdf", 200L, "PDF");
            assertEquals(ExtractionStatus.PENDING, doc.getExtractionStatus());

            // Act
            doc.setExtractionStatus(ExtractionStatus.FAILED);
            doc.setErrorMessage("Extraction failed: corrupted file");

            // Assert
            assertEquals(ExtractionStatus.FAILED, doc.getExtractionStatus());
            assertNotNull(doc.getErrorMessage());
        }

        @Test
        @DisplayName("Should set PENDING status via setter")
        void testSetPendingStatus() {
            // Act
            document.setExtractionStatus(ExtractionStatus.PENDING);

            // Assert
            assertEquals(ExtractionStatus.PENDING, document.getExtractionStatus());
        }

        @Test
        @DisplayName("Should set SUCCESS status via setter")
        void testSetSuccessStatus() {
            // Act
            document.setExtractionStatus(ExtractionStatus.SUCCESS);

            // Assert
            assertEquals(ExtractionStatus.SUCCESS, document.getExtractionStatus());
        }

        @Test
        @DisplayName("Should set FAILED status via setter")
        void testSetFailedStatus() {
            // Act
            document.setExtractionStatus(ExtractionStatus.FAILED);

            // Assert
            assertEquals(ExtractionStatus.FAILED, document.getExtractionStatus());
        }

        @Test
        @DisplayName("Should accept null extraction status via setter")
        void testNullExtractionStatus() {
            // Act
            document.setExtractionStatus(null);

            // Assert
            assertNull(document.getExtractionStatus());
        }

        @Test
        @DisplayName("Should have all three ExtractionStatus enum values")
        void testExtractionStatusEnumValues() {
            // Assert
            ExtractionStatus[] values = ExtractionStatus.values();
            assertEquals(3, values.length);
            assertEquals(ExtractionStatus.PENDING, ExtractionStatus.valueOf("PENDING"));
            assertEquals(ExtractionStatus.SUCCESS, ExtractionStatus.valueOf("SUCCESS"));
            assertEquals(ExtractionStatus.FAILED, ExtractionStatus.valueOf("FAILED"));
        }
    }

    // ==================== Equals / HashCode Contract Tests ====================

    @Nested
    @DisplayName("Equals and HashCode Contract Tests")
    class EqualsHashCodeContractTests {

        @Test
        @DisplayName("Same instance should be equal to itself (reflexive)")
        void testEqualsReflexive() {
            // Arrange
            document.setId(1L);

            // Act & Assert
            assertEquals(document, document);
        }

        @Test
        @DisplayName("Two distinct instances with same ID should not be equal (default identity)")
        void testTwoDistinctInstancesWithSameIdAreNotEqual() {
            // Arrange - Document does not override equals, so identity is used
            Document doc1 = new Document("file.txt", 100L, "TXT");
            Document doc2 = new Document("file.txt", 100L, "TXT");
            doc1.setId(1L);
            doc2.setId(1L);

            // Act & Assert
            // Default Object.equals uses reference equality
            assertNotEquals(doc1, doc2);
            assertNotSame(doc1, doc2);
        }

        @Test
        @DisplayName("Same reference should be equal")
        void testSameReferenceIsEqual() {
            // Arrange
            Document doc = new Document("file.pdf", 2048L, "PDF");
            doc.setId(5L);
            Document sameRef = doc;

            // Act & Assert
            assertEquals(doc, sameRef);
            assertSame(doc, sameRef);
        }

        @Test
        @DisplayName("Should not be equal to null")
        void testNotEqualsToNull() {
            // Arrange
            document.setId(1L);

            // Act & Assert
            assertNotEquals(document, null);
        }

        @Test
        @DisplayName("Should not be equal to object of different type")
        void testNotEqualsToDifferentType() {
            // Arrange
            document.setId(1L);

            // Act & Assert
            assertNotEquals("Not a Document", document);
            assertNotEquals(1L, document);
        }

        @Test
        @DisplayName("HashCode should be consistent across multiple calls")
        void testHashCodeConsistency() {
            // Arrange
            document.setId(1L);
            document.setFilename("test.txt");

            // Act
            int hash1 = document.hashCode();
            int hash2 = document.hashCode();

            // Assert
            assertEquals(hash1, hash2);
        }

        @Test
        @DisplayName("Equal objects should have same hashCode")
        void testEqualObjectsHaveSameHashCode() {
            // Arrange - same reference
            Document doc = new Document("file.txt", 100L, "TXT");
            doc.setId(1L);

            // Act & Assert
            assertEquals(doc.hashCode(), doc.hashCode());
        }

        @Test
        @DisplayName("Document should be usable in collections")
        void testDocumentInHashSet() {
            // Arrange
            Document doc1 = new Document("file.txt", 100L, "TXT");
            Document doc2 = new Document("file.pdf", 200L, "PDF");
            doc1.setId(1L);
            doc2.setId(2L);

            // Act
            java.util.Set<Document> set = new java.util.HashSet<>();
            set.add(doc1);
            set.add(doc2);

            // Assert
            assertEquals(2, set.size());
        }
    }

    // ==================== Parameterized Constructor Tests ====================

    @Nested
    @DisplayName("Parameterized Constructor Tests")
    class ParameterizedConstructorTests {

        @Test
        @DisplayName("Should create TXT document with correct fields")
        void testCreateTxtDocument() {
            // Act
            Document doc = new Document("notes.txt", 512L, "TXT");

            // Assert
            assertEquals("notes.txt", doc.getFilename());
            assertEquals(512L, doc.getFileSize());
            assertEquals("TXT", doc.getFileType());
            assertEquals(ExtractionStatus.PENDING, doc.getExtractionStatus());
            assertNotNull(doc.getUploadDate());
            assertNull(doc.getId());
            assertNull(doc.getExtractedText());
            assertNull(doc.getErrorMessage());
        }

        @Test
        @DisplayName("Should create DOCX document with correct fields")
        void testCreateDocxDocument() {
            // Act
            Document doc = new Document("contract.docx", 10240L, "DOCX");

            // Assert
            assertEquals("contract.docx", doc.getFilename());
            assertEquals(10240L, doc.getFileSize());
            assertEquals("DOCX", doc.getFileType());
            assertEquals(ExtractionStatus.PENDING, doc.getExtractionStatus());
        }

        @Test
        @DisplayName("Should create PDF document with correct fields")
        void testCreatePdfDocument() {
            // Act
            Document doc = new Document("invoice.pdf", 20480L, "PDF");

            // Assert
            assertEquals("invoice.pdf", doc.getFilename());
            assertEquals(20480L, doc.getFileSize());
            assertEquals("PDF", doc.getFileType());
            assertEquals(ExtractionStatus.PENDING, doc.getExtractionStatus());
        }

        @Test
        @DisplayName("Should create XLSX document with correct fields")
        void testCreateXlsxDocument() {
            // Act
            Document doc = new Document("data.xlsx", 30720L, "XLSX");

            // Assert
            assertEquals("data.xlsx", doc.getFilename());
            assertEquals(30720L, doc.getFileSize());
            assertEquals("XLSX", doc.getFileType());
            assertEquals(ExtractionStatus.PENDING, doc.getExtractionStatus());
        }

        @Test
        @DisplayName("Should allow overriding uploadDate after construction")
        void testOverrideUploadDateAfterConstruction() {
            // Arrange
            Document doc = new Document("file.txt", 100L, "TXT");
            LocalDateTime customDate = LocalDateTime.of(2023, 1, 1, 0, 0, 0);

            // Act
            doc.setUploadDate(customDate);

            // Assert
            assertEquals(customDate, doc.getUploadDate());
        }

        @Test
        @DisplayName("Should allow overriding extractionStatus after construction")
        void testOverrideExtractionStatusAfterConstruction() {
            // Arrange
            Document doc = new Document("file.txt", 100L, "TXT");
            assertEquals(ExtractionStatus.PENDING, doc.getExtractionStatus());

            // Act
            doc.setExtractionStatus(ExtractionStatus.SUCCESS);

            // Assert
            assertEquals(ExtractionStatus.SUCCESS, doc.getExtractionStatus());
        }
    }

    // ==================== Helper method ====================

    /**
     * Helper to assert temporal ordering (used in upload date test).
     */
    private static void assertTrue(boolean condition) {
        org.junit.jupiter.api.Assertions.assertTrue(condition);
    }
}
