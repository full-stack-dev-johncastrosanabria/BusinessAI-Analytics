"""
Chatbot query processor that routes to appropriate data sources.
"""

import logging
from typing import List, Tuple

from chatbot.intent_classifier import Intent, IntentClassifier

logger = logging.getLogger(__name__)

DB_BUSINESS_METRICS = "database:business_metrics"


class QueryProcessor:
    """Process chatbot queries and retrieve relevant data."""

    def __init__(self, db_connection) -> None:
        """
        Initialize query processor.

        Args:
            db_connection: Database connection instance
        """
        self.db = db_connection
        self.intent_classifier = IntentClassifier()

    async def process_query(
        self, question: str
    ) -> Tuple[str, List[str]]:
        """
        Process a natural language question and return an answer.

        Args:
            question: User question

        Returns:
            Tuple of (answer, sources)
        """
        try:
            intent, _confidence, _language = self.intent_classifier.classify(
                question
            )
            logger.info("Processing query with intent: %s", intent.value)

            if intent == Intent.SALES_METRICS:
                return await self._handle_sales_metrics(question)
            if intent == Intent.PRODUCT_INFO:
                return await self._handle_product_info(question)
            if intent == Intent.CUSTOMER_INFO:
                return await self._handle_customer_info(question)
            if intent == Intent.DOCUMENT_SEARCH:
                return await self._handle_document_search(question)
            if intent == Intent.MIXED:
                return await self._handle_mixed_query(question)

            return (
                "I'm not sure how to answer that question. "
                "Please try asking about sales metrics, products, "
                "customers, or documents.",
                [],
            )

        except Exception as e:
            logger.error("Error processing query: %s", e, exc_info=True)
            return (
                "I encountered an error processing your question.",
                [],
            )

    async def _handle_sales_metrics(
        self, question: str
    ) -> Tuple[str, List[str]]:
        """
        Handle sales metrics queries.

        Args:
            question: User question

        Returns:
            Tuple of (answer, sources)
        """
        try:
            metrics = self.db.get_sales_metrics()

            if not metrics:
                return "No sales metrics data available.", []

            q = question.lower()
            if "best" in q or "highest" in q:
                best_worst = self.db.get_best_worst_months()
                best = best_worst.get("best_month")
                if best:
                    answer = (
                        f"The best performing month was "
                        f"{best['month']}/{best['year']} "
                        f"with a profit of ${best['profit']:,.2f}."
                    )
                    return answer, [DB_BUSINESS_METRICS]

            if "worst" in q or "lowest" in q:
                best_worst = self.db.get_best_worst_months()
                worst = best_worst.get("worst_month")
                if worst:
                    answer = (
                        f"The worst performing month was "
                        f"{worst['month']}/{worst['year']} "
                        f"with a profit of ${worst['profit']:,.2f}."
                    )
                    return answer, [DB_BUSINESS_METRICS]

            recent = metrics[0]
            answer = (
                f"Recent sales metrics for "
                f"{recent['month']}/{recent['year']}: "
                f"Total Sales: ${recent['total_sales']:,.2f}, "
                f"Total Costs: ${recent['total_costs']:,.2f}, "
                f"Profit: ${recent['profit']:,.2f}."
            )
            return answer, [DB_BUSINESS_METRICS]

        except Exception as e:
            logger.error("Error handling sales metrics query: %s", e)
            return "Error retrieving sales metrics.", []

    async def _handle_product_info(
        self, question: str
    ) -> Tuple[str, List[str]]:
        """
        Handle product information queries.

        Args:
            question: User question

        Returns:
            Tuple of (answer, sources)
        """
        try:
            products = self.db.get_products(limit=10)

            if not products:
                return "No products found in the database.", []

            q = question.lower()
            if "top" in q or "best" in q:
                top_products = self.db.get_top_products(limit=5)
                if top_products:
                    product_list = ", ".join(
                        f"{p['name']} (${p['total_revenue']:,.2f})"
                        for p in top_products
                    )
                    answer = f"Top 5 products by revenue: {product_list}."
                    return answer, ["database:products"]

            categories = {p["category"] for p in products}
            answer = (
                f"We have {len(products)} products across "
                f"{len(categories)} categories: "
                f"{', '.join(sorted(categories))}."
            )
            return answer, ["database:products"]

        except Exception as e:
            logger.error("Error handling product info query: %s", e)
            return "Error retrieving product information.", []

    async def _handle_customer_info(
        self, _question: str
    ) -> Tuple[str, List[str]]:
        """
        Handle customer information queries.

        Args:
            question: User question

        Returns:
            Tuple of (answer, sources)
        """
        try:
            customers = self.db.get_customers(limit=100)

            if not customers:
                return "No customers found in the database.", []

            segments: dict = {}
            countries: dict = {}
            for customer in customers:
                seg = customer.get("segment", "Unknown")
                cty = customer.get("country", "Unknown")
                segments[seg] = segments.get(seg, 0) + 1
                countries[cty] = countries.get(cty, 0) + 1

            segment_str = ", ".join(
                f"{count} {seg}"
                for seg, count in sorted(segments.items())
            )
            top_countries = sorted(
                countries.items(), key=lambda x: x[1], reverse=True
            )[:5]
            country_str = ", ".join(
                f"{count} from {cty}" for cty, count in top_countries
            )

            answer = (
                f"We have {len(customers)} customers. "
                f"Segments: {segment_str}. "
                f"Top countries: {country_str}."
            )
            return answer, ["database:customers"]

        except Exception as e:
            logger.error("Error handling customer info query: %s", e)
            return "Error retrieving customer information.", []

    async def _handle_document_search(
        self, question: str
    ) -> Tuple[str, List[str]]:
        """
        Handle document search queries.

        Args:
            question: User question

        Returns:
            Tuple of (answer, sources)
        """
        try:
            keywords = self.intent_classifier.extract_keywords(question)

            if not keywords:
                return "Please provide more specific search terms.", []

            results = self.db.search_documents(keywords, limit=3)

            if not results:
                return (
                    f"No documents found matching your search for: "
                    f"{', '.join(keywords)}.",
                    [],
                )

            sources = []
            answer_parts = [
                f"Found {len(results)} document(s) matching your search:"
            ]

            for result in results:
                filename = result.get("filename", "Unknown")
                text = result.get("extracted_text", "")
                sources.append(f"document:{filename}")
                excerpt = self._extract_excerpt(
                    text, keywords, max_length=200
                )
                answer_parts.append(f"\n- {filename}: {excerpt}")

            return "\n".join(answer_parts), sources

        except Exception as e:
            logger.error("Error handling document search query: %s", e)
            return "Error searching documents.", []

    async def _handle_mixed_query(
        self, question: str
    ) -> Tuple[str, List[str]]:
        """
        Handle mixed intent queries combining database and document search.

        Args:
            question: User question

        Returns:
            Tuple of (answer, sources)
        """
        try:
            db_answer, db_sources = await self._handle_sales_metrics(
                question
            )
            keywords = self.intent_classifier.extract_keywords(question)
            doc_results = (
                self.db.search_documents(keywords, limit=2)
                if keywords
                else []
            )

            answer_parts = [db_answer]
            sources = list(db_sources)

            if doc_results:
                answer_parts.append("\nRelevant documents:")
                for result in doc_results:
                    filename = result.get("filename", "Unknown")
                    text = result.get("extracted_text", "")
                    sources.append(f"document:{filename}")
                    excerpt = self._extract_excerpt(
                        text, keywords, max_length=150
                    )
                    answer_parts.append(f"- {filename}: {excerpt}")

            return "\n".join(answer_parts), sources

        except Exception as e:
            logger.error("Error handling mixed query: %s", e)
            return "Error processing your question.", []

    def _extract_excerpt(
        self,
        text: str,
        keywords: List[str],
        max_length: int = 200,
    ) -> str:
        """
        Extract relevant excerpt from text based on keywords.

        Args:
            text: Full text
            keywords: Keywords to search for
            max_length: Maximum excerpt length

        Returns:
            Excerpt containing keywords
        """
        if not text:
            return "No content available."

        text_lower = text.lower()
        earliest_pos = len(text)
        for keyword in keywords:
            pos = text_lower.find(keyword.lower())
            if pos != -1 and pos < earliest_pos:
                earliest_pos = pos

        if earliest_pos == len(text):
            return text[:max_length]

        start = max(0, earliest_pos - 50)
        end = min(len(text), earliest_pos + max_length)
        excerpt = text[start:end]
        if start > 0:
            excerpt = "..." + excerpt
        if end < len(text):
            excerpt = excerpt + "..."

        return excerpt.strip()
