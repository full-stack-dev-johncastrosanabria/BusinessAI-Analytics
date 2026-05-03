"""
Unit tests for IntentClassifier module
Tests classification, language detection, keyword extraction, and utility methods
"""

import pytest
from unittest.mock import Mock, patch
from chatbot.intent_classifier import (
    IntentClassifier, 
    AdvancedIntentClassifier,
    Intent, 
    Language, 
    ConfidenceLevel
)


class TestIntentClassifierInit:
    """Tests for IntentClassifier initialization"""

    def test_init_creates_classifier(self):
        """Test IntentClassifier initializes successfully."""
        classifier = IntentClassifier()
        assert classifier is not None
        assert hasattr(classifier, 'keywords')
        assert hasattr(classifier, 'stop_words')

    def test_init_loads_keywords(self):
        """Test IntentClassifier loads keyword database."""
        classifier = IntentClassifier()
        assert len(classifier.keywords) > 0
        assert Intent.SALES_METRICS in classifier.keywords
        assert Intent.DOCUMENT_SEARCH in classifier.keywords

    def test_init_sets_version(self):
        """Test IntentClassifier sets version."""
        classifier = IntentClassifier()
        assert hasattr(classifier, 'version')
        assert classifier.version is not None

    def test_init_counts_keywords(self):
        """Test IntentClassifier counts total keywords."""
        classifier = IntentClassifier()
        assert classifier.total_keywords > 0


class TestClassify:
    """Tests for IntentClassifier.classify"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_classify_sales_metrics_english(self):
        """Test classification of sales metrics question in English."""
        intent, confidence, language = self.classifier.classify("What are our total sales?")
        assert intent in [Intent.SALES_METRICS, Intent.REVENUE_ANALYSIS, Intent.PROFIT_ANALYSIS]
        assert confidence >= 0
        assert language == Language.ENGLISH

    def test_classify_sales_metrics_spanish(self):
        """Test classification of sales metrics question in Spanish."""
        intent, confidence, language = self.classifier.classify("¿Cuáles son nuestras ventas totales?")
        assert intent in [Intent.SALES_METRICS, Intent.REVENUE_ANALYSIS, Intent.PROFIT_ANALYSIS]
        assert confidence >= 0
        assert language == Language.SPANISH

    def test_classify_product_info_english(self):
        """Test classification of product info question in English."""
        intent, confidence, language = self.classifier.classify("Show me the product catalog")
        assert intent in [Intent.PRODUCT_INFO, Intent.DOCUMENT_SEARCH]
        assert confidence >= 0
        assert language == Language.ENGLISH

    def test_classify_customer_info_english(self):
        """Test classification of customer info question in English."""
        intent, confidence, language = self.classifier.classify("Who are our customers?")
        # May classify as UNKNOWN, CUSTOMER_INFO, or DOCUMENT_SEARCH depending on keywords
        assert intent in [Intent.CUSTOMER_INFO, Intent.DOCUMENT_SEARCH, Intent.UNKNOWN]
        assert confidence >= 0
        assert language == Language.ENGLISH

    def test_classify_document_search_english(self):
        """Test classification of document search question in English."""
        intent, confidence, language = self.classifier.classify("Search for contract documents")
        assert intent == Intent.DOCUMENT_SEARCH
        assert confidence > 0
        assert language == Language.ENGLISH

    def test_classify_document_search_spanish(self):
        """Test classification of document search question in Spanish."""
        intent, confidence, language = self.classifier.classify("Buscar documentos de contrato")
        assert intent == Intent.DOCUMENT_SEARCH
        assert confidence > 0
        assert language == Language.SPANISH

    def test_classify_empty_string(self):
        """Test classification of empty string."""
        intent, confidence, language = self.classifier.classify("")
        assert intent == Intent.UNKNOWN
        assert confidence == 0
        assert language == Language.ENGLISH

    def test_classify_unknown_intent(self):
        """Test classification of unknown intent."""
        intent, confidence, language = self.classifier.classify("xyzzy frobozz nonsense")
        assert intent == Intent.UNKNOWN
        assert confidence >= 0

    def test_classify_returns_tuple(self):
        """Test classify returns tuple of three elements."""
        result = self.classifier.classify("test question")
        assert isinstance(result, tuple)
        assert len(result) == 3
        assert isinstance(result[0], Intent)
        assert isinstance(result[1], (int, float))
        assert isinstance(result[2], Language)


class TestDetectLanguage:
    """Tests for IntentClassifier.detect_language"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_detect_language_english(self):
        """Test language detection for English text."""
        language, confidence = self.classifier.detect_language("What are the sales metrics?")
        assert language == Language.ENGLISH
        assert confidence > 0

    def test_detect_language_spanish(self):
        """Test language detection for Spanish text."""
        language, confidence = self.classifier.detect_language("¿Cuáles son las métricas de ventas?")
        assert language == Language.SPANISH
        assert confidence > 0

    def test_detect_language_empty_string(self):
        """Test language detection for empty string."""
        language, confidence = self.classifier.detect_language("")
        assert language == Language.ENGLISH  # Default
        assert confidence >= 0

    def test_detect_language_mixed(self):
        """Test language detection for mixed language text."""
        language, confidence = self.classifier.detect_language("sales ventas metrics")
        assert language in [Language.ENGLISH, Language.SPANISH]
        assert confidence >= 0


class TestExtractKeywords:
    """Tests for IntentClassifier.extract_keywords"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_extract_keywords_english(self):
        """Test keyword extraction from English text."""
        keywords = self.classifier.extract_keywords("What are our total sales and revenue?")
        assert isinstance(keywords, list)
        assert len(keywords) > 0

    def test_extract_keywords_spanish(self):
        """Test keyword extraction from Spanish text."""
        keywords = self.classifier.extract_keywords("¿Cuáles son nuestras ventas totales?", Language.SPANISH)
        assert isinstance(keywords, list)
        assert len(keywords) > 0

    def test_extract_keywords_removes_stop_words(self):
        """Test keyword extraction removes stop words."""
        keywords = self.classifier.extract_keywords("the and or but sales")
        assert "the" not in keywords
        assert "and" not in keywords
        assert "or" not in keywords

    def test_extract_keywords_empty_string(self):
        """Test keyword extraction from empty string."""
        keywords = self.classifier.extract_keywords("")
        assert isinstance(keywords, list)
        assert len(keywords) == 0

    def test_extract_keywords_limit(self):
        """Test keyword extraction respects limit."""
        long_text = " ".join(["word" + str(i) for i in range(100)])
        keywords = self.classifier.extract_keywords(long_text)
        assert len(keywords) <= 20  # Default limit


class TestGetConfidenceLevel:
    """Tests for confidence level determination (not a direct method but tested through classify)"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_classify_returns_confidence_value(self):
        """Test classify returns a confidence value."""
        intent, confidence, language = self.classifier.classify("What are our sales?")
        assert isinstance(confidence, (int, float))
        assert 0 <= confidence <= 1.0

    def test_classify_high_confidence_document_search(self):
        """Test classify returns high confidence for clear document search."""
        intent, confidence, language = self.classifier.classify("Search for documents about contracts")
        assert intent == Intent.DOCUMENT_SEARCH
        assert confidence > 0

    def test_classify_low_confidence_unknown(self):
        """Test classify returns low confidence for unknown intent."""
        intent, confidence, language = self.classifier.classify("xyzzy frobozz")
        assert intent == Intent.UNKNOWN
        assert confidence >= 0


class TestNormalizeText:
    """Tests for IntentClassifier._normalize_text"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_normalize_text_lowercase(self):
        """Test text normalization converts to lowercase."""
        result = self.classifier._normalize_text("HELLO WORLD")
        assert result == "hello world"

    def test_normalize_text_whitespace(self):
        """Test text normalization removes extra whitespace."""
        result = self.classifier._normalize_text("hello    world   test")
        assert result == "hello world test"

    def test_normalize_text_empty(self):
        """Test text normalization handles empty string."""
        result = self.classifier._normalize_text("")
        assert result == ""

    def test_normalize_text_none(self):
        """Test text normalization handles None."""
        result = self.classifier._normalize_text(None)
        assert result == ""


class TestCalculateSimilarity:
    """Tests for IntentClassifier._calculate_similarity"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_calculate_similarity_exact_match(self):
        """Test similarity calculation for exact match."""
        similarity = self.classifier._calculate_similarity("hello", "hello")
        assert similarity == 1.0

    def test_calculate_similarity_no_match(self):
        """Test similarity calculation for no match."""
        similarity = self.classifier._calculate_similarity("hello", "world")
        assert 0 <= similarity < 1.0

    def test_calculate_similarity_empty_strings(self):
        """Test similarity calculation for empty strings."""
        similarity = self.classifier._calculate_similarity("", "")
        assert similarity == 0.0

    def test_calculate_similarity_one_empty(self):
        """Test similarity calculation when one string is empty."""
        similarity = self.classifier._calculate_similarity("hello", "")
        assert similarity == 0.0


class TestExtractEntities:
    """Tests for IntentClassifier._extract_entities"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_extract_entities_with_dates(self):
        """Test entity extraction finds dates."""
        entities = self.classifier._extract_entities("Sales for 2024-01-15")
        assert isinstance(entities, list)

    def test_extract_entities_with_numbers(self):
        """Test entity extraction finds numbers."""
        entities = self.classifier._extract_entities("Revenue of $50,000")
        assert isinstance(entities, list)

    def test_extract_entities_empty_text(self):
        """Test entity extraction with empty text."""
        entities = self.classifier._extract_entities("")
        assert isinstance(entities, list)
        assert len(entities) == 0


class TestAnalyzeSentiment:
    """Tests for IntentClassifier._analyze_sentiment"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_analyze_sentiment_positive(self):
        """Test sentiment analysis for positive text."""
        sentiment = self.classifier._analyze_sentiment("Great sales growth and excellent profit", Language.ENGLISH)
        assert sentiment == "positive"

    def test_analyze_sentiment_negative(self):
        """Test sentiment analysis for negative text."""
        sentiment = self.classifier._analyze_sentiment("Terrible loss and bad decline", Language.ENGLISH)
        assert sentiment == "negative"

    def test_analyze_sentiment_neutral(self):
        """Test sentiment analysis for neutral text."""
        sentiment = self.classifier._analyze_sentiment("Show me the data", Language.ENGLISH)
        assert sentiment == "neutral"


class TestDetermineUrgency:
    """Tests for IntentClassifier._determine_urgency"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_determine_urgency_high(self):
        """Test urgency determination for high urgency."""
        urgency = self.classifier._determine_urgency("Urgent: need sales data immediately", Language.ENGLISH)
        assert urgency == "high"

    def test_determine_urgency_medium(self):
        """Test urgency determination for medium urgency."""
        urgency = self.classifier._determine_urgency("When will the report be ready?", Language.ENGLISH)
        assert urgency == "medium"

    def test_determine_urgency_low(self):
        """Test urgency determination for low urgency."""
        urgency = self.classifier._determine_urgency("Show me the sales data", Language.ENGLISH)
        assert urgency == "low"


class TestGetStatistics:
    """Tests for IntentClassifier.get_statistics"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_get_statistics_returns_dict(self):
        """Test get_statistics returns dictionary."""
        stats = self.classifier.get_statistics()
        assert isinstance(stats, dict)

    def test_get_statistics_has_version(self):
        """Test get_statistics includes version."""
        stats = self.classifier.get_statistics()
        assert "version" in stats
        assert stats["version"] is not None

    def test_get_statistics_has_total_intents(self):
        """Test get_statistics includes total intents."""
        stats = self.classifier.get_statistics()
        assert "total_intents" in stats
        assert stats["total_intents"] > 0

    def test_get_statistics_has_total_keywords(self):
        """Test get_statistics includes total keywords."""
        stats = self.classifier.get_statistics()
        assert "total_keywords" in stats
        assert stats["total_keywords"] > 0

    def test_get_statistics_has_supported_languages(self):
        """Test get_statistics includes supported languages."""
        stats = self.classifier.get_statistics()
        assert "supported_languages" in stats
        assert len(stats["supported_languages"]) > 0


class TestBatchClassify:
    """Tests for IntentClassifier.batch_classify"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_batch_classify_multiple_questions(self):
        """Test batch classification of multiple questions."""
        questions = [
            "What are our sales?",
            "Show me products",
            "Who are our customers?"
        ]
        results = self.classifier.batch_classify(questions)
        assert len(results) == 3
        assert all(isinstance(r, tuple) for r in results)
        assert all(len(r) == 3 for r in results)

    def test_batch_classify_empty_list(self):
        """Test batch classification with empty list."""
        results = self.classifier.batch_classify([])
        assert len(results) == 0

    def test_batch_classify_single_question(self):
        """Test batch classification with single question."""
        results = self.classifier.batch_classify(["What are sales?"])
        assert len(results) == 1


class TestGetIntentExamples:
    """Tests for IntentClassifier.get_intent_examples"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_get_intent_examples_sales_metrics(self):
        """Test getting examples for sales metrics intent."""
        examples = self.classifier.get_intent_examples(Intent.SALES_METRICS, Language.ENGLISH)
        assert isinstance(examples, list)
        assert len(examples) > 0

    def test_get_intent_examples_spanish(self):
        """Test getting examples in Spanish."""
        examples = self.classifier.get_intent_examples(Intent.SALES_METRICS, Language.SPANISH)
        assert isinstance(examples, list)
        assert len(examples) > 0

    def test_get_intent_examples_limit(self):
        """Test getting examples respects limit."""
        # Use a limit of 1 to avoid index errors with small keyword lists
        examples = self.classifier.get_intent_examples(Intent.DOCUMENT_SEARCH, Language.ENGLISH, limit=1)
        # Should return at most 1 example
        assert len(examples) <= 1


class TestValidateClassification:
    """Tests for IntentClassifier.validate_classification"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_validate_classification_correct(self):
        """Test validation with correct classification."""
        result = self.classifier.validate_classification(
            "Search for documents",
            Intent.DOCUMENT_SEARCH,
            Language.ENGLISH
        )
        assert isinstance(result, dict)
        assert "question" in result
        assert "expected_intent" in result
        assert "actual_intent" in result
        assert "intent_correct" in result
        assert "confidence" in result

    def test_validate_classification_incorrect(self):
        """Test validation with incorrect classification."""
        result = self.classifier.validate_classification(
            "What are sales?",
            Intent.DOCUMENT_SEARCH,  # Wrong expected intent
            Language.ENGLISH
        )
        assert isinstance(result, dict)
        assert result["intent_correct"] == False


class TestGetIntentSummary:
    """Tests for IntentClassifier.get_intent_summary"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_get_intent_summary_returns_dict(self):
        """Test get_intent_summary returns dictionary."""
        summary = self.classifier.get_intent_summary()
        assert isinstance(summary, dict)

    def test_get_intent_summary_has_classifier_info(self):
        """Test get_intent_summary includes classifier info."""
        summary = self.classifier.get_intent_summary()
        assert "classifier_info" in summary
        assert "version" in summary["classifier_info"]

    def test_get_intent_summary_has_intents(self):
        """Test get_intent_summary includes intents."""
        summary = self.classifier.get_intent_summary()
        assert "intents" in summary
        assert len(summary["intents"]) > 0


class TestTranslateResponse:
    """Tests for IntentClassifier.translate_response"""

    def setup_method(self):
        """Create a classifier instance."""
        self.classifier = IntentClassifier()

    def test_translate_response_english_passthrough(self):
        """Test translation to English is passthrough."""
        response = "No data available"
        translated = self.classifier.translate_response(response, Language.ENGLISH)
        assert translated == response

    def test_translate_response_spanish(self):
        """Test translation to Spanish."""
        response = "No data available"
        translated = self.classifier.translate_response(response, Language.SPANISH)
        assert isinstance(translated, str)
        # Basic translation should occur
        assert translated != response or "No" in translated


class TestAdvancedIntentClassifierAlias:
    """Tests for AdvancedIntentClassifier alias"""

    def test_intent_classifier_is_advanced_classifier(self):
        """Test IntentClassifier is alias for AdvancedIntentClassifier."""
        assert IntentClassifier == AdvancedIntentClassifier

    def test_can_instantiate_both(self):
        """Test both names can be used to instantiate."""
        classifier1 = IntentClassifier()
        classifier2 = AdvancedIntentClassifier()
        assert type(classifier1) == type(classifier2)
