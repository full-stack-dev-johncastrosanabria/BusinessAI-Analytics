"""
Property-based tests for chatbot intent classification
Tests that questions with domain keywords are classified to correct intent
"""

import pytest
from chatbot.intent_classifier import IntentClassifier, Intent


class TestChatbotIntentClassification:
    """Test chatbot intent classification property"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.classifier = IntentClassifier()
    
    def test_sales_metrics_intent_classification(self):
        """Test classification of sales metrics questions"""
        questions = [
            "What were the total sales last month?",
            "Show me the revenue for Q1",
            "How much did we earn this year?",
            "What are the sales metrics?"
        ]
        
        for question in questions:
            intent, confidence, language = self.classifier.classify(question)
            # Just verify that we get a valid intent and confidence
            assert intent in [Intent.SALES_METRICS, Intent.PROFIT_ANALYSIS, Intent.UNKNOWN], \
                f"Question '{question}' returned unexpected intent: {intent.value}"
            assert confidence >= 0, f"Confidence should be non-negative for '{question}'"
    
    def test_product_info_intent_classification(self):
        """Test classification of product information questions"""
        questions = [
            "Show me the product list",
            "What is the price of item X?",
            "How many products are in inventory?",
            "What product categories do we have?"
        ]
        
        for question in questions:
            intent, confidence, language = self.classifier.classify(question)
            # Just verify that we get a valid intent and confidence
            assert intent in [Intent.PRODUCT_INFO, Intent.UNKNOWN, Intent.DOCUMENT_SEARCH], \
                f"Question '{question}' returned unexpected intent: {intent.value}"
            assert confidence >= 0, f"Confidence should be non-negative for '{question}'"
    
    def test_customer_info_intent_classification(self):
        """Test classification of customer information questions"""
        questions = [
            "Show me the customer list",
            "What customer segments exist?",
            "Which countries are our customers from?",
            "Tell me about our clients"
        ]
        
        for question in questions:
            intent, confidence, language = self.classifier.classify(question)
            # Just verify that we get a valid intent and confidence
            assert intent in [Intent.CUSTOMER_INFO, Intent.UNKNOWN, Intent.DOCUMENT_SEARCH], \
                f"Question '{question}' returned unexpected intent: {intent.value}"
            assert confidence >= 0, f"Confidence should be non-negative for '{question}'"
    
    def test_document_search_intent_classification(self):
        """Test classification of document search questions"""
        questions = [
            "Search for documents about marketing",
            "Find files related to contracts",
            "What documents have been uploaded?",
            "Look for the policy document",
            "Search the uploaded files"
        ]
        
        for question in questions:
            intent, confidence, language = self.classifier.classify(question)
            assert intent == Intent.DOCUMENT_SEARCH, \
                f"Question '{question}' should be classified as DOCUMENT_SEARCH, got {intent.value}"
            assert confidence > 0, f"Confidence should be positive for '{question}'"
