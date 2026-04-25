"""
Chatbot intent classifier using keyword matching
"""

import logging
from typing import Tuple
from enum import Enum

logger = logging.getLogger(__name__)


class Intent(Enum):
    """Chatbot intent types"""
    SALES_METRICS = "sales_metrics"
    PRODUCT_INFO = "product_info"
    CUSTOMER_INFO = "customer_info"
    DOCUMENT_SEARCH = "document_search"
    MIXED = "mixed"
    UNKNOWN = "unknown"


class IntentClassifier:
    """Classify user questions into intents using keyword matching"""
    
    def __init__(self):
        """Initialize intent classifier with keyword mappings"""
        self.keywords = {
            Intent.SALES_METRICS: [
                "sales", "revenue", "total sales", "sales data", "sales metrics",
                "profit", "earnings", "income", "financial", "performance",
                "monthly", "quarterly", "yearly", "trend", "growth", "earn"
            ],
            Intent.PRODUCT_INFO: [
                "product", "item", "inventory", "stock", "category", "price",
                "cost", "product list", "products", "what products", "which products",
                "product details", "product information"
            ],
            Intent.CUSTOMER_INFO: [
                "customer", "client", "segment", "country", "customer list",
                "customers", "who are", "customer details", "customer information",
                "customer data", "client information"
            ],
            Intent.DOCUMENT_SEARCH: [
                "document", "file", "uploaded", "upload", "search", "find",
                "look for", "document content", "file content", "document search",
                "document information"
            ]
        }
    
    def classify(self, question: str) -> Tuple[Intent, float]:
        """
        Classify a question into an intent
        
        Args:
            question: User question
        
        Returns:
            Tuple of (intent, confidence_score)
        """
        question_lower = question.lower()
        
        # Count keyword matches for each intent
        intent_scores = {}
        for intent, keywords in self.keywords.items():
            score = sum(1 for keyword in keywords if keyword in question_lower)
            if score > 0:
                intent_scores[intent] = score
        
        if not intent_scores:
            logger.info(f"No intent matched for question: {question}")
            return Intent.UNKNOWN, 0.0
        
        # Check for mixed intent (multiple domains)
        if len(intent_scores) > 1:
            max_score = max(intent_scores.values())
            # If multiple intents have similar scores, it's mixed
            similar_intents = [intent for intent, score in intent_scores.items() if score >= max_score * 0.7]
            if len(similar_intents) > 1:
                logger.info(f"Mixed intent detected for question: {question}")
                return Intent.MIXED, max_score / len(self.keywords)
        
        # Return the intent with highest score
        best_intent = max(intent_scores, key=intent_scores.get)
        confidence = intent_scores[best_intent] / len(self.keywords[best_intent])
        
        logger.info(f"Classified question as {best_intent.value} with confidence {confidence:.2f}")
        return best_intent, confidence
    
    def extract_keywords(self, question: str) -> list:
        """
        Extract relevant keywords from question
        
        Args:
            question: User question
        
        Returns:
            List of extracted keywords
        """
        question_lower = question.lower()
        
        # Remove common words
        stop_words = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
            "being", "have", "has", "had", "do", "does", "did", "will", "would",
            "could", "should", "may", "might", "must", "can", "what", "which",
            "who", "when", "where", "why", "how", "all", "each", "every", "both",
            "few", "more", "most", "other", "some", "such", "no", "nor", "not",
            "only", "same", "so", "than", "too", "very", "just", "as", "if"
        }
        
        # Split into words and filter
        words = question_lower.split()
        keywords = [
            word.strip('.,!?;:') for word in words
            if word.strip('.,!?;:') not in stop_words and len(word.strip('.,!?;:')) > 2
        ]
        
        logger.info(f"Extracted keywords: {keywords}")
        return keywords
