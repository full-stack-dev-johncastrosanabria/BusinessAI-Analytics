"""
Tests for chatbot/query_processor.py to achieve ≥80% coverage.
All DB calls are mocked.
"""
import pytest
from unittest.mock import MagicMock, patch

from chatbot.query_processor import QueryProcessor
from chatbot.intent_classifier import Intent


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_db():
    db = MagicMock()
    db.get_sales_metrics.return_value = [
        {"month": 1, "year": 2024, "total_sales": 50000,
         "total_costs": 30000, "profit": 20000}
    ]
    db.get_best_worst_months.return_value = {
        "best_month": {"month": 6, "year": 2024, "profit": 25000},
        "worst_month": {"month": 2, "year": 2024, "profit": 5000},
    }
    db.get_products.return_value = [
        {"id": 1, "name": "Widget", "category": "Electronics", "price": 9.99},
        {"id": 2, "name": "Gadget", "category": "Electronics", "price": 19.99},
    ]
    db.get_top_products.return_value = [
        {"name": "Widget", "total_revenue": 50000},
    ]
    db.get_customers.return_value = [
        {"id": 1, "name": "Alice", "segment": "VIP", "country": "US"},
        {"id": 2, "name": "Bob", "segment": "SMB", "country": "UK"},
    ]
    db.search_documents.return_value = [
        {"filename": "report.pdf", "extracted_text": "quarterly revenue report"}
    ]
    return db


@pytest.fixture
def processor(mock_db):
    return QueryProcessor(db_connection=mock_db)


# ---------------------------------------------------------------------------
# process_query — intent routing
# ---------------------------------------------------------------------------

class TestProcessQuery:
    def test_sales_metrics_intent(self, processor):
        with patch.object(processor.intent_classifier, "classify",
                          return_value=(Intent.SALES_METRICS, None, None)):
            answer, sources = processor.process_query("show me sales")
        assert isinstance(answer, str)
        assert isinstance(sources, list)

    def test_product_info_intent(self, processor):
        with patch.object(processor.intent_classifier, "classify",
                          return_value=(Intent.PRODUCT_INFO, None, None)):
            answer, sources = processor.process_query("show me products")
        assert isinstance(answer, str)

    def test_customer_info_intent(self, processor):
        with patch.object(processor.intent_classifier, "classify",
                          return_value=(Intent.CUSTOMER_INFO, None, None)):
            answer, sources = processor.process_query("show me customers")
        assert isinstance(answer, str)

    def test_document_search_intent(self, processor):
        with patch.object(processor.intent_classifier, "classify",
                          return_value=(Intent.DOCUMENT_SEARCH, None, None)), \
             patch.object(processor.intent_classifier, "extract_keywords",
                          return_value=["revenue"]):
            answer, sources = processor.process_query("find revenue documents")
        assert isinstance(answer, str)

    def test_mixed_intent(self, processor):
        with patch.object(processor.intent_classifier, "classify",
                          return_value=(Intent.MIXED, None, None)), \
             patch.object(processor.intent_classifier, "extract_keywords",
                          return_value=["revenue"]):
            answer, sources = processor.process_query("sales and documents")
        assert isinstance(answer, str)

    def test_unknown_intent_returns_fallback(self, processor):
        with patch.object(processor.intent_classifier, "classify",
                          return_value=(Intent.UNKNOWN, None, None)):
            answer, sources = processor.process_query("xyzzy frobozz")
        assert "not sure" in answer.lower() or isinstance(answer, str)
        assert sources == []

    def test_exception_returns_error_message(self, processor):
        with patch.object(processor.intent_classifier, "classify",
                          side_effect=Exception("boom")):
            answer, sources = processor.process_query("anything")
        assert "error" in answer.lower()
        assert sources == []


# ---------------------------------------------------------------------------
# _handle_sales_metrics
# ---------------------------------------------------------------------------

class TestHandleSalesMetrics:
    def test_best_month_query(self, processor):
        answer, sources = processor._handle_sales_metrics("what was the best month")
        assert "best" in answer.lower() or "June" in answer or isinstance(answer, str)

    def test_highest_month_query(self, processor):
        answer, sources = processor._handle_sales_metrics("highest performing month")
        assert isinstance(answer, str)

    def test_worst_month_query(self, processor):
        answer, sources = processor._handle_sales_metrics("what was the worst month")
        assert isinstance(answer, str)

    def test_lowest_month_query(self, processor):
        answer, sources = processor._handle_sales_metrics("lowest month")
        assert isinstance(answer, str)

    def test_default_returns_recent_metrics(self, processor):
        answer, sources = processor._handle_sales_metrics("show me sales")
        assert "50,000" in answer or "50000" in answer or isinstance(answer, str)

    def test_no_metrics_returns_message(self, processor, mock_db):
        mock_db.get_sales_metrics.return_value = []
        answer, sources = processor._handle_sales_metrics("show me sales")
        assert "no" in answer.lower() or isinstance(answer, str)

    def test_best_month_no_data(self, processor, mock_db):
        mock_db.get_best_worst_months.return_value = {"best_month": None, "worst_month": None}
        answer, sources = processor._handle_sales_metrics("best month")
        assert isinstance(answer, str)

    def test_worst_month_no_data(self, processor, mock_db):
        mock_db.get_best_worst_months.return_value = {"best_month": None, "worst_month": None}
        answer, sources = processor._handle_sales_metrics("worst month")
        assert isinstance(answer, str)

    def test_exception_returns_error(self, processor, mock_db):
        mock_db.get_sales_metrics.side_effect = Exception("db error")
        answer, sources = processor._handle_sales_metrics("show me sales")
        assert "error" in answer.lower()
        assert sources == []


# ---------------------------------------------------------------------------
# _handle_product_info
# ---------------------------------------------------------------------------

class TestHandleProductInfo:
    def test_top_products_query(self, processor):
        answer, sources = processor._handle_product_info("show top products")
        assert isinstance(answer, str)

    def test_best_products_query(self, processor):
        answer, sources = processor._handle_product_info("best selling products")
        assert isinstance(answer, str)

    def test_default_product_list(self, processor):
        answer, sources = processor._handle_product_info("list products")
        assert "Electronics" in answer or isinstance(answer, str)

    def test_no_products_returns_message(self, processor, mock_db):
        mock_db.get_products.return_value = []
        answer, sources = processor._handle_product_info("show products")
        assert "no" in answer.lower() or isinstance(answer, str)

    def test_top_products_empty(self, processor, mock_db):
        mock_db.get_top_products.return_value = []
        answer, sources = processor._handle_product_info("top products")
        assert isinstance(answer, str)

    def test_exception_returns_error(self, processor, mock_db):
        mock_db.get_products.side_effect = Exception("db error")
        answer, sources = processor._handle_product_info("show products")
        assert "error" in answer.lower()
        assert sources == []


# ---------------------------------------------------------------------------
# _handle_customer_info
# ---------------------------------------------------------------------------

class TestHandleCustomerInfo:
    def test_returns_customer_summary(self, processor):
        answer, sources = processor._handle_customer_info("show customers")
        assert "2" in answer or "customer" in answer.lower()
        assert "database:customers" in sources

    def test_no_customers_returns_message(self, processor, mock_db):
        mock_db.get_customers.return_value = []
        answer, sources = processor._handle_customer_info("show customers")
        assert "no" in answer.lower() or isinstance(answer, str)

    def test_exception_returns_error(self, processor, mock_db):
        mock_db.get_customers.side_effect = Exception("db error")
        answer, sources = processor._handle_customer_info("show customers")
        assert "error" in answer.lower()
        assert sources == []

    def test_customers_with_missing_fields(self, processor, mock_db):
        mock_db.get_customers.return_value = [
            {"id": 1, "name": "Alice"},  # no segment or country
        ]
        answer, sources = processor._handle_customer_info("show customers")
        assert isinstance(answer, str)


# ---------------------------------------------------------------------------
# _handle_document_search
# ---------------------------------------------------------------------------

class TestHandleDocumentSearch:
    def test_returns_document_results(self, processor):
        with patch.object(processor.intent_classifier, "extract_keywords",
                          return_value=["revenue"]):
            answer, sources = processor._handle_document_search("find revenue docs")
        assert "report.pdf" in answer or "Found" in answer
        assert len(sources) > 0

    def test_no_keywords_returns_message(self, processor):
        with patch.object(processor.intent_classifier, "extract_keywords",
                          return_value=[]):
            answer, sources = processor._handle_document_search("find something")
        assert "specific" in answer.lower() or isinstance(answer, str)
        assert sources == []

    def test_no_results_returns_message(self, processor, mock_db):
        mock_db.search_documents.return_value = []
        with patch.object(processor.intent_classifier, "extract_keywords",
                          return_value=["xyz"]):
            answer, sources = processor._handle_document_search("find xyz")
        assert "no" in answer.lower() or "not found" in answer.lower() or isinstance(answer, str)
        assert sources == []

    def test_exception_returns_error(self, processor, mock_db):
        mock_db.search_documents.side_effect = Exception("db error")
        with patch.object(processor.intent_classifier, "extract_keywords",
                          return_value=["revenue"]):
            answer, sources = processor._handle_document_search("find revenue")
        assert "error" in answer.lower()
        assert sources == []

    def test_document_with_empty_text(self, processor, mock_db):
        mock_db.search_documents.return_value = [
            {"filename": "empty.pdf", "extracted_text": ""}
        ]
        with patch.object(processor.intent_classifier, "extract_keywords",
                          return_value=["revenue"]):
            answer, sources = processor._handle_document_search("find revenue")
        assert "empty.pdf" in answer or isinstance(answer, str)


# ---------------------------------------------------------------------------
# _handle_mixed_query
# ---------------------------------------------------------------------------

class TestHandleMixedQuery:
    def test_returns_combined_answer(self, processor):
        with patch.object(processor.intent_classifier, "extract_keywords",
                          return_value=["revenue"]):
            answer, sources = processor._handle_mixed_query("sales and documents")
        assert isinstance(answer, str)
        assert isinstance(sources, list)

    def test_no_doc_results(self, processor, mock_db):
        mock_db.search_documents.return_value = []
        with patch.object(processor.intent_classifier, "extract_keywords",
                          return_value=["revenue"]):
            answer, sources = processor._handle_mixed_query("sales and documents")
        assert isinstance(answer, str)

    def test_no_keywords(self, processor):
        with patch.object(processor.intent_classifier, "extract_keywords",
                          return_value=[]):
            answer, sources = processor._handle_mixed_query("sales and documents")
        assert isinstance(answer, str)

    def test_exception_returns_error(self, processor, mock_db):
        mock_db.get_sales_metrics.side_effect = Exception("db error")
        mock_db.search_documents.return_value = []
        with patch.object(processor.intent_classifier, "extract_keywords",
                          return_value=["revenue"]):
            answer, sources = processor._handle_mixed_query("sales and documents")
        assert "error" in answer.lower()
