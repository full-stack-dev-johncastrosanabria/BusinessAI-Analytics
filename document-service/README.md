# Document Service

The Document Service is a Spring Boot microservice that handles document uploads, text extraction, and storage for the BusinessAI-Analytics platform.

## Features

- **Document Upload**: Accept document uploads in TXT, DOCX, PDF, and XLSX formats
- **Text Extraction**: Automatically extract text content from uploaded documents
- **Metadata Storage**: Store document metadata including filename, size, type, and upload date
- **Error Handling**: Graceful error handling with detailed error messages for failed extractions
- **File Validation**: Validate file format and size (max 50MB)

## Technology Stack

- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- MySQL 8.0
- Apache POI (for DOCX and XLSX extraction)
- Apache PDFBox (for PDF extraction)

## Project Structure

```
document-service/
├── src/main/java/com/businessai/documents/
│   ├── DocumentServiceApplication.java       # Main application class
│   ├── component/
│   │   └── TextExtractor.java               # Text extraction logic
│   ├── controller/
│   │   └── DocumentController.java          # REST endpoints
│   ├── entity/
│   │   ├── Document.java                    # JPA entity
│   │   └── ExtractionStatus.java            # Extraction status enum
│   ├── repository/
│   │   └── DocumentRepository.java          # Spring Data JPA repository
│   └── service/
│       └── DocumentService.java             # Business logic
├── src/main/resources/
│   └── application.yml                      # Configuration
├── src/test/java/com/businessai/documents/
│   └── service/
│       ├── DocumentFormatValidationProperties.java    # Property tests
│       └── DocumentMetadataPreservationProperties.java # Property tests
└── pom.xml                                  # Maven configuration
```

## Configuration

The service is configured via `application.yml`:

```yaml
server:
  port: 8085

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/businessai_analytics
    username: root
    password: root

document:
  upload:
    max-file-size: 52428800  # 50MB
    allowed-types: TXT,DOCX,PDF,XLSX
```

## Building and Running

### Build

```bash
mvn clean package
```

### Run

```bash
mvn spring-boot:run
```

The service will start on port 8085.

## REST API Endpoints

### Upload Document
```
POST /api/documents/upload
Content-Type: multipart/form-data

Request:
- file: MultipartFile (TXT, DOCX, PDF, or XLSX)

Response (201 Created):
{
  "id": 1,
  "filename": "document.pdf",
  "uploadDate": "2024-01-15T10:30:00",
  "fileSize": 102400,
  "fileType": "PDF",
  "extractedText": "...",
  "extractionStatus": "SUCCESS",
  "errorMessage": null
}
```

### Get Document Metadata
```
GET /api/documents/{id}

Response (200 OK):
{
  "id": 1,
  "filename": "document.pdf",
  "uploadDate": "2024-01-15T10:30:00",
  "fileSize": 102400,
  "fileType": "PDF",
  "extractionStatus": "SUCCESS"
}
```

### List All Documents
```
GET /api/documents

Response (200 OK):
[
  {
    "id": 1,
    "filename": "document.pdf",
    "uploadDate": "2024-01-15T10:30:00",
    "fileSize": 102400,
    "fileType": "PDF",
    "extractionStatus": "SUCCESS"
  }
]
```

### Get Document Content
```
GET /api/documents/{id}/content

Response (200 OK):
{
  "content": "..."
}
```

### Delete Document
```
DELETE /api/documents/{id}

Response (200 OK):
{
  "message": "Document deleted successfully"
}
```

## Text Extraction

The service supports text extraction from the following file formats:

### TXT Files
- Direct text reading using Java I/O
- UTF-8 encoding support

### DOCX Files
- Paragraph extraction
- Table extraction
- Uses Apache POI XWPFDocument

### PDF Files
- Page-by-page text extraction
- Uses Apache PDFBox PDFTextStripper

### XLSX Files
- Cell-by-cell extraction
- Multi-sheet support
- Uses Apache POI XSSFWorkbook

## Error Handling

If text extraction fails, the document is still stored with:
- `extractionStatus`: FAILED
- `errorMessage`: Detailed error description

This allows for manual intervention or retry later.

## Testing

### Run All Tests
```bash
mvn test
```

### Run Property-Based Tests Only
```bash
mvn test -Dtest="*Properties"
```

### Property Tests

The service includes comprehensive property-based tests:

1. **Document Format Validation** (Property 13)
   - Tests that allowed formats are accepted
   - Tests that disallowed formats are rejected
   - Tests file size validation

2. **Document Metadata Preservation** (Property 14)
   - Tests that filename is preserved
   - Tests that file size is preserved
   - Tests that file type is preserved
   - Tests that all metadata is preserved together

## Database Schema

The service uses the following table:

```sql
CREATE TABLE documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    extracted_text MEDIUMTEXT,
    extraction_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    INDEX idx_file_type (file_type),
    INDEX idx_extraction_status (extraction_status),
    FULLTEXT INDEX idx_extracted_text (extracted_text)
);
```

## Validation Rules

- **File Format**: Only TXT, DOCX, PDF, XLSX are allowed
- **File Size**: Maximum 50MB (52,428,800 bytes)
- **Extracted Text**: Maximum 1,000,000 characters per document
- **Filename**: Required and must contain a file extension

## Integration with API Gateway

The Document Service is integrated with the API Gateway at port 8080:

```
API Gateway (8080) → Document Service (8085)
Route: /api/documents/** → http://localhost:8085/api/documents/**
```

## Requirements Validation

This service implements the following requirements:

- **Requirement 6.1-6.6**: Document upload and storage
- **Requirement 7.1-7.6**: Document text extraction

## Future Enhancements

- Async text extraction for large files
- Document versioning
- Full-text search optimization
- Document tagging and categorization
- Batch upload support
