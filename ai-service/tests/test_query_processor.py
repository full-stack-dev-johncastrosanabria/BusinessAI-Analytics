"""
Unit tests for QueryProcessor module
Tests various inputs including edge cases and critical paths.
"""

import pytest
from unittest.mock import Mock, MagicMock
from chatbot.query_processor import QueryProcessor
from chatbot.intent_classifier import Intent


class TestQueryProcessorInit:
    """Tests for QueryProcessor initialization"""

    def test_init_with_db_connection(self):
        """Test QueryProcessor initializes with database connection."""
        mock_db = Mock()
        processor = QueryProcessor(mock_db)
        assert processor.db == mock_db
        assert processor.intent_classifier is not None

    def test_init_creates_intent_classifier(self):
        """Test QueryProcessor creates IntentClassifier instance."""
        processor = QueryProcessor(Mock())
        assert hasattr(processor, 'intent_classifier')


class TestProcessQuery:
    """Tests for QueryProcessor.process_query"""

    def setup_method(self):
        """Create a QueryProcessor instance with a mock db connection."""
        self.mock_db = Mock()
        self.processor = QueryProcessor(self.mock_db)

    def test_process_query_sales_metrics_intent(self):
        """Test process_query routes to sales metrics handler."""
        self.mock_db.get_sales_metrics.return_value = [
            {'month': 1, 'year': 2024, 'total_sales': 50000, 'total_costs': 30000, 'profit': 20000}
        ]
        self.processor.intent_classifier.classify = Mock(return_value=(Intent.SALES_METRICS, 0.9, 'en'))
        
        answer, sources = self.processor.process_query("What are our sales?")
        assert isinstance(answer, str)
        assert isinstance(sources, list)
        assert len(answer) > 0

    def test_process_query_product_info_intent(self):
        """Test process_query routes to product info handler."""
        self.mock_db.get_products.return_value = [
            {'name': 'Product A', 'category': 'Electronics'}
        ]
        self.processor.intent_classifier.classify = Mock(return_value=(Intent.PRODUCT_INFO, 0.9, 'en'))
        
        answer, sources = self.processor.process_query("Tell me about products")
        assert isinstance(answer, str)
        assert isinstance(sources, list)

    def test_process_query_customer_info_intent(self):
        """Test process_query routes to customer info handler."""
        self.mock_db.get_customers.return_value = [
            {'name': 'Customer A', 'segment': 'Enterprise', 'country': 'USA'}
        ]
        self.processor.intent_classifier.classify = Mock(return_value=(Intent.CUSTOMER_INFO, 0.9, 'en'))
        
        answer, sources = self.processor.process_query("Who are our customers?")
        assert isinstance(answer, str)
        assert isinstance(sources, list)

    def test_process_query_document_search_intent(self):
        """Test process_query routes to document search handler."""
        self.mock_db.search_documents.return_value = []
        self.processor.intent_classifier.classify = Mock(return_value=(Intent.DOCUMENT_SEARCH, 0.9, 'en'))
        self.processor.intent_classifier.extract_keywords = Mock(return_value=['contract'])
        
        answer, sources = self.processor.process_query("Find contract documents")
        assert isinstance(answer, str)
        assert isinstance(sources, list)

    def test_process_query_mixed_intent(self):
        """Test process_query routes to mixed query handler."""
        self.mock_db.get_sales_metrics.return_value = [
            {'month': 1, 'year': 2024, 'total_sales': 50000, 'total_costs': 30000, 'profit': 20000}
        ]
        self.mock_db.search_documents.return_value = []
        self.processor.intent_classifier.classify = Mock(return_value=(Intent.MIXED, 0.9, 'en'))
        self.processor.intent_classifier.extract_keywords = Mock(return_value=['sales'])
        
        answer, sources = self.processor.process_query("Sales and documents")
        assert isinstance(answer, str)
        assert isinstance(sources, list)

    def test_process_query_unknown_intent(self):
        """Test process_query handles unknown intent."""
        self.processor.intent_classifier.classify = Mock(return_value=(Intent.UNKNOWN, 0.5, 'en'))
        
        answer, sources = self.processor.process_query("Random question")
        assert "not sure how to answer" in answer
        assert sources == []

    def test_process_query_exception_handling(self):
        """Test process_query handles exceptions gracefully."""
        self.processor.intent_classifier.classify = Mock(side_effect=Exception("Test error"))
        
        answer, sources = self.processor.process_query("Test question")
        assert "error processing" in answer.lower()
        assert sources == []


class TestHandleSalesMetrics:
    """Tests for QueryProcessor._handle_sales_metrics"""

    def setup_method(self):
        """Create a QueryProcessor instance with a mock db connection."""
        self.mock_db = Mock()
        self.processor = QueryProcessor(self.mock_db)

    def test_handle_sales_metrics_no_data(self):
        """Test sales metrics handler with no data."""
        self.mock_db.get_sales_metrics.return_value = []
        
        answer, sources = self.processor._handle_sales_metrics("What are sales?")
        assert "No sales metrics data available" in answer
        assert sources == []

    def test_handle_sales_metrics_best_month(self):
        """Test sales metrics handler for best month query."""
        self.mock_db.get_sales_metrics.return_value = [
            {'month': 1, 'year': 2024, 'total_sales': 50000, 'total_costs': 30000, 'profit': 20000}
        ]
        self.mock_db.get_best_worst_months.return_value = {
            'best_month': {'month': 6, 'year': 2024, 'profit': 25000}
        }
        
        answer, sources = self.processor._handle_sales_metrics("What was the best month?")
        assert "best performing month" in answer.lower()
        assert "6/2024" in answer
        assert "$25,000" in answer

    def test_handle_sales_metrics_worst_month(self):
        """Test sales metrics handler for worst month query."""
        self.mock_db.get_sales_metrics.return_value = [
            {'month': 1, 'year': 2024, 'total_sales': 50000, 'total_costs': 30000, 'profit': 20000}
        ]
        self.mock_db.get_best_worst_months.return_value = {
            'worst_month': {'month': 2, 'year': 2024, 'profit': 5000}
        }
        
        answer, sources = self.processor._handle_sales_metrics("What was the worst month?")
        assert "worst performing month" in answer.lower()
        assert "2/2024" in answer

    def test_handle_sales_metrics_recent(self):
        """Test sales metrics handler for recent metrics."""
        self.mock_db.get_sales_metrics.return_value = [
            {'month': 3, 'year': 2024, 'total_sales': 60000, 'total_costs': 35000, 'profit': 25000}
        ]
        
        answer, sources = self.processor._handle_sales_metrics("Show me sales")
        assert "Recent sales metrics" in answer
        assert "3/2024" in answer
        assert "$60,000" in answer

    def test_handle_sales_metrics_exception(self):
        """Test sales metrics handler exception handling."""
        self.mock_db.get_sales_metrics.side_effect = Exception("DB error")
        
        answer, sources = self.processor._handle_sales_metrics("What are sales?")
        assert "Error retrieving sales metrics" in answer
        assert sources == []


class TestHandleProductInfo:
    """Tests for QueryProcessor._handle_product_info"""

    def setup_method(self):
        """Create a QueryProcessor instance with a mock db connection."""
        self.mock_db = Mock()
        self.processor = QueryProcessor(self.mock_db)

    def test_handle_product_info_no_data(self):
        """Test product info handler with no data."""
        self.mock_db.get_products.return_value = []
        
        answer, sources = self.processor._handle_product_info("What products do we have?")
        assert "No products found" in answer
        assert sources == []

    def test_handle_product_info_top_products(self):
        """Test product info handler for top products query."""
        self.mock_db.get_products.return_value = [
            {'name': 'Product A', 'category': 'Electronics'}
        ]
        self.mock_db.get_top_products.return_value = [
            {'name': 'Product A', 'total_revenue': 50000},
            {'name': 'Product B', 'total_revenue': 40000}
        ]
        
        answer, sources = self.processor._handle_product_info("What are the top products?")
        assert "Top 5 products" in answer
        assert "Product A" in answer
        assert "$50,000" in answer

    def test_handle_product_info_general(self):
        """Test product info handler for general query."""
        self.mock_db.get_products.return_value = [
            {'name': 'Product A', 'category': 'Electronics'},
            {'name': 'Product B', 'category': 'Furniture'},
            {'name': 'Product C', 'category': 'Electronics'}
        ]
        
        answer, sources = self.processor._handle_product_info("Tell me about products")
        assert "3 products" in answer
        assert "2 categories" in answer
        assert "Electronics" in answer

    def test_handle_product_info_exception(self):
        """Test product info handler exception handling."""
        self.mock_db.get_products.side_effect = Exception("DB error")
        
        answer, sources = self.processor._handle_product_info("What products?")
        assert "Error retrieving product information" in answer
        assert sources == []


class TestHandleCustomerInfo:
    """Tests for QueryProcessor._handle_customer_info"""

    def setup_method(self):
        """Create a QueryProcessor instance with a mock db connection."""
        self.mock_db = Mock()
        self.processor = QueryProcessor(self.mock_db)

    def test_handle_customer_info_no_data(self):
        """Test customer info handler with no data."""
        self.mock_db.get_customers.return_value = []
        
        answer, sources = self.processor._handle_customer_info("Who are our customers?")
        assert "No customers found" in answer
        assert sources == []

    def test_handle_customer_info_with_data(self):
        """Test customer info handler with customer data."""
        self.mock_db.get_customers.return_value = [
            {'name': 'Customer A', 'segment': 'Enterprise', 'country': 'USA'},
            {'name': 'Customer B', 'segment': 'SMB', 'country': 'Canada'},
            {'name': 'Customer C', 'segment': 'Enterprise', 'country': 'USA'}
        ]
        
        answer, sources = self.processor._handle_customer_info("Who are our customers?")
        assert "3 customers" in answer
        assert "Enterprise" in answer
        assert "USA" in answer

    def test_handle_customer_info_segments_and_countries(self):
        """Test customer info handler aggregates segments and countries."""
        self.mock_db.get_customers.return_value = [
            {'segment': 'Enterprise', 'country': 'USA'},
            {'segment': 'SMB', 'country': 'Canada'},
            {'segment': 'Enterprise', 'country': 'Germany'}
        ]
        
        answer, sources = self.processor._handle_customer_info("Customer info")
        assert "Segments:" in answer
        assert "Top countries:" in answer

    def test_handle_customer_info_exception(self):
        """Test customer info handler exception handling."""
        self.mock_db.get_customers.side_effect = Exception("DB error")
        
        answer, sources = self.processor._handle_customer_info("Who are customers?")
        assert "Error retrieving customer information" in answer
        assert sources == []


class TestHandleDocumentSearch:
    """Tests for QueryProcessor._handle_document_search"""

    def setup_method(self):
        """Create a QueryProcessor instance with a mock db connection."""
        self.mock_db = Mock()
        self.processor = QueryProcessor(self.mock_db)

    def test_handle_document_search_no_keywords(self):
        """Test document search handler with no keywords."""
        self.processor.intent_classifier.extract_keywords = Mock(return_value=[])
        
        answer, sources = self.processor._handle_document_search("Find documents")
        assert "more specific search terms" in answer
        assert sources == []

    def test_handle_document_search_no_results(self):
        """Test document search handler with no results."""
        self.processor.intent_classifier.extract_keywords = Mock(return_value=['contract'])
        self.mock_db.search_documents.return_value = []
        
        answer, sources = self.processor._handle_document_search("Find contract documents")
        assert "No documents found" in answer
        assert "contract" in answer

    def test_handle_document_search_with_results(self):
        """Test document search handler with results."""
        self.processor.intent_classifier.extract_keywords = Mock(return_value=['contract'])
        self.mock_db.search_documents.return_value = [
            {'filename': 'contract1.pdf', 'extracted_text': 'This is a contract document with important terms.'}
        ]
        
        answer, sources = self.processor._handle_document_search("Find contract documents")
        assert "Found 1 document" in answer
        assert "contract1.pdf" in answer
        assert "document:contract1.pdf" in sources

    def test_handle_document_search_exception(self):
        """Test document search handler exception handling."""
        self.processor.intent_classifier.extract_keywords = Mock(side_effect=Exception("Error"))
        
        answer, sources = self.processor._handle_document_search("Find documents")
        assert "Error searching documents" in answer
        assert sources == []


class TestHandleMixedQuery:
    """Tests for QueryProcessor._handle_mixed_query"""

    def setup_method(self):
        """Create a QueryProcessor instance with a mock db connection."""
        self.mock_db = Mock()
        self.processor = QueryProcessor(self.mock_db)

    def test_handle_mixed_query_with_documents(self):
        """Test mixed query handler with documents."""
        self.mock_db.get_sales_metrics.return_value = [
            {'month': 1, 'year': 2024, 'total_sales': 50000, 'total_costs': 30000, 'profit': 20000}
        ]
        self.processor.intent_classifier.extract_keywords = Mock(return_value=['sales'])
        self.mock_db.search_documents.return_value = [
            {'filename': 'report.pdf', 'extracted_text': 'Sales report for January'}
        ]
        
        answer, sources = self.processor._handle_mixed_query("Sales and documents")
        assert "Recent sales metrics" in answer
        assert "Relevant documents" in answer
        assert "report.pdf" in answer

    def test_handle_mixed_query_no_documents(self):
        """Test mixed query handler without documents."""
        self.mock_db.get_sales_metrics.return_value = [
            {'month': 1, 'year': 2024, 'total_sales': 50000, 'total_costs': 30000, 'profit': 20000}
        ]
        self.processor.intent_classifier.extract_keywords = Mock(return_value=['sales'])
        self.mock_db.search_documents.return_value = []
        
        answer, sources = self.processor._handle_mixed_query("Sales info")
        assert "Recent sales metrics" in answer
        assert "Relevant documents" not in answer

    def test_handle_mixed_query_exception(self):
        """Test mixed query handler exception handling."""
        self.mock_db.get_sales_metrics.side_effect = Exception("DB error")
        
        answer, sources = self.processor._handle_mixed_query("Mixed query")
        assert "Error processing" in answer
        assert sources == []


class TestExtractExcerpt:
    """Tests for QueryProcessor._extract_excerpt"""

    def setup_method(self):
        """Create a QueryProcessor instance with a dummy db connection."""
        self.processor = QueryProcessor(db_connection=None)

    # ── Empty / None inputs ────────────────────────────────────────────────

    def test_empty_text_returns_no_content_message(self):
        result = self.processor._extract_excerpt("", ["keyword"], max_length=200)
        assert result == "No content available."

    def test_none_text_returns_no_content_message(self):
        result = self.processor._extract_excerpt(None, ["keyword"], max_length=200)
        assert result == "No content available."

    # ── Keyword not found ──────────────────────────────────────────────────

    def test_keyword_not_found_returns_start_of_text(self):
        text = "Hello world, this is a test document."
        result = self.processor._extract_excerpt(text, ["missing"], max_length=20)
        assert result == text[:20]

    def test_empty_keywords_returns_start_of_text(self):
        text = "Some document content here."
        result = self.processor._extract_excerpt(text, [], max_length=10)
        assert result == text[:10]

    # ── Keyword found ──────────────────────────────────────────────────────

    def test_excerpt_contains_keyword(self):
        text = "Introduction. " + "x" * 100 + " revenue data here. " + "y" * 100
        result = self.processor._extract_excerpt(text, ["revenue"], max_length=50)
        assert "revenue" in result.lower()

    def test_excerpt_respects_max_length_approximately(self):
        text = "a" * 50 + " keyword " + "b" * 300
        result = self.processor._extract_excerpt(text, ["keyword"], max_length=100)
        # Result may include "..." prefix/suffix but should not be excessively long
        assert len(result) <= 100 + len("...") * 2 + 50  # start offset + ellipsis

    def test_keyword_at_start_no_leading_ellipsis(self):
        text = "keyword appears right at the start of this document."
        result = self.processor._extract_excerpt(text, ["keyword"], max_length=200)
        assert not result.startswith("...")

    def test_keyword_in_middle_adds_leading_ellipsis(self):
        text = "a" * 100 + " keyword " + "b" * 100
        result = self.processor._extract_excerpt(text, ["keyword"], max_length=50)
        assert result.startswith("...")

    def test_keyword_near_end_adds_trailing_ellipsis_when_text_truncated(self):
        # keyword at position 10, text is 300 chars long, max_length=50
        text = "short_pre keyword " + "c" * 300
        result = self.processor._extract_excerpt(text, ["keyword"], max_length=50)
        assert result.endswith("...")

    def test_no_trailing_ellipsis_when_excerpt_reaches_end(self):
        text = "some prefix " + "keyword at end"
        result = self.processor._extract_excerpt(text, ["keyword"], max_length=200)
        assert not result.endswith("...")

    # ── Case insensitivity ─────────────────────────────────────────────────

    def test_keyword_matching_is_case_insensitive(self):
        text = "The REVENUE figures are important."
        result = self.processor._extract_excerpt(text, ["revenue"], max_length=200)
        assert "REVENUE" in result

    # ── Multiple keywords ──────────────────────────────────────────────────

    def test_uses_earliest_keyword_position(self):
        text = "alpha comes first, then beta appears later in the text."
        # "alpha" is at position 0, "beta" is later
        result = self.processor._extract_excerpt(text, ["beta", "alpha"], max_length=200)
        # Should anchor on "alpha" (earliest), so no leading ellipsis
        assert not result.startswith("...")

    def test_multiple_keywords_none_found_returns_start(self):
        text = "No matching content here at all."
        result = self.processor._extract_excerpt(text, ["xyz", "abc"], max_length=10)
        assert result == text[:10]

    # ── Short text ─────────────────────────────────────────────────────────

    def test_short_text_shorter_than_max_length_returned_fully(self):
        text = "Short text."
        result = self.processor._extract_excerpt(text, ["short"], max_length=200)
        assert "Short text." in result

    def test_text_exactly_max_length_no_trailing_ellipsis(self):
        text = "keyword " + "x" * 192  # total 200 chars
        result = self.processor._extract_excerpt(text, ["keyword"], max_length=200)
        assert not result.endswith("...")

    # ── Result is always a string ──────────────────────────────────────────

    def test_result_is_always_a_string(self):
        cases = [
            ("", ["kw"]),
            ("some text", []),
            ("some text with keyword inside", ["keyword"]),
        ]
        for text, keywords in cases:
            result = self.processor._extract_excerpt(text, keywords, max_length=100)
            assert isinstance(result, str)

    # ── Stripping ──────────────────────────────────────────────────────────

    def test_result_is_stripped(self):
        text = "   keyword surrounded by spaces   "
        result = self.processor._extract_excerpt(text, ["keyword"], max_length=200)
        assert result == result.strip()
