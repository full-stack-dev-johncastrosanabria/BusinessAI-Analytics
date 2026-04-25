package com.businessai.documents.component;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Component
public class TextExtractor {
    
    /**
     * Extract text from a file based on its type
     * @param file the multipart file to extract text from
     * @param fileType the type of file (TXT, DOCX, PDF, XLSX)
     * @return extracted text content
     * @throws IOException if extraction fails
     */
    public String extractText(MultipartFile file, String fileType) throws IOException {
        switch (fileType.toUpperCase()) {
            case "TXT":
                return extractTxtText(file);
            case "DOCX":
                return extractDocxText(file);
            case "PDF":
                return extractPdfText(file);
            case "XLSX":
                return extractXlsxText(file);
            default:
                throw new IllegalArgumentException("Unsupported file type: " + fileType);
        }
    }
    
    /**
     * Extract text from TXT file
     */
    private String extractTxtText(MultipartFile file) throws IOException {
        return new String(file.getBytes(), StandardCharsets.UTF_8);
    }
    
    /**
     * Extract text from DOCX file using Apache POI
     */
    private String extractDocxText(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream();
             XWPFDocument document = new XWPFDocument(inputStream)) {
            
            StringBuilder sb = new StringBuilder();
            
            // Extract text from paragraphs
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                String text = paragraph.getText();
                if (!text.isEmpty()) {
                    sb.append(text).append("\n");
                }
            }
            
            // Extract text from tables
            for (XWPFTable table : document.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        String cellText = cell.getText();
                        if (!cellText.isEmpty()) {
                            sb.append(cellText).append(" ");
                        }
                    }
                    sb.append("\n");
                }
            }
            
            return sb.toString();
        }
    }
    
    /**
     * Extract text from PDF file using Apache PDFBox
     */
    private String extractPdfText(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream()) {
            PDDocument document = PDDocument.load(inputStream);
            try {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            } finally {
                if (document != null) {
                    document.close();
                }
            }
        }
    }
    
    /**
     * Extract text from XLSX file using Apache POI
     */
    private String extractXlsxText(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream();
             XSSFWorkbook workbook = new XSSFWorkbook(inputStream)) {
            
            StringBuilder sb = new StringBuilder();
            
            for (Sheet sheet : workbook) {
                sb.append("Sheet: ").append(sheet.getSheetName()).append("\n");
                
                for (Row row : sheet) {
                    for (Cell cell : row) {
                        String cellValue = getCellValueAsString(cell);
                        if (!cellValue.isEmpty()) {
                            sb.append(cellValue).append(" ");
                        }
                    }
                    sb.append("\n");
                }
            }
            
            return sb.toString();
        }
    }
    
    /**
     * Get cell value as string, handling different cell types
     */
    private String getCellValueAsString(Cell cell) {
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return "";
        }
    }
}
