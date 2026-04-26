# Document Service

Microservicio para subida, extracción de texto y almacenamiento de documentos empresariales.

## Stack

- Java 17 · Spring Boot 3.2.0 · Apache POI 5.2.3 · Apache PDFBox 2.0.29 · MySQL 8.0
- Puerto: **8085**

## Ejecución

```bash
cd document-service
mvn spring-boot:run
```

Health check: `http://localhost:8085/actuator/health`

## API

| Método | Ruta                          | Descripción                        |
|--------|-------------------------------|------------------------------------|
| POST   | `/api/documents/upload`       | Subir documento (multipart/form-data) |
| GET    | `/api/documents`              | Listar todos los documentos        |
| GET    | `/api/documents/{id}`         | Obtener metadatos por ID           |
| GET    | `/api/documents/{id}/content` | Obtener texto extraído             |
| DELETE | `/api/documents/{id}`         | Eliminar documento                 |

### Subir documento

```bash
curl -X POST http://localhost:8085/api/documents/upload \
  -F "file=@contrato.pdf"
```

**Respuesta:**
```json
{
  "id": 1,
  "filename": "contrato.pdf",
  "uploadDate": "2024-03-15T10:30:00",
  "fileSize": 102400,
  "fileType": "PDF",
  "extractionStatus": "SUCCESS"
}
```

## Formatos soportados

| Formato | Librería         | Método de extracción          |
|---------|------------------|-------------------------------|
| TXT     | Java I/O         | Lectura directa UTF-8         |
| DOCX    | Apache POI       | XWPFDocument (párrafos + tablas) |
| PDF     | Apache PDFBox    | PDFTextStripper (todas las páginas) |
| XLSX    | Apache POI       | XSSFWorkbook (todas las hojas) |

## Validaciones

- Formatos permitidos: TXT, DOCX, PDF, XLSX
- Tamaño máximo: **50 MB**
- Texto extraído máximo: 1 000 000 caracteres
- Si la extracción falla, el documento se guarda con `extractionStatus: FAILED` y mensaje de error

## Índice full-text

La columna `extracted_text` tiene índice FULLTEXT en MySQL, lo que permite búsquedas eficientes desde el chatbot del AI Service.

## Tests

```bash
mvn test
```

25 tests — property-based (jqwik) e integración con H2 en memoria:

| Property test                              | Valida                                  |
|--------------------------------------------|-----------------------------------------|
| `DocumentFormatValidationProperties`       | Formatos permitidos/rechazados, tamaño  |
| `DocumentMetadataPreservationProperties`   | Nombre, tamaño y tipo preservados       |
