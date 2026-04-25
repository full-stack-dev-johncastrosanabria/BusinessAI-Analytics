package com.businessai.documents.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.businessai.documents.entity.Document;
import com.businessai.documents.entity.ExtractionStatus;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    
    List<Document> findByFileType(String fileType);
    
    List<Document> findByExtractionStatus(ExtractionStatus status);
    
    @Query("SELECT d FROM Document d WHERE d.extractedText LIKE CONCAT('%', :keyword, '%')")
    List<Document> searchByKeyword(@Param("keyword") String keyword);
}
