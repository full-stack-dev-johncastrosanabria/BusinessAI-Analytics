"""
Chatbot query processor that routes to appropriate data sources
"""

import logging
from typing import Tuple, List
from chatbot.intent_classifier import IntentClassifier, Intent

logger = logging.getLogger(__name__)


class QueryProcessor:
    """Process chatbot queries and retrieve relevant data"""
    
    def __init__(self, db_connection):
        """
        Initialize query processor
        
        Args:
            db_connection: Database connection instance
        """
        self.db = db_connection
        self.intent_classifier = IntentClassifier()
    
    async def process_query(self, question: str) -> Tuple[str, List[str]]:
        """
        Process a natural language question and return an answer
        
        Args:
            question: User question
        
        Returns:
            Tuple of (answer, sources)
        """
        try:
            # Classify intent
            intent, confidence = self.intent_classifier.classify(question)
            logger.info(f"Processing query with intent: {intent.value}")
            
            # Route to appropriate handler
            if intent == Intent.SALES_METRICS:
                answer, sources = await self._handle_sales_metrics(question)
            elif intent == Intent.PRODUCT_INFO:
                answer, sources = await self._handle_product_info(question)
            elif intent == Intent.CUSTOMER_INFO:
                answer, sources = await self._handle_customer_info(question)
            elif intent == Intent.DOCUMENT_SEARCH:
                answer, sources = await self._handle_document_search(question)
            elif intent == Intent.MIXED:
                answer, sources = await self._handle_mixed_query(question)
            else:
                answer = "I'm not sure how to answer that question. Please try asking about sales metrics, products, customers, or documents."
                sources = []
            
            return answer, sources
        
        except Exception as e:
            logger.error(f"Error processing query: {e}", exc_info=True)
            return f"I encountered an error processing your question: {str(e)}", []
    
    async def _handle_sales_metrics(self, question: str) -> Tuple[str, List[str]]:
        """
        Handle sales metrics queries
        
        Args:
            question: User question
        
        Returns:
            Tuple of (answer, sources)
        """
        try:
            # Get sales metrics
            metrics = self.db.get_sales_metrics()
            
            if not metrics:
                return "No sales metrics data available.", []
            
            # Format response based on question
            if "best" in question.lower() or "highest" in question.lower():
                best_worst = self.db.get_best_worst_months()
                best = best_worst.get("best_month")
                if best:
                    answer = f"The best performing month was {best['month']}/{best['year']} with a profit of ${best['profit']:,.2f}."
                    return answer, ["database:business_metrics"]
            
            if "worst" in question.lower() or "lowest" in question.lower():
                best_worst = self.db.get_best_worst_months()
                worst = best_worst.get("worst_month")
                if worst:
                    answer = f"The worst performing month was {worst['month']}/{worst['year']} with a profit of ${worst['profit']:,.2f}."
                    return answer, ["database:business_metrics"]
            
            # Default: return recent metrics summary
            recent = metrics[0]
            answer = f"Recent sales metrics for {recent['month']}/{recent['year']}: Total Sales: ${recent['total_sales']:,.2f}, Total Costs: ${recent['total_costs']:,.2f}, Profit: ${recent['profit']:,.2f}."
            return answer, ["database:business_metrics"]
        
        except Exception as e:
            logger.error(f"Error handling sales metrics query: {e}")
            return f"Error retrieving sales metrics: {str(e)}", []
    
    async def _handle_product_info(self, question: str) -> Tuple[str, List[str]]:
        """
        Handle product information queries
        
        Args:
            question: User question
        
        Returns:
            Tuple of (answer, sources)
        """
        try:
            # Get products
            products = self.db.get_products(limit=10)
            
            if not products:
                return "No products found in the database.", []
            
            # Check if asking for top products
            if "top" in question.lower() or "best" in question.lower():
                top_products = self.db.get_top_products(limit=5)
                if top_products:
                    product_list = ", ".join([f"{p['name']} (${p['total_revenue']:,.2f})" for p in top_products])
                    answer = f"Top 5 products by revenue: {product_list}."
                    return answer, ["database:products"]
            
            # Default: return product count and categories
            categories = set(p['category'] for p in products)
            answer = f"We have {len(products)} products across {len(categories)} categories: {', '.join(sorted(categories))}."
            return answer, ["database:products"]
        
        except Exception as e:
            logger.error(f"Error handling product info query: {e}")
            return f"Error retrieving product information: {str(e)}", []
    
    async def _handle_customer_info(self, question: str) -> Tuple[str, List[str]]:
        """
        Handle customer information queries
        
        Args:
            question: User question
        
        Returns:
            Tuple of (answer, sources)
        """
        try:
            # Get customers
            customers = self.db.get_customers(limit=100)
            
            if not customers:
                return "No customers found in the database.", []
            
            # Analyze customer data
            segments = {}
            countries = {}
            for customer in customers:
                segment = customer.get('segment', 'Unknown')
                country = customer.get('country', 'Unknown')
                segments[segment] = segments.get(segment, 0) + 1
                countries[country] = countries.get(country, 0) + 1
            
            # Format response
            segment_str = ", ".join([f"{count} {segment}" for segment, count in sorted(segments.items())])
            country_str = ", ".join([f"{count} from {country}" for country, count in sorted(countries.items(), key=lambda x: x[1], reverse=True)[:5]])
            
            answer = f"We have {len(customers)} customers. Segments: {segment_str}. Top countries: {country_str}."
            return answer, ["database:customers"]
        
        except Exception as e:
            logger.error(f"Error handling customer info query: {e}")
            return f"Error retrieving customer information: {str(e)}", []
    
    async def _handle_document_search(self, question: str) -> Tuple[str, List[str]]:
        """
        Handle document search queries
        
        Args:
            question: User question
        
        Returns:
            Tuple of (answer, sources)
        """
        try:
            # Extract keywords
            keywords = self.intent_classifier.extract_keywords(question)
            
            if not keywords:
                return "Please provide more specific search terms.", []
            
            # Search documents
            results = self.db.search_documents(keywords, limit=3)
            
            if not results:
                return f"No documents found matching your search for: {', '.join(keywords)}.", []
            
            # Format response with excerpts
            sources = []
            answer_parts = [f"Found {len(results)} document(s) matching your search:"]
            
            for result in results:
                filename = result.get('filename', 'Unknown')
                text = result.get('extracted_text', '')
                sources.append(f"document:{filename}")
                
                # Extract relevant excerpt
                excerpt = self._extract_excerpt(text, keywords, max_length=200)
                answer_parts.append(f"\n- {filename}: {excerpt}")
            
            answer = "\n".join(answer_parts)
            return answer, sources
        
        except Exception as e:
            logger.error(f"Error handling document search query: {e}")
            return f"Error searching documents: {str(e)}", []
    
    async def _handle_mixed_query(self, question: str) -> Tuple[str, List[str]]:
        """
        Handle mixed intent queries combining database and document search
        
        Args:
            question: User question
        
        Returns:
            Tuple of (answer, sources)
        """
        try:
            # Get database results
            db_answer, db_sources = await self._handle_sales_metrics(question)
            
            # Get document results
            keywords = self.intent_classifier.extract_keywords(question)
            doc_results = self.db.search_documents(keywords, limit=2) if keywords else []
            
            # Combine answers
            answer_parts = [db_answer]
            sources = db_sources.copy()
            
            if doc_results:
                answer_parts.append("\nRelevant documents:")
                for result in doc_results:
                    filename = result.get('filename', 'Unknown')
                    text = result.get('extracted_text', '')
                    sources.append(f"document:{filename}")
                    excerpt = self._extract_excerpt(text, keywords, max_length=150)
                    answer_parts.append(f"- {filename}: {excerpt}")
            
            answer = "\n".join(answer_parts)
            return answer, sources
        
        except Exception as e:
            logger.error(f"Error handling mixed query: {e}")
            return f"Error processing your question: {str(e)}", []
    
    def _extract_excerpt(self, text: str, keywords: List[str], max_length: int = 200) -> str:
        """
        Extract relevant excerpt from text based on keywords
        
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
        
        # Find first occurrence of any keyword
        earliest_pos = len(text)
        for keyword in keywords:
            pos = text_lower.find(keyword.lower())
            if pos != -1 and pos < earliest_pos:
                earliest_pos = pos
        
        # Extract excerpt around keyword
        if earliest_pos == len(text):
            # No keyword found, return beginning
            excerpt = text[:max_length]
        else:
            start = max(0, earliest_pos - 50)
            end = min(len(text), earliest_pos + max_length)
            excerpt = text[start:end]
            if start > 0:
                excerpt = "..." + excerpt
            if end < len(text):
                excerpt = excerpt + "..."
        
        return excerpt.strip()
