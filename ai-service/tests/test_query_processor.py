"""
Unit tests for QueryProcessor._extract_excerpt
Tests various inputs including edge cases and critical paths.
"""

import pytest
from chatbot.query_processor import QueryProcessor


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
