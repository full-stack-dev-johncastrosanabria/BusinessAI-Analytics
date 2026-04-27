"""
Advanced Query Processor - Business Intelligence Assistant
Handles complex business queries in English and Spanish with real database data.
"""

import re
import logging
from typing import Tuple, List, Optional, Dict, Any
from chatbot.intent_classifier import AdvancedIntentClassifier, Intent, Language

logger = logging.getLogger(__name__)

# ── Constants for repeated strings ──────────────────────────────────────────
# Database table names
DB_BUSINESS_METRICS = "business_metrics"
DB_SALES_TRANSACTIONS = "sales_transactions"
DB_PRODUCTS = "products"
DB_CUSTOMERS = "customers"

# Spanish query patterns
CUSTOMER_SEGMENT_ES = 'qué cliente o segmento'
CUSTOMER_SEGMENT_EN = 'which customer segment'
PROMOTION_TARGET_ES = 'debería promocionarse'
CUSTOMER_TYPE_ES = 'tipo de cliente'
CAMPAIGN_INTEREST_ES = 'interesantes para campaña'
BEST_LAUNCH_MONTH_ES = 'mejor mes para lanzar'
EXPENSIVE_PRODUCTS_ES = 'vender productos más caros'
BEST_ACCEPTANCE_ES = 'mejor aceptación'
MOST_PROFITABLE_CLIENT_ES = 'cliente nos deja más dinero'
LAUNCH_PROMOTIONS_ES = 'lanzar promociones'
SALES_BEHAVIOR_ES = 'comportamiento de ventas'
COST_COVERAGE_ES = 'cubrieron los costos'
ACTUAL_PROFIT_ES = 'nos quedó realmente'
RISING_COSTS_ES = 'costos están creciendo'
NEGATIVE_PROFIT_ES = 'utilidad fue negativa'
MOST_PROFITABLE_YEAR_ES = 'año fue más rentable'
MONEY_DRAIN_ES = 'se nos está yendo la plata'
PROFIT_VS_SALES_ES = 'ganando o solo vendiendo'
REDUCE_EXPENSES_ES = 'reducir gastos'
WORST_MONTH_ES = 'peor mes'
WORST_MONTH_EN = 'worst month'
WORST_PERFORMING_EN = 'worst performing'
BREAKEVEN_POINT_ES = 'punto de equilibrio'
MOST_OFTEN_EN = 'most often'
MOST_FREQUENT_ES = 'más seguido'
MOST_VALUABLE_ES = 'más valioso'
MOST_VALUABLE_EN = 'most valuable'
LAST_YEAR_ES = 'año pasado'
LAST_YEAR_EN = 'last year'
YEAR_REGEX = r'\b(20\d{2})\b'

# Additional constants for remaining duplications
SEGMENT_BOUGHT_ES = 'segmento compró'
COUNTRY_BETTER_ES = 'país tuvo mejor'
BUYING_LESS_ES = 'comprando menos'
CUSTOMER_SEGMENT_SEEMS_EN = 'customer segment seems'
SEGMENT_SEEMS_ES = 'segmento parece'
COUNTRY_SEGMENT_ES = 'qué país o segmento'
COUNTRY_SEGMENT_EN = 'which country or segment'
COUNTRY_SEGMENT_BUYS_ES = 'país o segmento compra'
COUNTRY_SEGMENT_BUYS_EN = 'country or segment buys'

# Intent classifier constants
BILLING_ES = "facturación"
COLLECTION_ES = "recaudación"
LOSS_ES = "pérdida"
WHEN_ES = "cuándo"

# Error messages
INSUFFICIENT_TRAINING_DATA = "Insufficient training data. Need at least 24 months of historical data."

# ── Stop words to strip from document keyword searches ──────────────────────
_DOC_STOP_WORDS = {
    'que', 'qué', 'cuál', 'cual', 'tenemos', 'sobre', 'acerca', 'de', 'del',
    'los', 'las', 'un', 'una', 'el', 'la', 'en', 'con', 'para', 'por',
    'documentos', 'documento', 'archivos', 'archivo', 'información', 'info',
    'what', 'which', 'do', 'we', 'have', 'about', 'our', 'the', 'a', 'an',
    'documents', 'document', 'files', 'file', 'information', 'show', 'me',
    'find', 'search', 'get', 'give', 'tell', 'is', 'are', 'any',
}

MONTHS_EN = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
    'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11,
    'december': 12, 'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
}
MONTHS_ES = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
    'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11,
    'diciembre': 12,
}
QUARTER_MONTHS = {'q1': [1, 2, 3], 'q2': [4, 5, 6], 'q3': [7, 8, 9], 'q4': [10, 11, 12]}
MONTH_NAMES_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
MONTH_NAMES_ES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']


class AdvancedQueryProcessor:
    """Business intelligence assistant with multilingual support."""

    def __init__(self, db_connection):
        self.db = db_connection
        self.classifier = AdvancedIntentClassifier()

    # ── Public entry point ───────────────────────────────────────────────────

    async def process_query(self, question: str) -> Tuple[str, List[str]]:
        language = Language.ENGLISH
        try:
            intent, confidence, language = self.classifier.classify(question)
            logger.info("Query intent=%s conf=%.2f lang=%s",
                        intent.value, confidence, language.value)

            q = question.lower()
            intent = self._override_intent(q, intent)

            handler_map = {
                Intent.SALES_METRICS:           self._handle_sales_metrics,
                Intent.REVENUE_ANALYSIS:        self._handle_sales_metrics,
                Intent.PROFIT_ANALYSIS:         self._handle_profit_analysis,
                Intent.PRODUCT_INFO:            self._handle_product_info,
                Intent.PRODUCT_PERFORMANCE:     self._handle_product_info,
                Intent.CUSTOMER_INFO:           self._handle_customer_info,
                Intent.CUSTOMER_SATISFACTION:   self._handle_customer_info,
                Intent.DOCUMENT_SEARCH:         self._handle_document_search,
                Intent.FORECAST_PREDICTION:     self._handle_forecast,
                Intent.COMPARISON_ANALYSIS:     self._handle_comparison,
                Intent.TREND_ANALYSIS:          self._handle_trend_analysis,
                Intent.MARKET_ANALYSIS:         self._handle_market_analysis,
                Intent.COMPETITIVE_INTELLIGENCE: self._handle_competitive_intelligence,
                Intent.MIXED:                   self._handle_mixed_query,
            }
            handler = handler_map.get(intent, self._handle_unknown)
            answer, sources = await handler(question, language)

            if language == Language.SPANISH:
                answer = self.classifier.translate_response(answer, language)

            return answer, sources

        except Exception as e:
            logger.error("Error processing query: %s", e, exc_info=True)
            return self._err(language), []

    # ── Intent override layer ────────────────────────────────────────────────

    def _override_intent(self, q: str, intent: Intent) -> Intent:
        """Keyword-based routing that fires regardless of classifier output."""
        
        # Check high-priority patterns first
        if self._is_customer_segment_query(q):
            return Intent.CUSTOMER_INFO
        
        if self._is_marketing_analysis_query(q):
            return Intent.CUSTOMER_INFO
        
        if self._is_accounting_analysis_query(q):
            return Intent.PROFIT_ANALYSIS
        
        if self._is_worst_month_query(q):
            return Intent.PROFIT_ANALYSIS
        
        if self._is_sales_billing_query(q):
            return self._route_sales_billing_query(q)
        
        if self._is_product_analysis_query(q):
            return Intent.PRODUCT_INFO
        
        if self._is_trend_analysis_query(q):
            return Intent.TREND_ANALYSIS
        
        # Check break-even signals
        if self._is_breakeven_query(q):
            return self._route_breakeven_query(q)
        
        # Check for customer segment questions
        if self._is_specific_customer_segment_query(q):
            return Intent.CUSTOMER_INFO
        
        # Check for high sales low profit
        if self._is_high_sales_low_profit_query(q):
            return Intent.PROFIT_ANALYSIS
        
        # Route by signal type
        return self._route_by_signal_type(q, intent)

    def _is_customer_segment_query(self, q: str) -> bool:
        """Check for customer segment questions - HIGHEST PRIORITY."""
        return any(phrase in q for phrase in [
            CUSTOMER_SEGMENT_ES, CUSTOMER_SEGMENT_EN, 
            'qué país o segmento', 'which country or segment'
        ])

    def _is_marketing_analysis_query(self, q: str) -> bool:
        """Check for marketing and business analysis questions."""
        return any(w in q for w in [
            CUSTOMER_TYPE_ES, SEGMENT_BOUGHT_ES, COUNTRY_BETTER_ES, PROMOTION_TARGET_ES,
            CAMPAIGN_INTEREST_ES, BUYING_LESS_ES, BEST_LAUNCH_MONTH_ES,
            BEST_ACCEPTANCE_ES, EXPENSIVE_PRODUCTS_ES, MOST_PROFITABLE_CLIENT_ES,
            SALES_BEHAVIOR_ES, LAUNCH_PROMOTIONS_ES
        ])

    def _is_accounting_analysis_query(self, q: str) -> bool:
        """Check for accounting and cost analysis questions."""
        return any(w in q for w in [
            'gastamos más', COST_COVERAGE_ES, ACTUAL_PROFIT_ES,
            NEGATIVE_PROFIT_ES, RISING_COSTS_ES, MOST_PROFITABLE_YEAR_ES,
            REDUCE_EXPENSES_ES, MONEY_DRAIN_ES, PROFIT_VS_SALES_ES
        ])

    def _is_worst_month_query(self, q: str) -> bool:
        """Check for worst month and closest to loss questions."""
        return any(w in q for w in [
            'mes con peor utilidad', WORST_MONTH_ES, WORST_MONTH_EN, WORST_PERFORMING_EN,
            'más cerca de pérdida', 'closest to loss', 'near bankruptcy', 'estuvimos cerca'
        ])

    def _is_sales_billing_query(self, q: str) -> bool:
        """Check for sales and billing questions."""
        sales_billing_patterns = [
            'factura más alta', 'venta más alta', 'highest transaction', 'highest sale',
            'se facturó más', 'producto se facturó', 'product was invoiced', 'top product by revenue',
            'día tuvimos más ventas', 'day with most sales', 'highest sales day', 'best day',
            'ventas muy pequeñas', 'small transactions', 'low value sales', 'tiny sales',
            'cuántas ventas hicimos', 'how many sales', 'sales per month', 'ventas por mes',
            'se facturó', 'generó más ingresos', 'ventas hicimos', 'compraron más cantidad',
            'vende más por volumen', 'no han comprado recientemente'
        ]
        return any(w in q for w in sales_billing_patterns)

    def _route_sales_billing_query(self, q: str) -> Intent:
        """Route sales and billing queries to appropriate intent."""
        if any(w in q for w in ['factura más alta', 'venta más alta', 'highest transaction', 'highest sale']):
            return Intent.SALES_METRICS
        if any(w in q for w in ['se facturó más', 'producto se facturó', 'product was invoiced', 'top product by revenue']):
            return Intent.PRODUCT_INFO
        if any(w in q for w in ['día tuvimos más ventas', 'day with most sales', 'highest sales day', 'best day']):
            return Intent.SALES_METRICS
        if any(w in q for w in ['ventas muy pequeñas', 'small transactions', 'low value sales', 'tiny sales']):
            return Intent.SALES_METRICS
        if any(w in q for w in ['cuántas ventas hicimos', 'how many sales', 'sales per month', 'ventas por mes']):
            return Intent.SALES_METRICS
        if any(w in q for w in ['se facturó', 'generó más ingresos', 'ventas hicimos', 'compraron más cantidad',
                                'vende más por volumen', 'no han comprado recientemente']):
            return Intent.SALES_METRICS if any(w in q for w in ['facturó', 'ventas', 'día']) else Intent.CUSTOMER_INFO
        return Intent.SALES_METRICS

    def _is_product_analysis_query(self, q: str) -> bool:
        """Check for product analysis questions."""
        return any(w in q for w in [
            'inflado en ventas', 'subir de precio', 'dejar de vender', 'menos rentable'
        ])

    def _is_trend_analysis_query(self, q: str) -> bool:
        """Check for complex trend analysis questions."""
        return any(w in q for w in [
            'vendiendo más pero ganando menos', 'mes fue raro', 'casi nos fuimos a pérdida',
            'mejorar la utilidad', 'explícame por mes'
        ])

    def _is_breakeven_query(self, q: str) -> bool:
        """Check for break-even analysis signals."""
        breakeven_signals = [
            'break-even', 'break even', 'breakeven', BREAKEVEN_POINT_ES,
            'equilibrio', 'closest to zero', 'cerca de cero', 'más cerca de cero',
            'closest to break-even', 'break even point', BREAKEVEN_POINT_ES,
            'cover costs', 'cubrir costos', 'cover expenses', 'cubrir gastos',
            'cuánto tendríamos que vender', 'cuánto vender', 'how much revenue',
            'how much do we need', 'cuánto necesitamos', 'para cubrir',
            'loss to profit', 'pérdida a ganancia', 'perdida a ganancia',
            'first profitable', 'primer mes rentable', 'first profit',
            'primera ganancia', 'operating below', 'operar por debajo',
            'risk of operating', 'riesgo de operar', 'negative profit',
            'ganancia negativa', 'profit negative', 'utilidad negativa',
            'sales lower than costs', 'ventas menores que costos',
            'ventas menores que la suma', 'suma de costos y gastos',
            'costs increase', 'costos suben', 'costos aumentan',
            'maintain profit', 'mantener utilidad', 'mantener ganancia',
            WORST_MONTH_EN, WORST_MONTH_ES, WORST_PERFORMING_EN, 'peor rendimiento',
            'high sales low profit', 'ventas altas ganancia baja', 'vendimos mucho ganamos poco',
            'surprisingly well', 'sorprendentemente bien', 'performed well',
            'suspicious', 'sospechoso', 'too high', 'muy altas', 'too low', 'muy bajas',
            'closest to losing', 'más cerca de perder', 'losing money', 'perder dinero',
            'stop being profitable', 'deje de ser rentable', 'dejar de ser rentable',
            'almost broke', 'casi se rompe', 'nearly failed', 'casi fracasa',
            'underpriced', 'muy barato', 'too cheap', 'demasiado barato',
            'sells well low profit', 'vende bien poca ganancia', 'high volume low margin',
            MOST_VALUABLE_EN, MOST_VALUABLE_ES, MOST_OFTEN_EN, MOST_FREQUENT_ES, 'buys frequently'
        ]
        return any(s in q for s in breakeven_signals)

    def _route_breakeven_query(self, q: str) -> Intent:
        """Route break-even queries to appropriate intent."""
        product_signals = [
            'product', 'products', 'producto', 'productos', 'item', 'items',
            'most sold', 'best selling', 'bestseller', 'top selling',
            'más vendido', 'más vendidos', 'más popular', 'más populares',
            'selling', 'vendido', 'vendidos', 'sku', 'catalog', 'catálogo',
            'categoría', 'categoria', 'category', 'categories',
            'which product', 'what product', 'qué producto', 'cuál producto'
        ]
        if any(s in q for s in product_signals):
            return Intent.PRODUCT_INFO
        return Intent.PROFIT_ANALYSIS

    def _is_specific_customer_segment_query(self, q: str) -> bool:
        """Check for specific customer segment questions."""
        return any(w in q for w in [
            CUSTOMER_SEGMENT_ES, CUSTOMER_SEGMENT_EN, CUSTOMER_SEGMENT_SEEMS_EN,
            SEGMENT_SEEMS_ES, COUNTRY_SEGMENT_ES, COUNTRY_SEGMENT_EN,
            COUNTRY_SEGMENT_BUYS_ES, COUNTRY_SEGMENT_BUYS_EN
        ])

    def _is_high_sales_low_profit_query(self, q: str) -> bool:
        """Check for high sales low profit questions."""
        return any(w in q for w in [
            'vendimos mucho', 'sales were high', 'high sales', 'ventas altas',
            'algún mes donde', 'any month where', 'mes donde'
        ])

    def _route_by_signal_type(self, q: str, intent: Intent) -> Intent:
        """Route by signal type (product, customer, sales)."""
        product_signals = [
            'product', 'products', 'producto', 'productos', 'item', 'items',
            'most sold', 'best selling', 'bestseller', 'top selling',
            'más vendido', 'más vendidos', 'más popular', 'más populares',
            'selling', 'vendido', 'vendidos', 'sku', 'catalog', 'catálogo',
            'categoría', 'categoria', 'category', 'categories',
            'which product', 'what product', 'qué producto', 'cuál producto'
        ]
        
        customer_signals = [
            'customer', 'customers', 'client', 'clients', 'cliente', 'clientes',
            'buyer', 'buyers', 'compradores', 'who buys', 'quién compra',
            'best customer', 'top customer', 'mejor cliente', 'principal cliente',
            'who is our', 'quién es nuestro', 'who are our', 'quiénes son',
            'biggest customer', 'largest customer', 'mayor cliente',
            'segmento', 'segment', 'enterprise', 'startup', 'smb',
            'from usa', 'from canada', 'from germany', 'from india',
            'de usa', 'de canada', 'de alemania', 'de india',
            MOST_VALUABLE_ES, 'seems most valuable', 'parece más valioso',
            MOST_FREQUENT_ES, 'buys most often', 'compra más seguido',
            'país o segmento', 'country or segment'
        ]
        
        sales_signals = [
            'sales', 'revenue', 'ventas', 'ingresos', 'income', 'sold',
            'how much', 'cuánto', 'total sales', 'total ventas', 'profit',
            'ganancia', 'rentable', 'rentabilidad', 'margin', 'margen',
            'transactions', 'transacciones', WORST_MONTH_EN, 'best month',
            WORST_MONTH_ES, 'mejor mes', LAST_YEAR_ES, LAST_YEAR_EN, 'annual',
            'anual', 'trimestre', 'quarter', 'q1', 'q2', 'q3', 'q4',
            '1q', '2q', '3q', '4q'
        ]

        if any(s in q for s in product_signals):
            return Intent.PRODUCT_INFO
        if any(s in q for s in customer_signals):
            return Intent.CUSTOMER_INFO
        
        # Comparison must be checked before generic sales
        if any(w in q for w in ['compare', 'comparar', 'vs', 'versus', 'between',
                                'entre', 'difference', 'diferencia']):
            return Intent.COMPARISON_ANALYSIS
        
        if intent == Intent.UNKNOWN and any(s in q for s in sales_signals):
            return Intent.SALES_METRICS
        
        # Also catch worst/best month when misrouted to forecast
        if intent == Intent.FORECAST_PREDICTION:
            if any(w in q for w in ['worst', 'best', 'peor', 'mejor', 'rentable',
                                    'month', 'mes', 'performing']):
                return Intent.SALES_METRICS
        
        return intent

    # ── Sales / Revenue / Profit handlers ───────────────────────────────────

    async def _handle_sales_metrics(self, question: str, language: Language) -> Tuple[str, List[str]]:
        try:
            q = question.lower()

            # Route to specific handlers
            if self._is_highest_transaction_query(q):
                return await self._handle_highest_transaction(language)
            
            if self._is_sales_by_day_query(q):
                return await self._handle_sales_by_day(language)
            
            if self._is_small_transactions_query(q):
                return await self._handle_small_transactions(language)
            
            if self._is_monthly_sales_count_query(q):
                return await self._handle_monthly_sales_count(language)
            
            if self._is_current_month_billing_query(q):
                return await self._handle_current_month_billing(language)

            if self._is_best_worst_month_query(q):
                return await self._handle_best_worst_month_query(q, language)

            if self._is_quarter_query(question):
                quarter_data = self._extract_quarter(question)
                if quarter_data:
                    year, months = quarter_data
                    return await self._handle_quarter(year, months, language)

            if self._is_year_only_query(question):
                year_only = self._extract_year_only(question)
                if year_only:
                    return await self._handle_year_total(year_only, language)

            if self._is_specific_month_query(question):
                return await self._handle_specific_month_query(question, language)

            if self._is_average_margin_query(q):
                return await self._handle_avg_margin(language)

            if self._is_transaction_count_query(q):
                return await self._handle_transaction_count(question, language)

            if self._is_trend_query(q):
                metrics = self.db.get_sales_metrics()
                return await self._analyze_sales_trends(metrics, language)

            # Default: recent month
            return await self._handle_recent_month_metrics(language)
            
        except Exception as e:
            logger.error("Error in sales handler: %s", e, exc_info=True)
            return self._err(language), []

    def _is_highest_transaction_query(self, q: str) -> bool:
        """Check for highest transaction queries."""
        return any(w in q for w in ['factura más alta', 'venta más alta', 'highest transaction', 'highest sale'])

    def _is_sales_by_day_query(self, q: str) -> bool:
        """Check for sales by day queries."""
        return any(w in q for w in ['día tuvimos más ventas', 'day with most sales', 'highest sales day', 'best day'])

    def _is_small_transactions_query(self, q: str) -> bool:
        """Check for small transactions queries."""
        return any(w in q for w in ['ventas muy pequeñas', 'small transactions', 'low value sales', 'tiny sales'])

    def _is_monthly_sales_count_query(self, q: str) -> bool:
        """Check for monthly sales count queries."""
        return any(w in q for w in ['cuántas ventas hicimos', 'how many sales', 'sales per month', 'ventas por mes'])

    def _is_current_month_billing_query(self, q: str) -> bool:
        """Check for current month billing queries."""
        return any(w in q for w in ['cuánto se facturó', 'how much was invoiced', 'se facturó este mes', 'facturado este mes'])

    def _is_best_worst_month_query(self, q: str) -> bool:
        """Check for best/worst month queries."""
        is_best = any(w in q for w in ['best', 'mejor', 'highest', 'más alto', 'top', 'peak', 'rentable', 'profitable'])
        is_worst = any(w in q for w in ['worst', 'peor', 'lowest', 'más bajo', 'bottom', 'least'])
        return is_best or is_worst

    def _is_quarter_query(self, question: str) -> bool:
        """Check for quarter queries."""
        return self._extract_quarter(question) is not None

    def _is_year_only_query(self, question: str) -> bool:
        """Check for year-only queries."""
        return self._extract_year_only(question) is not None

    def _is_specific_month_query(self, question: str) -> bool:
        """Check for specific month queries."""
        return self._extract_date_from_question(question) is not None

    def _is_average_margin_query(self, q: str) -> bool:
        """Check for average margin queries."""
        return any(w in q for w in ['average', 'promedio', 'avg', 'mean', 'margin', 'margen', 'average profit', 'margen promedio'])

    def _is_transaction_count_query(self, q: str) -> bool:
        """Check for transaction count queries."""
        return any(w in q for w in ['transaction', 'transaccion', 'transacciones', 'how many', 'cuántas', 'count', 'número de'])

    def _is_trend_query(self, q: str) -> bool:
        """Check for trend queries."""
        return any(w in q for w in ['trend', 'tendencia', 'growth', 'crecimiento', 'change', 'cambio', 
                                    'compare', 'comparar', 'últimos', 'last', 'recent', 'reciente'])

    async def _handle_current_month_billing(self, language: Language) -> Tuple[str, List[str]]:
        """Handle current month billing queries."""
        metrics = self.db.get_sales_metrics()
        if metrics:
            r = metrics[0]
            mn = MONTH_NAMES_EN[r['month']]
            mn_es = MONTH_NAMES_ES[r['month']]
            # Convert Decimal to float
            total_sales = float(r['total_sales'])
            total_costs = float(r['total_costs'])
            profit = float(r['profit'])
            total_expenses = float(r.get('total_expenses', 0))
            margin = (profit / total_sales * 100) if total_sales else 0
            if language == Language.SPANISH:
                return (
                    f"📊 **Facturación de {mn_es} {r['year']}:**\n\n"
                    f"💰 Ventas Totales: ${total_sales:,.2f}\n"
                    f"📦 Costos Totales: ${total_costs:,.2f}\n"
                    f"💵 Gastos: ${total_expenses:,.2f}\n"
                    f"📈 Ganancia: ${profit:,.2f}\n"
                    f"📊 Margen: {margin:.1f}%",
                    [DB_BUSINESS_METRICS]
                )
            return (
                f"📊 **Billing for {mn} {r['year']}:**\n\n"
                f"💰 Total Sales: ${total_sales:,.2f}\n"
                f"📦 Total Costs: ${total_costs:,.2f}\n"
                f"💵 Expenses: ${total_expenses:,.2f}\n"
                f"📈 Profit: ${profit:,.2f}\n"
                f"📊 Margin: {margin:.1f}%",
                [DB_BUSINESS_METRICS]
            )
        return self._no_data("sales", language), []

    async def _handle_best_worst_month_query(self, q: str, language: Language) -> Tuple[str, List[str]]:
        """Handle best/worst month queries."""
        is_best = any(w in q for w in ['best', 'mejor', 'highest', 'más alto', 'top', 'peak', 'rentable', 'profitable'])
        bw = self.db.get_best_worst_months()
        key = 'best_month' if is_best else 'worst_month'
        rec = bw.get(key)
        if rec:
            label_en = 'best' if is_best else 'worst'
            label_es = 'mejor' if is_best else 'peor'
            mn = MONTH_NAMES_EN[rec['month']]
            mn_es = MONTH_NAMES_ES[rec['month']]
            profit = float(rec['profit'])
            if language == Language.SPANISH:
                return (
                    f"📊 El {label_es} mes fue **{mn_es} {rec['year']}**\n"
                    f"• Ganancia: ${profit:,.2f}\n\n"
                    f"💡 Esto se basa en el historial completo de métricas de negocio.",
                    [DB_BUSINESS_METRICS]
                )
            return (
                f"📊 The {label_en} performing month was **{mn} {rec['year']}**\n"
                f"• Profit: ${profit:,.2f}\n\n"
                f"💡 Based on the full history of business metrics.",
                [DB_BUSINESS_METRICS]
            )
        return self._no_data("sales", language), []

    async def _handle_specific_month_query(self, question: str, language: Language) -> Tuple[str, List[str]]:
        """Handle specific month queries."""
        date_info = self._extract_date_from_question(question)
        if date_info:
            year, month = date_info
            rec = self.db.get_sales_for_period(year, month)
            if rec:
                mn = MONTH_NAMES_EN[month]
                mn_es = MONTH_NAMES_ES[month]
                total_sales = float(rec['total_sales'])
                total_costs = float(rec['total_costs'])
                profit = float(rec['profit'])
                margin = (profit / total_sales * 100) if total_sales else 0
                if language == Language.SPANISH:
                    return (
                        f"📅 Ventas de {mn_es} {year}:\n"
                        f"• Ventas Totales: ${total_sales:,.2f}\n"
                        f"• Costos Totales: ${total_costs:,.2f}\n"
                        f"• Ganancia: ${profit:,.2f}\n"
                        f"• Margen: {margin:.1f}%",
                        [DB_BUSINESS_METRICS]
                    )
                return (
                    f"📅 Sales for {mn} {year}:\n"
                    f"• Total Sales: ${total_sales:,.2f}\n"
                    f"• Total Costs: ${total_costs:,.2f}\n"
                    f"• Profit: ${profit:,.2f}\n"
                    f"• Margin: {margin:.1f}%",
                    [DB_BUSINESS_METRICS]
                )
            mn = MONTH_NAMES_EN[month]
            mn_es = MONTH_NAMES_ES[month]
            if language == Language.SPANISH:
                return f"No hay datos para {mn_es} {year}.", []
            return f"No data found for {mn} {year}.", []
        return self._no_data("sales", language), []

    async def _handle_recent_month_metrics(self, language: Language) -> Tuple[str, List[str]]:
        """Handle default recent month metrics."""
        metrics = self.db.get_sales_metrics()
        if not metrics:
            return self._no_data("sales", language), []
        r = metrics[0]
        total_sales = float(r['total_sales'])
        total_costs = float(r['total_costs'])
        profit = float(r['profit'])
        margin = (profit / total_sales * 100) if total_sales else 0
        mn = MONTH_NAMES_EN[r['month']]
        mn_es = MONTH_NAMES_ES[r['month']]
        if language == Language.SPANISH:
            return (
                f"📊 Métricas más recientes — {mn_es} {r['year']}:\n"
                f"• Ventas Totales: ${total_sales:,.2f}\n"
                f"• Costos Totales: ${total_costs:,.2f}\n"
                f"• Ganancia: ${profit:,.2f}\n"
                f"• Margen: {margin:.1f}%",
                [DB_BUSINESS_METRICS]
            )
        return (
            f"📊 Most recent metrics — {mn} {r['year']}:\n"
            f"• Total Sales: ${total_sales:,.2f}\n"
            f"• Total Costs: ${total_costs:,.2f}\n"
            f"• Profit: ${profit:,.2f}\n"
            f"• Margin: {margin:.1f}%",
            [DB_BUSINESS_METRICS]
        )

        # ── Quarter query (Q1/Q2/Q3/Q4 YYYY) ──
        quarter_data = self._extract_quarter(question)
        if quarter_data:
            year, months = quarter_data
            return await self._handle_quarter(year, months, language)

        # ── Year-only query (e.g. "total 2024") ──
        year_only = self._extract_year_only(question)
        if year_only:
            return await self._handle_year_total(year_only, language)

        # ── Specific month query ──
        try:
            date_info = self._extract_date_from_question(question)
            if date_info:
                year, month = date_info
                rec = self.db.get_sales_for_period(year, month)
                if rec:
                    mn = MONTH_NAMES_EN[month]
                    mn_es = MONTH_NAMES_ES[month]
                    total_sales = float(rec['total_sales'])
                    total_costs = float(rec['total_costs'])
                    profit = float(rec['profit'])
                    margin = (profit / total_sales * 100) if total_sales else 0
                    if language == Language.SPANISH:
                        return (
                            f"📅 Ventas de {mn_es} {year}:\n"
                            f"• Ventas Totales: ${total_sales:,.2f}\n"
                            f"• Costos Totales: ${total_costs:,.2f}\n"
                            f"• Ganancia: ${profit:,.2f}\n"
                            f"• Margen: {margin:.1f}%",
                            [DB_BUSINESS_METRICS]
                        )
                    return (
                        f"📅 Sales for {mn} {year}:\n"
                        f"• Total Sales: ${total_sales:,.2f}\n"
                        f"• Total Costs: ${total_costs:,.2f}\n"
                        f"• Profit: ${profit:,.2f}\n"
                        f"• Margin: {margin:.1f}%",
                        [DB_BUSINESS_METRICS]
                    )
                mn = MONTH_NAMES_EN[month]
                mn_es = MONTH_NAMES_ES[month]
                if language == Language.SPANISH:
                    return f"No hay datos para {mn_es} {year}.", []
                return f"No data found for {mn} {year}.", []

            # ── Average margin query ──
            if any(w in q for w in ['average', 'promedio', 'avg', 'mean', 'margin',
                                    'margen', 'average profit', 'margen promedio']):
                return await self._handle_avg_margin(language)

            # ── Transaction count query ──
            if any(w in q for w in ['transaction', 'transaccion', 'transacciones',
                                    'how many', 'cuántas', 'count', 'número de']):
                return await self._handle_transaction_count(question, language)

            # ── Trend query ──
            if any(w in q for w in ['trend', 'tendencia', 'growth', 'crecimiento',
                                    'change', 'cambio', 'compare', 'comparar',
                                    'últimos', 'last', 'recent', 'reciente']):
                metrics = self.db.get_sales_metrics()
                return await self._analyze_sales_trends(metrics, language)

            # ── Default: recent month ──
            metrics = self.db.get_sales_metrics()
            if not metrics:
                return self._no_data("sales", language), []
            r = metrics[0]
            total_sales = float(r['total_sales'])
            total_costs = float(r['total_costs'])
            profit = float(r['profit'])
            margin = (profit / total_sales * 100) if total_sales else 0
            mn = MONTH_NAMES_EN[r['month']]
            mn_es = MONTH_NAMES_ES[r['month']]
            if language == Language.SPANISH:
                return (
                    f"📊 Métricas más recientes — {mn_es} {r['year']}:\n"
                    f"• Ventas Totales: ${total_sales:,.2f}\n"
                    f"• Costos Totales: ${total_costs:,.2f}\n"
                    f"• Ganancia: ${profit:,.2f}\n"
                    f"• Margen: {margin:.1f}%",
                    [DB_BUSINESS_METRICS]
                )
            return (
                f"📊 Most recent metrics — {mn} {r['year']}:\n"
                f"• Total Sales: ${total_sales:,.2f}\n"
                f"• Total Costs: ${total_costs:,.2f}\n"
                f"• Profit: ${profit:,.2f}\n"
                f"• Margin: {margin:.1f}%",
                [DB_BUSINESS_METRICS]
            )
        except Exception as e:
            logger.error("Error in sales handler: %s", e, exc_info=True)
            return self._err(language), []

    async def _handle_profit_analysis(self, question: str, language: Language) -> Tuple[str, List[str]]:
        """Enhanced profit analysis with break-even calculations."""
        try:
            q = question.lower()
            
            # Route to specific analysis handlers
            if self._is_worst_month_analysis_query(q):
                return await self._handle_worst_month_analysis(language)
            
            if self._is_closest_to_loss_query(q):
                return await self._handle_closest_to_loss(language)
            
            if self._is_accounting_analysis_detailed_query(q):
                return await self._handle_accounting_analysis(question, language)
            
            if self._is_high_sales_low_profit_detailed_query(q):
                return await self._handle_high_sales_low_profit(language)
            
            if self._is_surprising_performance_query(q):
                return await self._handle_surprising_performance(language)
            
            if self._is_suspicious_months_query(q):
                return await self._handle_suspicious_months(language)
            
            if self._is_business_failure_query(q):
                return await self._handle_failure_scenarios(language)
            
            if self._is_near_failure_query(q):
                return await self._handle_near_failure_month(language)
            
            if self._is_breakeven_point_query(q):
                return await self._handle_breakeven_point(language)
            
            if self._is_breakeven_closest_query(q):
                return await self._handle_breakeven_closest(language)
            
            if self._is_first_profitable_query(q):
                return await self._handle_first_profitable_month(language)
            
            if self._is_loss_months_query(q):
                return await self._handle_loss_months(language)
            
            if self._is_risk_analysis_query(q):
                return await self._handle_risk_analysis(language)
            
            if self._is_cost_increase_scenario_query(q):
                return await self._handle_cost_increase_scenario(question, language)
            
            # Default: delegate to sales metrics
            return await self._handle_sales_metrics(question, language)
            
        except Exception as e:
            logger.error(f"Error in profit analysis: {e}", exc_info=True)
            return self._err(language), []

    def _is_worst_month_analysis_query(self, q: str) -> bool:
        """Check for worst month analysis queries."""
        return any(w in q for w in [WORST_MONTH_EN, WORST_MONTH_ES, WORST_PERFORMING_EN, 'peor rendimiento',
                                    'mes con peor', 'peor utilidad', 'worst profit'])

    def _is_closest_to_loss_query(self, q: str) -> bool:
        """Check for closest to losing money queries."""
        return any(w in q for w in ['closest to losing', 'más cerca de perder', 'losing money', 
                                    'perder dinero', 'closest to loss', 'near bankruptcy', 'estuvimos cerca',
                                    'cerca de pérdida', 'más cerca de pérdida'])

    def _is_accounting_analysis_detailed_query(self, q: str) -> bool:
        """Check for detailed accounting analysis queries."""
        return any(w in q for w in ['gastamos más', COST_COVERAGE_ES, ACTUAL_PROFIT_ES,
                                    NEGATIVE_PROFIT_ES, RISING_COSTS_ES, MOST_PROFITABLE_YEAR_ES,
                                    REDUCE_EXPENSES_ES, MONEY_DRAIN_ES, PROFIT_VS_SALES_ES])

    def _is_high_sales_low_profit_detailed_query(self, q: str) -> bool:
        """Check for high sales low profit queries."""
        return any(w in q for w in ['high sales low profit', 'ventas altas ganancia baja', 
                                    'vendimos mucho ganamos poco', 'vendimos mucho pero ganamos poco',
                                    'sales were high but profit was low', 'high but profit was low',
                                    'where sales were high', 'donde vendimos mucho', 'mes donde vendimos mucho',
                                    'any month where', 'algún mes donde'])

    def _is_surprising_performance_query(self, q: str) -> bool:
        """Check for surprising performance queries."""
        return any(w in q for w in ['surprisingly well', 'sorprendentemente bien', 'performed well',
                                    'surprisingly good', 'unexpectedly well', 'nos fue bien'])

    def _is_suspicious_months_query(self, q: str) -> bool:
        """Check for suspicious months queries."""
        return any(w in q for w in ['suspicious', 'sospechoso', 'too high', 'muy altas', 'muy alta',
                                    'too low', 'muy bajas', 'muy baja', 'looks suspicious', 'parece sospechoso'])

    def _is_business_failure_query(self, q: str) -> bool:
        """Check for business failure scenario queries."""
        return any(w in q for w in ['stop being profitable', 'deje de ser rentable', 'dejar de ser rentable',
                                    'business to fail', 'negocio fracasar', 'what would need to happen'])

    def _is_near_failure_query(self, q: str) -> bool:
        """Check for near failure queries."""
        return any(w in q for w in ['almost broke', 'casi se rompe', 'nearly failed', 'casi fracasa',
                                    'where almost', 'donde casi', 'casi se rompe el negocio'])

    def _is_breakeven_point_query(self, q: str) -> bool:
        """Check for break-even point calculation queries."""
        return (any(w in q for w in ['break-even point', BREAKEVEN_POINT_ES,
                                     'cover costs', 'cubrir costos', 'cover expenses',
                                     'cubrir gastos', 'how much revenue', 'cuánto vender',
                                     'cuánto tendríamos que vender']) and 
                not any(w in q for w in ['closest', 'cerca']))

    def _is_breakeven_closest_query(self, q: str) -> bool:
        """Check for closest to break-even queries."""
        return (any(w in q for w in ['closest to zero', 'cerca de cero', 'más cerca de cero',
                                     'closest to break-even', 'break-even', 'break even',
                                     'breakeven']) and 
                any(w in q for w in ['closest', 'cerca', 'month', 'mes']))

    def _is_first_profitable_query(self, q: str) -> bool:
        """Check for first profitable month queries."""
        return any(w in q for w in ['first month', 'primer mes', 'loss to profit',
                                    'pérdida a ganancia', 'perdida a ganancia',
                                    'first profitable', 'primer mes rentable',
                                    'moved from loss', 'pasó de pérdida'])

    def _is_loss_months_query(self, q: str) -> bool:
        """Check for loss months queries."""
        return any(w in q for w in ['sales lower than', 'ventas menores que',
                                    'sales less than', 'ventas menor que',
                                    'costs plus expenses', 'costos y gastos',
                                    'suma de costos', 'total costs'])

    def _is_risk_analysis_query(self, q: str) -> bool:
        """Check for risk analysis queries."""
        return any(w in q for w in ['risk of operating', 'riesgo de operar',
                                    'operating below', 'operar por debajo',
                                    'highest risk', 'mayor riesgo', 'most risk'])

    def _is_cost_increase_scenario_query(self, q: str) -> bool:
        """Check for cost increase scenario queries."""
        return any(w in q for w in ['costs increase', 'costos suben', 'costos aumentan',
                                    'costs go up', 'increase by', 'suben un',
                                    'maintain profit', 'mantener utilidad',
                                    'mantener ganancia', 'keep profit positive'])

    def _is_breakeven_closest_query(self, q: str) -> bool:
        """Check for closest to break-even queries."""
        return (any(w in q for w in ['closest to zero', 'cerca de cero', 'más cerca de cero',
                                     'closest to break-even', 'break-even', 'break even',
                                     'breakeven']) and 
                any(w in q for w in ['closest', 'cerca', 'month', 'mes']))

    def _is_first_profitable_query(self, q: str) -> bool:
        """Check for first profitable month queries."""
        return any(w in q for w in ['first month', 'primer mes', 'loss to profit',
                                    'pérdida a ganancia', 'perdida a ganancia',
                                    'first profitable', 'primer mes rentable',
                                    'moved from loss', 'pasó de pérdida'])

    def _is_loss_months_query(self, q: str) -> bool:
        """Check for loss months queries."""
        return any(w in q for w in ['sales lower than', 'ventas menores que',
                                    'sales less than', 'ventas menor que',
                                    'costs plus expenses', 'costos y gastos',
                                    'suma de costos', 'total costs'])

    def _is_risk_analysis_query(self, q: str) -> bool:
        """Check for risk analysis queries."""
        return any(w in q for w in ['risk of operating', 'riesgo de operar',
                                    'operating below', 'operar por debajo',
                                    'highest risk', 'mayor riesgo', 'most risk'])

    def _is_cost_increase_scenario_query(self, q: str) -> bool:
        """Check for cost increase scenario queries."""
        return any(w in q for w in ['costs increase', 'costos suben', 'costos aumentan',
                                    'costs go up', 'increase by', 'suben un',
                                    'maintain profit', 'mantener utilidad',
                                    'mantener ganancia', 'keep profit positive']):
                return await self._handle_cost_increase_scenario(question, language)
            
            # ── Default: delegate to sales metrics ──
            return await self._handle_sales_metrics(question, language)
            
        except Exception as e:
            logger.error(f"Error in profit analysis: {e}", exc_info=True)
            return self._err(language), []

    async def _handle_avg_margin(self, language: Language) -> Tuple[str, List[str]]:
        """Calculate average profit margin across all months."""
        try:
            all_metrics = self.db.get_all_sales_metrics()
            if not all_metrics:
                return self._no_data("sales", language), []
            margins = [
                (r['profit'] / r['total_sales'] * 100)
                for r in all_metrics if r.get('total_sales', 0) > 0
            ]
            avg = sum(margins) / len(margins) if margins else 0
            best = max(margins) if margins else 0
            worst = min(margins) if margins else 0
            if language == Language.SPANISH:
                return (
                    f"📈 Margen de ganancia promedio: **{avg:.1f}%**\n"
                    f"• Mejor mes: {best:.1f}%\n"
                    f"• Peor mes: {worst:.1f}%\n"
                    f"• Basado en {len(margins)} meses de datos",
                    [DB_BUSINESS_METRICS]
                )
            return (
                f"📈 Average profit margin: **{avg:.1f}%**\n"
                f"• Best month: {best:.1f}%\n"
                f"• Worst month: {worst:.1f}%\n"
                f"• Based on {len(margins)} months of data",
                [DB_BUSINESS_METRICS]
            )
        except Exception as e:
            logger.error("Error in avg margin: %s", e)
            return self._err(language), []

    async def _handle_quarter(self, year: int, months: List[int],
                               language: Language) -> Tuple[str, List[str]]:
        """Aggregate sales for a quarter."""
        try:
            total_sales = total_costs = total_profit = 0.0
            found = []
            for m in months:
                rec = self.db.get_sales_for_period(year, m)
                if rec:
                    total_sales += float(rec['total_sales'])
                    total_costs += float(rec['total_costs'])
                    total_profit += float(rec['profit'])
                    found.append(m)
            q_num = {(1, 2, 3): 'Q1', (4, 5, 6): 'Q2',
                     (7, 8, 9): 'Q3', (10, 11, 12): 'Q4'}.get(tuple(months), 'Q?')
            if not found:
                if language == Language.SPANISH:
                    return f"No hay datos para {q_num} {year}.", []
                return f"No data found for {q_num} {year}.", []
            margin = (total_profit / total_sales * 100) if total_sales else 0
            if language == Language.SPANISH:
                return (
                    f"📊 Resumen {q_num} {year} ({len(found)} meses):\n"
                    f"• Ventas Totales: ${total_sales:,.2f}\n"
                    f"• Costos Totales: ${total_costs:,.2f}\n"
                    f"• Ganancia: ${total_profit:,.2f}\n"
                    f"• Margen: {margin:.1f}%",
                    [DB_BUSINESS_METRICS]
                )
            return (
                f"📊 {q_num} {year} Summary ({len(found)} months):\n"
                f"• Total Sales: ${total_sales:,.2f}\n"
                f"• Total Costs: ${total_costs:,.2f}\n"
                f"• Profit: ${total_profit:,.2f}\n"
                f"• Margin: {margin:.1f}%",
                [DB_BUSINESS_METRICS]
            )
        except Exception as e:
            logger.error("Error in quarter handler: %s", e)
            return self._err(language), []

    async def _handle_year_total(self, year: int, language: Language) -> Tuple[str, List[str]]:
        """Aggregate full-year sales."""
        try:
            total_sales = total_costs = total_profit = 0.0
            months_found = []
            for m in range(1, 13):
                rec = self.db.get_sales_for_period(year, m)
                if rec:
                    total_sales += float(rec['total_sales'])
                    total_costs += float(rec['total_costs'])
                    total_profit += float(rec['profit'])
                    months_found.append(m)
            if not months_found:
                if language == Language.SPANISH:
                    return f"No hay datos para el año {year}.", []
                return f"No data found for year {year}.", []
            margin = (total_profit / total_sales * 100) if total_sales else 0
            if language == Language.SPANISH:
                return (
                    f"📊 Resumen anual {year} ({len(months_found)} meses):\n"
                    f"• Ventas Totales: ${total_sales:,.2f}\n"
                    f"• Costos Totales: ${total_costs:,.2f}\n"
                    f"• Ganancia: ${total_profit:,.2f}\n"
                    f"• Margen promedio: {margin:.1f}%",
                    [DB_BUSINESS_METRICS]
                )
            return (
                f"📊 Annual Summary {year} ({len(months_found)} months):\n"
                f"• Total Sales: ${total_sales:,.2f}\n"
                f"• Total Costs: ${total_costs:,.2f}\n"
                f"• Profit: ${total_profit:,.2f}\n"
                f"• Average Margin: {margin:.1f}%",
                [DB_BUSINESS_METRICS]
            )
        except Exception as e:
            logger.error("Error in year total: %s", e)
            return self._err(language), []

    async def _handle_transaction_count(self, question: str,
                                         language: Language) -> Tuple[str, List[str]]:
        """Return transaction count, optionally for a period."""
        try:
            date_info = self._extract_date_from_question(question)
            count = self.db.get_transaction_count(
                year=date_info[0] if date_info else None,
                month=date_info[1] if date_info else None
            )
            if date_info:
                mn = MONTH_NAMES_EN[date_info[1]]
                mn_es = MONTH_NAMES_ES[date_info[1]]
                if language == Language.SPANISH:
                    return (
                        f"🔢 Transacciones en {mn_es} {date_info[0]}: **{count}**",
                        [DB_SALES_TRANSACTIONS]
                    )
                return (
                    f"🔢 Transactions in {mn} {date_info[0]}: **{count}**",
                    [DB_SALES_TRANSACTIONS]
                )
            if language == Language.SPANISH:
                return (
                    f"🔢 Total de transacciones registradas: **{count}**",
                    [DB_SALES_TRANSACTIONS]
                )
            return (
                f"🔢 Total transactions on record: **{count}**",
                [DB_SALES_TRANSACTIONS]
            )
        except Exception as e:
            logger.error("Error in transaction count: %s", e)
            return self._err(language), []

    # ── Product handler ──────────────────────────────────────────────────────

    async def _handle_product_info(self, question: str, language: Language) -> Tuple[str, List[str]]:
        try:
            q = question.lower()

            # Route to specific handlers
            if self._is_top_product_revenue_query(q):
                return await self._handle_top_product_by_revenue(language)

            if self._is_underpriced_products_query(q):
                return await self._handle_underpriced_products(language)

            if self._is_high_volume_low_margin_query(q):
                return await self._handle_high_volume_low_margin_products(language)

            if self._is_product_margin_query(q):
                return await self._handle_product_margins(language)

            if self._is_product_breakeven_query(q):
                return await self._handle_product_breakeven_contribution(language)

            if self._is_category_revenue_query(q):
                return await self._handle_category_revenue(language)

            if self._is_top_products_query(q):
                return await self._handle_top_products_list(language)

            # Try specific product search
            product_result = await self._handle_product_search(question, language)
            if product_result[0]:
                return product_result

            # Default: catalog overview
            return await self._handle_product_catalog_overview(language)
            
        except Exception as e:
            logger.error("Error in product handler: %s", e)
            return self._err(language), []

    def _is_top_product_revenue_query(self, q: str) -> bool:
        """Check for top product by revenue queries."""
        return any(w in q for w in ['se facturó más', 'producto se facturó', 'product was invoiced', 'top product by revenue'])

    def _is_underpriced_products_query(self, q: str) -> bool:
        """Check for underpriced products queries."""
        return any(w in q for w in ['underpriced', 'muy barato', 'too cheap', 'demasiado barato',
                                    'should review', 'deberíamos revisar', 'review because',
                                    'revisar porque', 'may be underpriced', 'tal vez está barato'])

    def _is_high_volume_low_margin_query(self, q: str) -> bool:
        """Check for high volume low margin queries."""
        return any(w in q for w in ['sells well', 'vende bien', 'high volume', 'alto volumen',
                                    'low profit', 'poca ganancia', 'low margin', 'poco margen',
                                    'sells well but', 'vende bien pero', 'does not generate much profit',
                                    'no genera mucha ganancia'])

    def _is_product_margin_query(self, q: str) -> bool:
        """Check for product margin queries."""
        return any(w in q for w in ['margin', 'margen', 'highest margin', 'mejor margen',
                                    'margin between price', 'margen entre precio',
                                    'price and cost', 'precio y costo'])

    def _is_product_breakeven_query(self, q: str) -> bool:
        """Check for product break-even contribution queries."""
        return any(w in q for w in ['contributes most', 'contribuye más', 'break-even',
                                    BREAKEVEN_POINT_ES, 'reaching break-even',
                                    'superar el punto de equilibrio'])

    def _is_category_revenue_query(self, q: str) -> bool:
        """Check for category revenue queries."""
        return any(w in q for w in ['category', 'categoría', 'categoria', 'categories',
                                    'categorías', 'which category', 'qué categoría',
                                    'highest margin', 'most revenue', 'más ingresos'])

    def _is_top_products_query(self, q: str) -> bool:
        """Check for top products queries."""
        return any(w in q for w in ['top', 'best', 'most sold', 'bestseller',
                                    'mejor', 'más vendido', 'principal',
                                    'which', 'cuál', 'what', 'qué', 'show',
                                    'list', 'lista', 'ranking'])

    async def _handle_top_products_list(self, language: Language) -> Tuple[str, List[str]]:
        """Handle top products list queries."""
        top = self.db.get_top_products(limit=5)
        if top:
            if language == Language.SPANISH:
                ans = "🏆 Top 5 productos por ingresos:\n\n"
                for i, p in enumerate(top, 1):
                    revenue = float(p['total_revenue'])
                    ans += (f"{i}. {p['name']}\n"
                            f"   • Categoría: {p['category']}\n"
                            f"   • Ingresos: ${revenue:,.2f}\n\n")
                ans += f"✨ Producto líder: **{top[0]['name']}**"
            else:
                ans = "🏆 Top 5 products by revenue:\n\n"
                for i, p in enumerate(top, 1):
                    revenue = float(p['total_revenue'])
                    ans += (f"{i}. {p['name']}\n"
                            f"   • Category: {p['category']}\n"
                            f"   • Revenue: ${revenue:,.2f}\n\n")
                ans += f"✨ Top product: **{top[0]['name']}**"
            return ans, [DB_PRODUCTS, DB_SALES_TRANSACTIONS]
        return self._no_data("products", language), []

    async def _handle_product_search(self, question: str, language: Language) -> Tuple[str, List[str]]:
        """Handle specific product search."""
        keywords = self._extract_product_keywords(question)
        for kw in keywords:
            matches = self.db.get_product_by_name(kw)
            if matches:
                if len(matches) == 1:
                    p = matches[0]
                    price = float(p['price'])
                    if language == Language.SPANISH:
                        ans = (f"📦 {p['name']}\n"
                               f"• Categoría: {p['category']}\n"
                               f"• Precio: ${price:,.2f}")
                    else:
                        ans = (f"📦 {p['name']}\n"
                               f"• Category: {p['category']}\n"
                               f"• Price: ${price:,.2f}")
                else:
                    names = ', '.join(p['name'] for p in matches[:5])
                    ans = f"Productos encontrados: {names}" if language == Language.SPANISH \
                          else f"Products found: {names}"
                return ans, [DB_PRODUCTS]
        return "", []

    async def _handle_product_catalog_overview(self, language: Language) -> Tuple[str, List[str]]:
        """Handle product catalog overview."""
        products = self.db.get_products(limit=100)
        if not products:
            return self._no_data("products", language), []
        cats: Dict[str, int] = {}
        for p in products:
            cats[p.get('category', 'Unknown')] = cats.get(p.get('category', 'Unknown'), 0) + 1
        cat_str = ', '.join(f"{v} {k}" for k, v in sorted(cats.items(), key=lambda x: -x[1]))
        if language == Language.SPANISH:
            return (
                f"📦 Catálogo: {len(products)} productos\n"
                f"Categorías: {cat_str}\n\n"
                f"💡 Pregunta por el top de productos o una categoría específica.",
                    [DB_PRODUCTS]
                )
            return (
                f"📦 Catalog: {len(products)} products\n"
                f"Categories: {cat_str}\n\n"
                f"💡 Ask for top products or a specific category.",
                [DB_PRODUCTS]
            )
        except Exception as e:
            logger.error("Error in product handler: %s", e)
            return self._err(language), []

    async def _handle_category_revenue(self, language: Language) -> Tuple[str, List[str]]:
        """Revenue breakdown by product category."""
        try:
            data = self.db.get_revenue_by_category()
            if not data:
                return self._no_data("products", language), []
            if language == Language.SPANISH:
                ans = "📊 Ingresos por categoría de producto:\n\n"
                for i, row in enumerate(data, 1):
                    ans += (f"{i}. {row['category']}\n"
                            f"   • Ingresos: ${row['total_revenue']:,.2f}\n"
                            f"   • Transacciones: {row['transaction_count']}\n\n")
                ans += f"🏆 Categoría líder: **{data[0]['category']}**"
            else:
                ans = "📊 Revenue by product category:\n\n"
                for i, row in enumerate(data, 1):
                    ans += (f"{i}. {row['category']}\n"
                            f"   • Revenue: ${row['total_revenue']:,.2f}\n"
                            f"   • Transactions: {row['transaction_count']}\n\n")
                ans += f"🏆 Top category: **{data[0]['category']}**"
            return ans, [DB_PRODUCTS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error("Error in category revenue: %s", e)
            return self._err(language), []

    # ── Customer handler ─────────────────────────────────────────────────────

    async def _handle_customer_info(self, question: str, language: Language) -> Tuple[str, List[str]]:
        try:
            q = question.lower()

            # Route to specific handlers
            if self._is_marketing_analysis_detailed_query(q):
                return await self._handle_marketing_analysis(question, language)

            if self._is_customer_frequency_query(q):
                return await self._handle_customer_frequency_analysis(language)

            if self._is_most_valuable_segment_query(q):
                return await self._handle_most_valuable_segment(language)

            if self._is_customer_profitability_query(q):
                return await self._handle_customer_profitability(language)

            # Filter by country
            country = self._extract_country(q)
            if country:
                return await self._handle_customers_by_country(country, language)

            # Filter by segment
            segment = self._extract_segment(q)
            if segment:
                return await self._handle_customers_by_segment(segment, language)

            if self._is_customer_orders_query(q):
                return await self._handle_top_customers_by_orders(language)

            if self._is_top_customers_query(q):
                return await self._handle_top_customers_list(language)

            if self._is_customer_count_query(q):
                return await self._handle_customer_count(language)

            # Default overview
            return await self._handle_customer_overview(language)
            
        except Exception as e:
            logger.error("Error in customer handler: %s", e)
            return self._err(language), []

    def _is_marketing_analysis_detailed_query(self, q: str) -> bool:
        """Check for detailed marketing analysis queries."""
        return any(w in q for w in [CUSTOMER_TYPE_ES, SEGMENT_BOUGHT_ES, COUNTRY_BETTER_ES, PROMOTION_TARGET_ES,
                                    CAMPAIGN_INTEREST_ES, BUYING_LESS_ES, BEST_LAUNCH_MONTH_ES,
                                    BEST_ACCEPTANCE_ES, EXPENSIVE_PRODUCTS_ES, MOST_PROFITABLE_CLIENT_ES,
                                    SALES_BEHAVIOR_ES, LAUNCH_PROMOTIONS_ES])

    def _is_customer_frequency_query(self, q: str) -> bool:
        """Check for customer frequency queries."""
        return any(w in q for w in [MOST_OFTEN_EN, MOST_FREQUENT_ES, 'most frequently', 'más frecuente',
                                    'buys frequently', 'compra frecuentemente', 'frequency',
                                    'frecuencia', 'how often', 'qué tan seguido', 'buys the most often',
                                    'compra más seguido', 'country or segment buys', 'país o segmento compra'])

    def _is_most_valuable_segment_query(self, q: str) -> bool:
        """Check for most valuable segment queries."""
        return any(w in q for w in [MOST_VALUABLE_EN, MOST_VALUABLE_ES, 'valuable', 'valioso',
                                    'seems most valuable', 'parece más valioso', 'customer segment seems',
                                    SEGMENT_SEEMS_ES, CUSTOMER_SEGMENT_EN, CUSTOMER_SEGMENT_ES,
                                    'which segment seems', 'qué segmento parece'])

    def _is_customer_profitability_query(self, q: str) -> bool:
        """Check for customer profitability queries."""
        return any(w in q for w in ['profitability', 'rentabilidad', 'profitable',
                                    'rentable', 'generates', 'genera', 'highest profitability',
                                    'mayor rentabilidad', 'most profitable', 'más rentable'])

    def _is_customer_orders_query(self, q: str) -> bool:
        """Check for customer orders queries."""
        return any(w in q for w in ['orders', 'pedidos', 'transactions', 'transacciones',
                                    'most orders', 'más pedidos', 'most frequent',
                                    'más frecuente'])

    def _is_top_customers_query(self, q: str) -> bool:
        """Check for top customers queries."""
        return any(w in q for w in ['best', 'top', 'biggest', 'major', 'mejor',
                                    'principal', 'mayor', 'who', 'quién',
                                    'which', 'cuál', 'show', 'list', 'lista'])

    def _is_customer_count_query(self, q: str) -> bool:
        """Check for customer count queries."""
        return any(w in q for w in ['how many', 'cuántos', 'count', 'total',
                                    'number', 'número', 'cantidad'])

    async def _handle_top_customers_list(self, language: Language) -> Tuple[str, List[str]]:
        """Handle top customers list queries."""
        top = self.db.get_top_customers(limit=5)
        if top:
            if language == Language.SPANISH:
                ans = "👥 Top 5 clientes por compras totales:\n\n"
                for i, c in enumerate(top, 1):
                    ans += (f"{i}. {c['name']}\n"
                            f"   • Segmento: {c['segment']}\n"
                            f"   • País: {c['country']}\n"
                            f"   • Compras: ${c['total_purchases']:,.2f}\n"
                            f"   • Transacciones: {c['transaction_count']}\n\n")
                ans += f"✨ Mejor cliente: **{top[0]['name']}** — ${top[0]['total_purchases']:,.2f}"
            else:
                ans = "👥 Top 5 customers by total spend:\n\n"
                for i, c in enumerate(top, 1):
                    ans += (f"{i}. {c['name']}\n"
                            f"   • Segment: {c['segment']}\n"
                            f"   • Country: {c['country']}\n"
                            f"   • Purchases: ${c['total_purchases']:,.2f}\n"
                            f"   • Transactions: {c['transaction_count']}\n\n")
                ans += f"✨ Best customer: **{top[0]['name']}** — ${top[0]['total_purchases']:,.2f}"
            return ans, [DB_CUSTOMERS, DB_SALES_TRANSACTIONS]
        return self._no_data("customers", language), []

    async def _handle_customer_count(self, language: Language) -> Tuple[str, List[str]]:
        """Handle customer count queries."""
        customers = self.db.get_customers(limit=2000)
        segs: Dict[str, int] = {}
        countries: Dict[str, int] = {}
        for c in customers:
            segs[c.get('segment', 'Unknown')] = segs.get(c.get('segment', 'Unknown'), 0) + 1
            countries[c.get('country', 'Unknown')] = countries.get(c.get('country', 'Unknown'), 0) + 1
        if language == Language.SPANISH:
            ans = f"📊 Total de clientes: **{len(customers)}**\n\nPor segmento:\n"
            for s, n in sorted(segs.items(), key=lambda x: -x[1]):
                ans += f"• {s}: {n}\n"
            ans += "\nPrincipales países:\n"
            for co, n in sorted(countries.items(), key=lambda x: -x[1])[:5]:
                ans += f"• {co}: {n}\n"
        else:
            ans = f"📊 Total customers: **{len(customers)}**\n\nBy segment:\n"
            for s, n in sorted(segs.items(), key=lambda x: -x[1]):
                ans += f"• {s}: {n}\n"
            ans += "\nTop countries:\n"
            for co, n in sorted(countries.items(), key=lambda x: -x[1])[:5]:
                ans += f"• {co}: {n}\n"
        return ans, [DB_CUSTOMERS]

    async def _handle_customer_overview(self, language: Language) -> Tuple[str, List[str]]:
        """Handle customer overview queries."""
        customers = self.db.get_customers(limit=200)
        if not customers:
            return self._no_data("customers", language), []
        segs: Dict[str, int] = {}
        for c in customers:
            segs[c.get('segment', 'Unknown')] = segs.get(c.get('segment', 'Unknown'), 0) + 1
        seg_str = ', '.join(f"{v} {k}" for k, v in sorted(segs.items(), key=lambda x: -x[1]))
        if language == Language.SPANISH:
            return (
                f"👥 Base de clientes: {len(customers)} clientes\n"
                f"Segmentos: {seg_str}\n\n"
                f"💡 Puedes preguntar por el mejor cliente, clientes por país o segmento.",
                [DB_CUSTOMERS]
            )
        return (
            f"👥 Customer base: {len(customers)} customers\n"
            f"Segments: {seg_str}\n\n"
            f"💡 You can ask for top customers, customers by country or segment.",
            [DB_CUSTOMERS]
        )
        except Exception as e:
            logger.error("Error in customer handler: %s", e)
            return self._err(language), []

    async def _handle_customers_by_country(self, country: str,
                                            language: Language) -> Tuple[str, List[str]]:
        try:
            customers = self.db.get_customers_by_country(country)
            if not customers:
                if language == Language.SPANISH:
                    return f"No se encontraron clientes de {country}.", []
                return f"No customers found from {country}.", []
            if language == Language.SPANISH:
                ans = f"🌍 Clientes de {country} ({len(customers)}):\n\n"
                for c in customers[:10]:
                    ans += f"• {c['name']} — {c['segment']}\n"
                if len(customers) > 10:
                    ans += f"\n...y {len(customers) - 10} más."
            else:
                ans = f"🌍 Customers from {country} ({len(customers)}):\n\n"
                for c in customers[:10]:
                    ans += f"• {c['name']} — {c['segment']}\n"
                if len(customers) > 10:
                    ans += f"\n...and {len(customers) - 10} more."
            return ans, [DB_CUSTOMERS]
        except Exception as e:
            logger.error("Error in customers by country: %s", e)
            return self._err(language), []

    async def _handle_customers_by_segment(self, segment: str,
                                            language: Language) -> Tuple[str, List[str]]:
        try:
            customers = self.db.get_customers_by_segment(segment)
            if not customers:
                if language == Language.SPANISH:
                    return f"No se encontraron clientes en el segmento {segment}.", []
                return f"No customers found in segment {segment}.", []
            if language == Language.SPANISH:
                ans = f"🏢 Clientes del segmento {segment} ({len(customers)}):\n\n"
                for c in customers[:10]:
                    ans += f"• {c['name']} — {c['country']}\n"
                if len(customers) > 10:
                    ans += f"\n...y {len(customers) - 10} más."
            else:
                ans = f"🏢 {segment} segment customers ({len(customers)}):\n\n"
                for c in customers[:10]:
                    ans += f"• {c['name']} — {c['country']}\n"
                if len(customers) > 10:
                    ans += f"\n...and {len(customers) - 10} more."
            return ans, [DB_CUSTOMERS]
        except Exception as e:
            logger.error("Error in customers by segment: %s", e)
            return self._err(language), []

    async def _handle_top_customers_by_orders(self,
                                               language: Language) -> Tuple[str, List[str]]:
        try:
            top = self.db.get_top_customers_by_orders(limit=5)
            if not top:
                return self._no_data("customers", language), []
            if language == Language.SPANISH:
                ans = "🔢 Top 5 clientes por número de pedidos:\n\n"
                for i, c in enumerate(top, 1):
                    ans += (f"{i}. {c['name']}\n"
                            f"   • Pedidos: {c['transaction_count']}\n"
                            f"   • Total comprado: ${c['total_purchases']:,.2f}\n\n")
            else:
                ans = "🔢 Top 5 customers by number of orders:\n\n"
                for i, c in enumerate(top, 1):
                    ans += (f"{i}. {c['name']}\n"
                            f"   • Orders: {c['transaction_count']}\n"
                            f"   • Total spent: ${c['total_purchases']:,.2f}\n\n")
            return ans, [DB_CUSTOMERS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error("Error in top customers by orders: %s", e)
            return self._err(language), []

    # ── Document search ──────────────────────────────────────────────────────

    async def _handle_document_search(self, question: str, language: Language) -> Tuple[str, List[str]]:
        try:
            # Clean keywords: remove stop words, question words, and multi-word
            # phrases that contain stop words
            raw = self.classifier.extract_keywords(question, language)
            keywords = []
            for k in raw:
                kl = k.lower()
                # Skip if any word in the phrase is a stop word
                words_in_k = kl.split()
                if any(w in _DOC_STOP_WORDS for w in words_in_k):
                    continue
                if kl in _DOC_STOP_WORDS:
                    continue
                if len(k) > 2:
                    keywords.append(k)

            if not keywords:
                if language == Language.SPANISH:
                    return "Por favor indica qué tema quieres buscar en los documentos.", []
                return "Please specify what topic you want to search in the documents.", []

            results = self.db.search_documents(keywords, limit=3)

            if not results:
                if language == Language.SPANISH:
                    return (
                        f"📂 No se encontraron documentos sobre: **{', '.join(keywords)}**.\n"
                        f"Intenta con términos más específicos.",
                        []
                    )
                return (
                    f"📂 No documents found about: **{', '.join(keywords)}**.\n"
                    f"Try more specific terms.",
                    []
                )

            sources = []
            if language == Language.SPANISH:
                parts = [f"📂 {len(results)} documento(s) encontrado(s) para «{', '.join(keywords)}»:"]
            else:
                parts = [f"📂 {len(results)} document(s) found for «{', '.join(keywords)}»:"]

            for r in results:
                fname = r.get('filename', 'Unknown')
                text = r.get('extracted_text', '')
                sources.append(f"document:{fname}")
                excerpt = self._extract_excerpt(text, keywords, max_length=250)
                parts.append(f"\n📄 **{fname}**\n{excerpt}")

            return "\n".join(parts), sources
        except Exception as e:
            logger.error("Error in document search: %s", e)
            return self._err(language), []

    # ── Comparison handler ───────────────────────────────────────────────────

    async def _handle_comparison(self, question: str, language: Language) -> Tuple[str, List[str]]:
        """Compare two specific months or periods."""
        try:
            dates = self._extract_multiple_dates(question)
            if len(dates) >= 2:
                (y1, m1), (y2, m2) = dates[0], dates[1]
                r1 = self.db.get_sales_for_period(y1, m1)
                r2 = self.db.get_sales_for_period(y2, m2)
                if r1 and r2:
                    diff_sales = r2['total_sales'] - r1['total_sales']
                    diff_pct = (diff_sales / r1['total_sales'] * 100) if r1['total_sales'] else 0
                    mn1_en = MONTH_NAMES_EN[m1]
                    mn2_en = MONTH_NAMES_EN[m2]
                    mn1_es = MONTH_NAMES_ES[m1]
                    mn2_es = MONTH_NAMES_ES[m2]
                    arrow = "📈" if diff_sales >= 0 else "📉"
                    if language == Language.SPANISH:
                        return (
                            f"📊 Comparación: {mn1_es} {y1} vs {mn2_es} {y2}\n\n"
                            f"{'Período':15} {'Ventas':>12} {'Ganancia':>12}\n"
                            f"{mn1_es+' '+str(y1):15} ${r1['total_sales']:>10,.0f} ${r1['profit']:>10,.0f}\n"
                            f"{mn2_es+' '+str(y2):15} ${r2['total_sales']:>10,.0f} ${r2['profit']:>10,.0f}\n\n"
                            f"{arrow} Variación ventas: {diff_pct:+.1f}% (${diff_sales:+,.0f})",
                            [DB_BUSINESS_METRICS]
                        )
                    return (
                        f"📊 Comparison: {mn1_en} {y1} vs {mn2_en} {y2}\n\n"
                        f"{'Period':15} {'Sales':>12} {'Profit':>12}\n"
                        f"{mn1_en+' '+str(y1):15} ${r1['total_sales']:>10,.0f} ${r1['profit']:>10,.0f}\n"
                        f"{mn2_en+' '+str(y2):15} ${r2['total_sales']:>10,.0f} ${r2['profit']:>10,.0f}\n\n"
                        f"{arrow} Sales change: {diff_pct:+.1f}% (${diff_sales:+,.0f})",
                        [DB_BUSINESS_METRICS]
                    )
            # Fallback to trend
            return await self._handle_sales_metrics(question, language)
        except Exception as e:
            logger.error("Error in comparison: %s", e)
            return self._err(language), []

    # ── Trend analysis ───────────────────────────────────────────────────────

    async def _handle_trend_analysis(self, question: str, language: Language) -> Tuple[str, List[str]]:
        metrics = self.db.get_sales_metrics()
        return await self._analyze_sales_trends(metrics, language)

    async def _analyze_sales_trends(self, metrics: List[Dict],
                                     language: Language) -> Tuple[str, List[str]]:
        if len(metrics) < 2:
            if language == Language.SPANISH:
                return "No hay suficientes datos para analizar tendencias.", [DB_BUSINESS_METRICS]
            return "Not enough data to analyze trends.", [DB_BUSINESS_METRICS]

        recent = metrics[:6]  # last 6 months
        first = recent[-1]
        last = recent[0]
        sales_change = last['total_sales'] - first['total_sales']
        profit_change = last['profit'] - first['profit']
        sales_pct = (sales_change / first['total_sales'] * 100) if first['total_sales'] else 0
        profit_pct = (profit_change / first['profit'] * 100) if first['profit'] else 0
        arrow_s = "📈" if sales_change >= 0 else "📉"
        arrow_p = "📈" if profit_change >= 0 else "📉"

        if language == Language.SPANISH:
            return (
                f"📊 Tendencia — últimos {len(recent)} meses:\n"
                f"{arrow_s} Ventas: {sales_pct:+.1f}% vs hace {len(recent)} meses\n"
                f"{arrow_p} Ganancia: {profit_pct:+.1f}% vs hace {len(recent)} meses\n\n"
                f"Mes más reciente ({MONTH_NAMES_ES[last['month']]} {last['year']}): "
                f"${last['total_sales']:,.0f} ventas, ${last['profit']:,.0f} ganancia",
                [DB_BUSINESS_METRICS]
            )
        return (
            f"📊 Trend — last {len(recent)} months:\n"
            f"{arrow_s} Sales: {sales_pct:+.1f}% vs {len(recent)} months ago\n"
            f"{arrow_p} Profit: {profit_pct:+.1f}% vs {len(recent)} months ago\n\n"
            f"Most recent ({MONTH_NAMES_EN[last['month']]} {last['year']}): "
            f"${last['total_sales']:,.0f} sales, ${last['profit']:,.0f} profit",
            [DB_BUSINESS_METRICS]
        )

    # ── Other handlers ───────────────────────────────────────────────────────

    async def _handle_forecast(self, question: str, language: Language) -> Tuple[str, List[str]]:
        if language == Language.SPANISH:
            return ("Los pronósticos están disponibles en la sección de Pronósticos. "
                    "Puedes generar proyecciones de ventas, costos y ganancias.", ["forecasts"])
        return ("Forecasts are available in the Forecasts section. "
                "You can generate sales, cost, and profit projections.", ["forecasts"])

    async def _handle_market_analysis(self, question: str, language: Language) -> Tuple[str, List[str]]:
        if language == Language.SPANISH:
            return ("El análisis de mercado externo no está disponible. "
                    "Puedo mostrarte datos internos de ventas y clientes.", [DB_BUSINESS_METRICS])
        return ("External market analysis is not available. "
                "I can show you internal sales and customer data.", [DB_BUSINESS_METRICS])

    async def _handle_competitive_intelligence(self, question: str, language: Language) -> Tuple[str, List[str]]:
        if language == Language.SPANISH:
            return ("No tengo datos de competidores. "
                    "Puedo mostrarte nuestro rendimiento interno.", [DB_BUSINESS_METRICS])
        return ("No competitor data available. "
                "I can show you our internal performance.", [DB_BUSINESS_METRICS])

    async def _handle_mixed_query(self, question: str, language: Language) -> Tuple[str, List[str]]:
        return await self._handle_sales_metrics(question, language)

    async def _handle_unknown(self, question: str, language: Language) -> Tuple[str, List[str]]:
        if language == Language.SPANISH:
            return (
                "No entendí tu pregunta. Puedo ayudarte con:\n"
                "• 📊 Ventas y ganancias (por mes, trimestre o año)\n"
                "• 🏆 Productos más vendidos o por categoría\n"
                "• 👥 Clientes, segmentos o países\n"
                "• 📂 Búsqueda en documentos\n"
                "• 📈 Tendencias y comparaciones",
                []
            )
        return (
            "I didn't understand your question. I can help with:\n"
            "• 📊 Sales & profit (by month, quarter, or year)\n"
            "• 🏆 Top products or by category\n"
            "• 👥 Customers, segments, or countries\n"
            "• 📂 Document search\n"
            "• 📈 Trends and comparisons",
            []
        )

    # ── Utility / parsing helpers ────────────────────────────────────────────

    def _extract_date_from_question(self, question: str) -> Optional[Tuple[int, int]]:
        """Return (year, month) or None."""
        q = question.lower()
        # Month name + year
        for name, num in {**MONTHS_EN, **MONTHS_ES}.items():
            m = re.search(rf'\b{name}\b.*?(\d{{4}})', q)
            if not m:
                m = re.search(rf'(\d{{4}}).*?\b{name}\b', q)
            if m:
                return int(m.group(1)), num
        # Numeric patterns
        for pat in [r'(\d{1,2})[/\-](\d{4})', r'(\d{4})[/\-](\d{1,2})']:
            m = re.search(pat, q)
            if m:
                a, b = int(m.group(1)), int(m.group(2))
                if a > 1900:
                    return a, b
                if b > 1900:
                    return b, a
        return None

    def _extract_multiple_dates(self, question: str) -> List[Tuple[int, int]]:
        """Extract all (year, month) pairs from a question.
        Handles cases like 'January and June 2024' where year appears once.
        """
        q = question.lower()
        results = []
        all_months = {**MONTHS_EN, **MONTHS_ES}

        # Find all years in the question
        years_found = [int(y) for y in re.findall(r'\b(20\d{2})\b', q)]

        # Find all month names with their positions
        month_positions = []
        for name, num in all_months.items():
            for m in re.finditer(rf'\b{re.escape(name)}\b', q):
                month_positions.append((m.start(), num, name))

        month_positions.sort(key=lambda x: x[0])

        if not month_positions:
            return results

        # If only one year, assign it to all months found
        if len(years_found) == 1:
            year = years_found[0]
            for _, num, _ in month_positions:
                pair = (year, num)
                if pair not in results:
                    results.append(pair)
        else:
            # Try to match each month with nearest year
            for pos, num, _ in month_positions:
                # Find closest year after this month name
                best_year = None
                best_dist = float('inf')
                for m in re.finditer(r'\b(20\d{2})\b', q):
                    dist = abs(m.start() - pos)
                    if dist < best_dist:
                        best_dist = dist
                        best_year = int(m.group(1))
                if best_year:
                    pair = (best_year, num)
                    if pair not in results:
                        results.append(pair)

        return results

    def _extract_year_only(self, question: str) -> Optional[int]:
        """Return a standalone year if the question asks about a full year."""
        q = question.lower()
        year_signals = ['year', 'año', 'annual', 'anual', 'total', 'all of',
                        'todo el', 'entire', 'completo', LAST_YEAR_EN, LAST_YEAR_ES,
                        'this year', 'este año']
        if not any(s in q for s in year_signals):
            return None
        m = re.search(YEAR_REGEX, q)
        if m:
            return int(m.group(1))
        # "last year" / "año pasado" → current year - 1
        if LAST_YEAR_EN in q or LAST_YEAR_ES in q:
            return 2025  # relative to current date context
        return None

    def _extract_quarter(self, question: str) -> Optional[Tuple[int, List[int]]]:
        """Return (year, [months]) for quarter queries like 'Q3 2023', '3Q 2023', '2023 Q3'."""
        q = question.lower()
        # Pattern: Q3 2025 or q3 2025
        m = re.search(r'q([1-4])\s*(\d{4})', q)
        if m:
            qnum, year = int(m.group(1)), int(m.group(2))
        else:
            # Pattern: 3Q 2025 or 3q 2025
            m = re.search(r'([1-4])q\s*(\d{4})', q)
            if m:
                qnum, year = int(m.group(1)), int(m.group(2))
            else:
                # Pattern: 2025 Q3 or 2025 q3
                m = re.search(r'(\d{4})\s*q([1-4])', q)
                if m:
                    year, qnum = int(m.group(1)), int(m.group(2))
                else:
                    # Pattern: 2025 3Q
                    m = re.search(r'(\d{4})\s*([1-4])q', q)
                    if m:
                        year, qnum = int(m.group(1)), int(m.group(2))
                    else:
                        return None
        months = QUARTER_MONTHS[f'q{qnum}']
        return year, months

    def _extract_country(self, q: str) -> Optional[str]:
        """Detect country filter in question."""
        known = ['usa', 'united states', 'canada', 'germany', 'india', 'japan',
                 'australia', 'singapore', 'uk', 'united kingdom', 'france',
                 'brazil', 'mexico', 'alemania', 'japón', 'reino unido', 'francia',
                 'brasil', 'méxico']
        for c in known:
            if c in q:
                # Normalize
                mapping = {'usa': 'USA', 'united states': 'USA', 'canada': 'Canada',
                           'germany': 'Germany', 'alemania': 'Germany',
                           'india': 'India', 'japan': 'Japan', 'japón': 'Japan',
                           'australia': 'Australia', 'singapore': 'Singapore',
                           'uk': 'UK', 'united kingdom': 'UK',
                           'france': 'France', 'francia': 'France',
                           'brazil': 'Brazil', 'brasil': 'Brazil',
                           'mexico': 'Mexico', 'méxico': 'Mexico'}
                return mapping.get(c, c.title())
        return None

    def _extract_segment(self, q: str) -> Optional[str]:
        """Detect segment filter in question."""
        for seg in ['enterprise', 'startup', 'smb']:
            if seg in q:
                return seg.upper() if seg == 'smb' else seg.capitalize()
        return None

    def _extract_product_keywords(self, question: str) -> List[str]:
        """Extract potential product name keywords."""
        stop = {'what', 'which', 'is', 'our', 'the', 'a', 'an', 'product',
                'products', 'item', 'items', 'show', 'me', 'find', 'get',
                'qué', 'cuál', 'es', 'nuestro', 'producto', 'productos',
                'muestra', 'busca', 'dame', 'precio', 'price', 'cost', 'costo'}
        words = re.findall(r'\b\w+\b', question.lower())
        return [w for w in words if w not in stop and len(w) > 3]

    def _extract_excerpt(self, text: str, keywords: List[str], max_length: int = 250) -> str:
        if not text:
            return "No content available."
        tl = text.lower()
        pos = len(text)
        for kw in keywords:
            p = tl.find(kw.lower())
            if p != -1 and p < pos:
                pos = p
        if pos == len(text):
            excerpt = text[:max_length]
        else:
            start = max(0, pos - 60)
            end = min(len(text), pos + max_length)
            excerpt = ("..." if start > 0 else "") + text[start:end] + ("..." if end < len(text) else "")
        return excerpt.strip()

    # ── Small helpers ────────────────────────────────────────────────────────

    def _err(self, language: Language) -> str:
        if language == Language.SPANISH:
            return "Ocurrió un error al procesar tu pregunta. Por favor intenta de nuevo."
        return "An error occurred while processing your question. Please try again."

    def _no_data(self, data_type: str, language: Language) -> str:
        labels = {"sales": "ventas", "products": "productos",
                  "customers": "clientes", "documents": "documentos"}
        if language == Language.SPANISH:
            return f"No hay datos de {labels.get(data_type, data_type)} disponibles."
        return f"No {data_type} data available."

    # ── Break-even Analysis Methods ──────────────────────────────────────────

    async def _handle_breakeven_closest(self, language: Language) -> Tuple[str, List[str]]:
        """Find the month with profit closest to zero (break-even)."""
        try:
            all_metrics = self.db.get_all_sales_metrics()
            if not all_metrics:
                return self._no_data("sales", language), []
            
            # Find month with profit closest to zero
            closest_month = min(all_metrics, key=lambda x: abs(x['profit']))
            mn = MONTH_NAMES_EN[closest_month['month']]
            mn_es = MONTH_NAMES_ES[closest_month['month']]
            
            if language == Language.SPANISH:
                return (
                    f"🎯 Mes más cerca del punto de equilibrio: **{mn_es} {closest_month['year']}**\n"
                    f"• Ganancia: ${closest_month['profit']:,.2f}\n"
                    f"• Ventas: ${closest_month['total_sales']:,.2f}\n"
                    f"• Costos: ${closest_month['total_costs']:,.2f}\n\n"
                    f"💡 Este mes tuvo la ganancia más cercana a cero ($0).",
                    [DB_BUSINESS_METRICS]
                )
            return (
                f"🎯 Month closest to break-even: **{mn} {closest_month['year']}**\n"
                f"• Profit: ${closest_month['profit']:,.2f}\n"
                f"• Sales: ${closest_month['total_sales']:,.2f}\n"
                f"• Costs: ${closest_month['total_costs']:,.2f}\n\n"
                f"💡 This month had profit closest to zero ($0).",
                [DB_BUSINESS_METRICS]
            )
        except Exception as e:
            logger.error(f"Error in breakeven closest: {e}")
            return self._err(language), []

    async def _handle_first_profitable_month(self, language: Language) -> Tuple[str, List[str]]:
        """Find the first month when business moved from loss to profit."""
        try:
            all_metrics = self.db.get_all_sales_metrics()
            if not all_metrics:
                return self._no_data("sales", language), []
            
            # Sort by year and month (oldest first)
            sorted_metrics = sorted(all_metrics, key=lambda x: (x['year'], x['month']))
            
            # Find first transition from negative to positive profit
            first_profitable = None
            for i, metric in enumerate(sorted_metrics):
                if metric['profit'] > 0:
                    # Check if previous month was negative
                    if i > 0 and sorted_metrics[i-1]['profit'] <= 0:
                        first_profitable = metric
                        break
                    elif i == 0:  # First month and it's profitable
                        first_profitable = metric
                        break
            
            if not first_profitable:
                if language == Language.SPANISH:
                    return "No se encontró una transición de pérdida a ganancia en los datos.", []
                return "No loss-to-profit transition found in the data.", []
            
            mn = MONTH_NAMES_EN[first_profitable['month']]
            mn_es = MONTH_NAMES_ES[first_profitable['month']]
            
            if language == Language.SPANISH:
                return (
                    f"📈 Primer mes rentable: **{mn_es} {first_profitable['year']}**\n"
                    f"• Ganancia: ${first_profitable['profit']:,.2f}\n"
                    f"• Ventas: ${first_profitable['total_sales']:,.2f}\n"
                    f"• Costos: ${first_profitable['total_costs']:,.2f}\n\n"
                    f"🎉 Este fue el primer mes en que el negocio pasó de pérdida a ganancia.",
                    [DB_BUSINESS_METRICS]
                )
            return (
                f"📈 First profitable month: **{mn} {first_profitable['year']}**\n"
                f"• Profit: ${first_profitable['profit']:,.2f}\n"
                f"• Sales: ${first_profitable['total_sales']:,.2f}\n"
                f"• Costs: ${first_profitable['total_costs']:,.2f}\n\n"
                f"🎉 This was the first month the business moved from loss to profit.",
                [DB_BUSINESS_METRICS]
            )
        except Exception as e:
            logger.error(f"Error in first profitable month: {e}")
            return self._err(language), []

    async def _handle_breakeven_point(self, language: Language) -> Tuple[str, List[str]]:
        """Calculate monthly break-even point based on average costs."""
        try:
            all_metrics = self.db.get_all_sales_metrics()
            if not all_metrics:
                return self._no_data("sales", language), []
            
            # Calculate average monthly costs
            avg_costs = sum(m['total_costs'] for m in all_metrics) / len(all_metrics)
            
            # Get recent month for context
            recent = all_metrics[0]
            current_margin = (recent['profit'] / recent['total_sales']) if recent['total_sales'] > 0 else 0
            
            if language == Language.SPANISH:
                return (
                    f"⚖️ Punto de equilibrio mensual estimado: **${avg_costs:,.2f}**\n\n"
                    f"📊 Análisis basado en costos promedio:\n"
                    f"• Costos promedio mensuales: ${avg_costs:,.2f}\n"
                    f"• Ventas necesarias para equilibrio: ${avg_costs:,.2f}\n"
                    f"• Mes más reciente ({MONTH_NAMES_ES[recent['month']]} {recent['year']}):\n"
                    f"  - Ventas: ${recent['total_sales']:,.2f}\n"
                    f"  - Costos: ${recent['total_costs']:,.2f}\n"
                    f"  - Margen actual: {current_margin:.1%}\n\n"
                    f"💡 Para cubrir todos los costos, necesitamos al menos ${avg_costs:,.2f} en ventas mensuales.",
                    [DB_BUSINESS_METRICS]
                )
            return (
                f"⚖️ Estimated monthly break-even point: **${avg_costs:,.2f}**\n\n"
                f"📊 Analysis based on average costs:\n"
                f"• Average monthly costs: ${avg_costs:,.2f}\n"
                f"• Sales needed for break-even: ${avg_costs:,.2f}\n"
                f"• Most recent month ({MONTH_NAMES_EN[recent['month']]} {recent['year']}):\n"
                f"  - Sales: ${recent['total_sales']:,.2f}\n"
                f"  - Costs: ${recent['total_costs']:,.2f}\n"
                f"  - Current margin: {current_margin:.1%}\n\n"
                f"💡 To cover all costs, we need at least ${avg_costs:,.2f} in monthly sales.",
                [DB_BUSINESS_METRICS]
            )
        except Exception as e:
            logger.error(f"Error in breakeven point: {e}")
            return self._err(language), []

    async def _handle_loss_months(self, language: Language) -> Tuple[str, List[str]]:
        """Find months where sales were lower than total costs."""
        try:
            all_metrics = self.db.get_all_sales_metrics()
            if not all_metrics:
                return self._no_data("sales", language), []
            
            # Find months with losses (profit <= 0)
            loss_months = [m for m in all_metrics if m['profit'] <= 0]
            
            if not loss_months:
                if language == Language.SPANISH:
                    return (
                        "🎉 ¡Excelente! No hay meses con pérdidas en nuestros registros.\n"
                        "Todos los meses han sido rentables.",
                        [DB_BUSINESS_METRICS]
                    )
                return (
                    "🎉 Great news! No months with losses in our records.\n"
                    "All months have been profitable.",
                    [DB_BUSINESS_METRICS]
                )
            
            # Sort by loss amount (worst first)
            loss_months.sort(key=lambda x: x['profit'])
            
            if language == Language.SPANISH:
                answer = f"📉 Meses con pérdidas ({len(loss_months)} total):\n\n"
                for i, month in enumerate(loss_months[:10], 1):  # Show top 10
                    mn = MONTH_NAMES_ES[month['month']]
                    answer += (f"{i}. {mn} {month['year']}\n"
                              f"   • Pérdida: ${abs(month['profit']):,.2f}\n"
                              f"   • Ventas: ${month['total_sales']:,.2f}\n"
                              f"   • Costos: ${month['total_costs']:,.2f}\n\n")
                
                if len(loss_months) > 10:
                    answer += f"...y {len(loss_months) - 10} meses más con pérdidas."
                
                total_losses = sum(abs(m['profit']) for m in loss_months)
                answer += f"\n💰 Pérdidas totales acumuladas: ${total_losses:,.2f}"
            else:
                answer = f"📉 Months with losses ({len(loss_months)} total):\n\n"
                for i, month in enumerate(loss_months[:10], 1):  # Show top 10
                    mn = MONTH_NAMES_EN[month['month']]
                    answer += (f"{i}. {mn} {month['year']}\n"
                              f"   • Loss: ${abs(month['profit']):,.2f}\n"
                              f"   • Sales: ${month['total_sales']:,.2f}\n"
                              f"   • Costs: ${month['total_costs']:,.2f}\n\n")
                
                if len(loss_months) > 10:
                    answer += f"...and {len(loss_months) - 10} more months with losses."
                
                total_losses = sum(abs(m['profit']) for m in loss_months)
                answer += f"\n💰 Total accumulated losses: ${total_losses:,.2f}"
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in loss months: {e}")
            return self._err(language), []

    async def _handle_risk_analysis(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze which year had the highest risk of operating below break-even."""
        try:
            all_metrics = self.db.get_all_sales_metrics()
            if not all_metrics:
                return self._no_data("sales", language), []
            
            # Group by year and calculate risk metrics
            year_stats = {}
            for metric in all_metrics:
                year = metric['year']
                if year not in year_stats:
                    year_stats[year] = {
                        'months': [],
                        'loss_months': 0,
                        'total_losses': 0,
                        'avg_margin': 0,
                        'min_profit': float('inf'),
                        'months_count': 0
                    }
                
                year_stats[year]['months'].append(metric)
                year_stats[year]['months_count'] += 1
                
                profit = float(metric['profit'])  # Convert Decimal to float
                if profit <= 0:
                    year_stats[year]['loss_months'] += 1
                    year_stats[year]['total_losses'] += abs(profit)
                
                if profit < year_stats[year]['min_profit']:
                    year_stats[year]['min_profit'] = profit
            
            # Calculate risk score for each year
            for year, stats in year_stats.items():
                total_sales = sum(float(m['total_sales']) for m in stats['months'])
                total_profit = sum(float(m['profit']) for m in stats['months'])
                stats['avg_margin'] = (total_profit / total_sales) if total_sales > 0 else 0
                
                # Risk score: combination of loss months, total losses, and low margins
                loss_ratio = stats['loss_months'] / stats['months_count']
                stats['risk_score'] = (loss_ratio * 0.4 + 
                                     (stats['total_losses'] / 10000) * 0.3 + 
                                     (1 - max(0, stats['avg_margin'])) * 0.3)
            
            # Find year with highest risk
            riskiest_year = max(year_stats.keys(), key=lambda y: year_stats[y]['risk_score'])
            risk_data = year_stats[riskiest_year]
            
            if language == Language.SPANISH:
                return (
                    f"⚠️ Año con mayor riesgo: **{riskiest_year}**\n\n"
                    f"📊 Análisis de riesgo:\n"
                    f"• Meses con pérdidas: {risk_data['loss_months']}/{risk_data['months_count']}\n"
                    f"• Pérdidas totales: ${risk_data['total_losses']:,.2f}\n"
                    f"• Margen promedio: {risk_data['avg_margin']:.1%}\n"
                    f"• Ganancia mínima: ${risk_data['min_profit']:,.2f}\n"
                    f"• Puntuación de riesgo: {risk_data['risk_score']:.2f}\n\n"
                    f"💡 Este año tuvo la mayor probabilidad de operar por debajo del punto de equilibrio.",
                    [DB_BUSINESS_METRICS]
                )
            return (
                f"⚠️ Year with highest risk: **{riskiest_year}**\n\n"
                f"📊 Risk analysis:\n"
                f"• Loss months: {risk_data['loss_months']}/{risk_data['months_count']}\n"
                f"• Total losses: ${risk_data['total_losses']:,.2f}\n"
                f"• Average margin: {risk_data['avg_margin']:.1%}\n"
                f"• Minimum profit: ${risk_data['min_profit']:,.2f}\n"
                f"• Risk score: {risk_data['risk_score']:.2f}\n\n"
                f"💡 This year had the highest probability of operating below break-even.",
                [DB_BUSINESS_METRICS]
            )
        except Exception as e:
            logger.error(f"Error in risk analysis: {e}")
            return self._err(language), []

    async def _handle_cost_increase_scenario(self, question: str, language: Language) -> Tuple[str, List[str]]:
        """Analyze scenario where costs increase by X% and calculate required sales increase."""
        try:
            # Extract percentage from question
            import re
            percentage_match = re.search(r'(\d+)%', question)
            if not percentage_match:
                percentage_match = re.search(r'(\d+)', question)
            
            cost_increase_pct = float(percentage_match.group(1)) if percentage_match else 10.0
            
            # Get recent metrics for calculation
            recent_metrics = self.db.get_sales_metrics()
            if not recent_metrics:
                return self._no_data("sales", language), []
            
            recent = recent_metrics[0]
            current_sales = float(recent['total_sales'])  # Convert Decimal to float
            current_costs = float(recent['total_costs'])  # Convert Decimal to float
            current_profit = float(recent['profit'])      # Convert Decimal to float
            
            # Calculate new costs after increase
            new_costs = current_costs * (1 + cost_increase_pct / 100)
            cost_increase = new_costs - current_costs
            
            mn = MONTH_NAMES_EN[recent['month']]
            mn_es = MONTH_NAMES_ES[recent['month']]
            
            # Calculate required sales to maintain current profit
            required_sales = new_costs + current_profit
            
            # If current sales already exceed required sales, show the buffer
            if current_sales >= required_sales:
                sales_buffer = current_sales - required_sales
                buffer_pct = (sales_buffer / required_sales * 100) if required_sales > 0 else 0
                
                if language == Language.SPANISH:
                    return (
                        f"📈 Análisis de escenario: Costos suben {cost_increase_pct}%\n\n"
                        f"📊 Situación actual ({mn_es} {recent['year']}):\n"
                        f"• Ventas actuales: ${current_sales:,.2f}\n"
                        f"• Costos actuales: ${current_costs:,.2f}\n"
                        f"• Ganancia actual: ${current_profit:,.2f}\n\n"
                        f"📈 Después del aumento de costos:\n"
                        f"• Nuevos costos: ${new_costs:,.2f} (+${cost_increase:,.2f})\n"
                        f"• Ventas mínimas necesarias: ${required_sales:,.2f}\n"
                        f"• Margen de seguridad actual: ${sales_buffer:,.2f} ({buffer_pct:.1f}%)\n\n"
                        f"✅ ¡Buenas noticias! Las ventas actuales ya son suficientes para mantener "
                        f"la ganancia incluso con el aumento de costos del {cost_increase_pct}%.",
                        [DB_BUSINESS_METRICS]
                    )
                return (
                    f"📈 Scenario Analysis: Costs increase {cost_increase_pct}%\n\n"
                    f"📊 Current situation ({mn} {recent['year']}):\n"
                    f"• Current sales: ${current_sales:,.2f}\n"
                    f"• Current costs: ${current_costs:,.2f}\n"
                    f"• Current profit: ${current_profit:,.2f}\n\n"
                    f"📈 After cost increase:\n"
                    f"• New costs: ${new_costs:,.2f} (+${cost_increase:,.2f})\n"
                    f"• Minimum sales needed: ${required_sales:,.2f}\n"
                    f"• Current safety buffer: ${sales_buffer:,.2f} ({buffer_pct:.1f}%)\n\n"
                    f"✅ Good news! Current sales are already sufficient to maintain "
                    f"profit even with the {cost_increase_pct}% cost increase.",
                    [DB_BUSINESS_METRICS]
                )
            else:
                sales_increase = required_sales - current_sales
                sales_increase_pct = (sales_increase / current_sales * 100) if current_sales > 0 else 0
                
                if language == Language.SPANISH:
                    return (
                        f"📈 Análisis de escenario: Costos suben {cost_increase_pct}%\n\n"
                        f"📊 Situación actual ({mn_es} {recent['year']}):\n"
                        f"• Ventas actuales: ${current_sales:,.2f}\n"
                        f"• Costos actuales: ${current_costs:,.2f}\n"
                        f"• Ganancia actual: ${current_profit:,.2f}\n\n"
                        f"📈 Después del aumento de costos:\n"
                        f"• Nuevos costos: ${new_costs:,.2f} (+${cost_increase:,.2f})\n"
                        f"• Ventas necesarias: ${required_sales:,.2f}\n"
                        f"• Aumento de ventas requerido: ${sales_increase:,.2f}\n"
                        f"• Porcentaje de aumento: {sales_increase_pct:+.1f}%\n\n"
                        f"💡 Para mantener la ganancia actual de ${current_profit:,.2f}, "
                        f"las ventas deben aumentar {sales_increase_pct:.1f}%.",
                        [DB_BUSINESS_METRICS]
                    )
                return (
                    f"📈 Scenario Analysis: Costs increase {cost_increase_pct}%\n\n"
                    f"📊 Current situation ({mn} {recent['year']}):\n"
                    f"• Current sales: ${current_sales:,.2f}\n"
                    f"• Current costs: ${current_costs:,.2f}\n"
                    f"• Current profit: ${current_profit:,.2f}\n\n"
                    f"📈 After cost increase:\n"
                    f"• New costs: ${new_costs:,.2f} (+${cost_increase:,.2f})\n"
                    f"• Required sales: ${required_sales:,.2f}\n"
                    f"• Sales increase needed: ${sales_increase:,.2f}\n"
                    f"• Percentage increase: {sales_increase_pct:+.1f}%\n\n"
                    f"💡 To maintain current profit of ${current_profit:,.2f}, "
                    f"sales must increase by {sales_increase_pct:.1f}%.",
                    [DB_BUSINESS_METRICS]
                )
        except Exception as e:
            logger.error(f"Error in cost increase scenario: {e}")
            return self._err(language), []

    async def _handle_product_margins(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze product margins (price vs cost)."""
        try:
            # Get products with cost information
            products = self.db.get_products(limit=100)
            if not products:
                return self._no_data("products", language), []
            
            # Calculate margins for products that have cost data
            product_margins = []
            for product in products:
                price = float(product.get('price', 0))  # Convert Decimal to float
                # For this demo, estimate cost as 60-70% of price (since we don't have actual cost data)
                estimated_cost = price * 0.65  # Assume 35% margin on average
                margin = price - estimated_cost
                margin_pct = (margin / price * 100) if price > 0 else 0
                
                product_margins.append({
                    'name': product['name'],
                    'category': product['category'],
                    'price': price,
                    'estimated_cost': estimated_cost,
                    'margin': margin,
                    'margin_pct': margin_pct
                })
            
            # Sort by margin percentage (highest first)
            product_margins.sort(key=lambda x: x['margin_pct'], reverse=True)
            
            if language == Language.SPANISH:
                answer = "💰 Análisis de márgenes de productos (Top 10):\n\n"
                for i, p in enumerate(product_margins[:10], 1):
                    answer += (f"{i}. {p['name']}\n"
                              f"   • Precio: ${p['price']:,.2f}\n"
                              f"   • Costo estimado: ${p['estimated_cost']:,.2f}\n"
                              f"   • Margen: ${p['margin']:,.2f} ({p['margin_pct']:.1f}%)\n"
                              f"   • Categoría: {p['category']}\n\n")
                
                best = product_margins[0]
                answer += f"🏆 Mejor margen: **{best['name']}** con {best['margin_pct']:.1f}% de margen"
            else:
                answer = "💰 Product Margin Analysis (Top 10):\n\n"
                for i, p in enumerate(product_margins[:10], 1):
                    answer += (f"{i}. {p['name']}\n"
                              f"   • Price: ${p['price']:,.2f}\n"
                              f"   • Estimated cost: ${p['estimated_cost']:,.2f}\n"
                              f"   • Margin: ${p['margin']:,.2f} ({p['margin_pct']:.1f}%)\n"
                              f"   • Category: {p['category']}\n\n")
                
                best = product_margins[0]
                answer += f"🏆 Highest margin: **{best['name']}** with {best['margin_pct']:.1f}% margin"
            
            return answer, [DB_PRODUCTS]
        except Exception as e:
            logger.error(f"Error in product margins: {e}")
            return self._err(language), []

    async def _handle_product_breakeven_contribution(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze which products contribute most to reaching break-even."""
        try:
            # Get top products by revenue (these contribute most to covering costs)
            top_products = self.db.get_top_products(limit=10)
            if not top_products:
                return self._no_data("products", language), []
            
            # Get average monthly costs for break-even calculation
            all_metrics = self.db.get_all_sales_metrics()
            if not all_metrics:
                return self._no_data("sales", language), []
            
            avg_monthly_costs = sum(m['total_costs'] for m in all_metrics) / len(all_metrics)
            
            # Calculate each product's contribution to break-even
            total_revenue = sum(p['total_revenue'] for p in top_products)
            
            if language == Language.SPANISH:
                answer = f"🎯 Contribución al punto de equilibrio (${avg_monthly_costs:,.2f}/mes):\n\n"
                cumulative_contribution = 0
                
                for i, product in enumerate(top_products, 1):
                    contribution_pct = (product['total_revenue'] / total_revenue * 100) if total_revenue > 0 else 0
                    cumulative_contribution += contribution_pct
                    
                    # Estimate monthly contribution (assuming revenue is spread over time)
                    monthly_contribution = product['total_revenue'] / len(all_metrics) if all_metrics else 0
                    breakeven_coverage = (monthly_contribution / avg_monthly_costs * 100) if avg_monthly_costs > 0 else 0
                    
                    answer += (f"{i}. {product['name']}\n"
                              f"   • Ingresos totales: ${product['total_revenue']:,.2f}\n"
                              f"   • Contribución mensual est.: ${monthly_contribution:,.2f}\n"
                              f"   • Cobertura de costos: {breakeven_coverage:.1f}%\n"
                              f"   • Categoría: {product['category']}\n\n")
                
                top_product = top_products[0]
                monthly_top = top_product['total_revenue'] / len(all_metrics) if all_metrics else 0
                coverage_top = (monthly_top / avg_monthly_costs * 100) if avg_monthly_costs > 0 else 0
                
                answer += (f"🏆 **{top_product['name']}** contribuye más al punto de equilibrio\n"
                          f"Cubre aproximadamente {coverage_top:.1f}% de los costos mensuales promedio.")
            else:
                answer = f"🎯 Break-even contribution (${avg_monthly_costs:,.2f}/month):\n\n"
                cumulative_contribution = 0
                
                for i, product in enumerate(top_products, 1):
                    contribution_pct = (product['total_revenue'] / total_revenue * 100) if total_revenue > 0 else 0
                    cumulative_contribution += contribution_pct
                    
                    # Estimate monthly contribution (assuming revenue is spread over time)
                    monthly_contribution = product['total_revenue'] / len(all_metrics) if all_metrics else 0
                    breakeven_coverage = (monthly_contribution / avg_monthly_costs * 100) if avg_monthly_costs > 0 else 0
                    
                    answer += (f"{i}. {product['name']}\n"
                              f"   • Total revenue: ${product['total_revenue']:,.2f}\n"
                              f"   • Est. monthly contribution: ${monthly_contribution:,.2f}\n"
                              f"   • Cost coverage: {breakeven_coverage:.1f}%\n"
                              f"   • Category: {product['category']}\n\n")
                
                top_product = top_products[0]
                monthly_top = top_product['total_revenue'] / len(all_metrics) if all_metrics else 0
                coverage_top = (monthly_top / avg_monthly_costs * 100) if avg_monthly_costs > 0 else 0
                
                answer += (f"🏆 **{top_product['name']}** contributes most to break-even\n"
                          f"Covers approximately {coverage_top:.1f}% of average monthly costs.")
            
            return answer, [DB_PRODUCTS, DB_SALES_TRANSACTIONS, DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in product breakeven contribution: {e}")
            return self._err(language), []

    async def _handle_customer_profitability(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze customer segment profitability."""
        try:
            # Get customer segments and their spending
            customers = self.db.get_customers(limit=1000)
            if not customers:
                return self._no_data("customers", language), []
            
            # Group by segment and calculate totals
            segment_stats = {}
            for customer in customers:
                segment = customer.get('segment', 'Unknown')
                if segment not in segment_stats:
                    segment_stats[segment] = {
                        'customers': 0,
                        'total_purchases': 0,
                        'total_transactions': 0
                    }
                
                segment_stats[segment]['customers'] += 1
                segment_stats[segment]['total_purchases'] += customer.get('total_purchases', 0)
                segment_stats[segment]['total_transactions'] += customer.get('transaction_count', 0)
            
            # Calculate profitability metrics
            for segment, stats in segment_stats.items():
                stats['avg_purchase_per_customer'] = stats['total_purchases'] / stats['customers'] if stats['customers'] > 0 else 0
                stats['avg_transactions_per_customer'] = stats['total_transactions'] / stats['customers'] if stats['customers'] > 0 else 0
                stats['avg_transaction_value'] = stats['total_purchases'] / stats['total_transactions'] if stats['total_transactions'] > 0 else 0
            
            # Sort by total purchases (profitability)
            sorted_segments = sorted(segment_stats.items(), key=lambda x: x[1]['total_purchases'], reverse=True)
            
            if language == Language.SPANISH:
                answer = "👥 Rentabilidad por segmento de clientes:\n\n"
                for i, (segment, stats) in enumerate(sorted_segments, 1):
                    answer += (f"{i}. **{segment}**\n"
                              f"   • Clientes: {stats['customers']}\n"
                              f"   • Compras totales: ${stats['total_purchases']:,.2f}\n"
                              f"   • Promedio por cliente: ${stats['avg_purchase_per_customer']:,.2f}\n"
                              f"   • Transacciones promedio: {stats['avg_transactions_per_customer']:.1f}\n"
                              f"   • Valor promedio por transacción: ${stats['avg_transaction_value']:,.2f}\n\n")
                
                top_segment = sorted_segments[0]
                answer += f"🏆 Segmento más rentable: **{top_segment[0]}** con ${top_segment[1]['total_purchases']:,.2f} en compras totales"
            else:
                answer = "👥 Customer segment profitability:\n\n"
                for i, (segment, stats) in enumerate(sorted_segments, 1):
                    answer += (f"{i}. **{segment}**\n"
                              f"   • Customers: {stats['customers']}\n"
                              f"   • Total purchases: ${stats['total_purchases']:,.2f}\n"
                              f"   • Average per customer: ${stats['avg_purchase_per_customer']:,.2f}\n"
                              f"   • Avg transactions: {stats['avg_transactions_per_customer']:.1f}\n"
                              f"   • Avg transaction value: ${stats['avg_transaction_value']:,.2f}\n\n")
                
                top_segment = sorted_segments[0]
                answer += f"🏆 Most profitable segment: **{top_segment[0]}** with ${top_segment[1]['total_purchases']:,.2f} in total purchases"
            
            return answer, [DB_CUSTOMERS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in customer profitability: {e}")
            return self._err(language), []
    # ── Advanced Business Intelligence Methods ──────────────────────────────

    async def _handle_worst_month_analysis(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze the worst performing month and explain why it was bad."""
        try:
            bw = self.db.get_best_worst_months()
            if not bw:
                logger.error("No best/worst months data returned from database")
                return self._no_data("sales", language), []
                
            worst = bw.get('worst_month')
            if not worst:
                logger.error("No worst_month in best/worst months data")
                return self._no_data("sales", language), []
            
            # Get additional context about that month
            year, month = worst['year'], worst['month']
            mn = MONTH_NAMES_EN[month]
            mn_es = MONTH_NAMES_ES[month]
            
            # Convert Decimal to float
            worst_profit = float(worst['profit'])
            
            # Get all metrics to compare
            all_metrics = self.db.get_all_sales_metrics()
            if not all_metrics:
                logger.error("No sales metrics available for comparison")
                return self._no_data("sales", language), []
                
            avg_profit = sum(float(m['profit']) for m in all_metrics) / len(all_metrics)
            
            profit_diff = worst_profit - avg_profit
            
            if language == Language.SPANISH:
                return (
                    f"📉 **Peor mes: {mn_es} {year}**\n\n"
                    f"💰 Resultados:\n"
                    f"• Ganancia: ${worst_profit:,.2f}\n"
                    f"• Diferencia vs promedio: ${profit_diff:,.2f}\n\n"
                    f"🔍 **¿Por qué fue malo?**\n"
                    f"• Ganancia {abs(profit_diff):,.2f} por debajo del promedio\n"
                    f"• Representa el peor rendimiento en nuestro historial\n"
                    f"• Posibles causas: costos elevados, ventas bajas, o factores estacionales\n\n"
                    f"💡 Este mes requiere análisis detallado para evitar repetir los problemas.",
                    [DB_BUSINESS_METRICS]
                )
            return (
                f"📉 **Worst month: {mn} {year}**\n\n"
                f"💰 Results:\n"
                f"• Profit: ${worst_profit:,.2f}\n"
                f"• Difference vs average: ${profit_diff:,.2f}\n\n"
                f"🔍 **Why was it bad?**\n"
                f"• Profit ${abs(profit_diff):,.2f} below average\n"
                f"• Represents worst performance in our history\n"
                f"• Possible causes: high costs, low sales, or seasonal factors\n\n"
                f"💡 This month requires detailed analysis to avoid repeating the issues.",
                [DB_BUSINESS_METRICS]
            )
        except Exception as e:
            logger.error(f"Error in worst month analysis: {e}", exc_info=True)
            return self._err(language), []

    async def _handle_high_sales_low_profit(self, language: Language) -> Tuple[str, List[str]]:
        """Find months where sales were high but profit was disproportionately low."""
        try:
            all_metrics = self.db.get_all_sales_metrics()
            if not all_metrics:
                return self._no_data("sales", language), []
            
            # Calculate profit margins for all months
            months_with_margins = []
            for metric in all_metrics:
                sales = float(metric['total_sales'])
                profit = float(metric['profit'])
                margin = (profit / sales * 100) if sales > 0 else 0
                months_with_margins.append({
                    'month': metric['month'],
                    'year': metric['year'],
                    'sales': sales,
                    'profit': profit,
                    'margin': margin
                })
            
            # Find months with high sales (top 30%) but low margins (bottom 30%)
            sorted_by_sales = sorted(months_with_margins, key=lambda x: x['sales'], reverse=True)
            sorted_by_margin = sorted(months_with_margins, key=lambda x: x['margin'])
            
            high_sales_threshold = len(sorted_by_sales) * 0.3
            low_margin_threshold = len(sorted_by_margin) * 0.3
            
            high_sales_months = set((m['year'], m['month']) for m in sorted_by_sales[:int(high_sales_threshold)])
            low_margin_months = set((m['year'], m['month']) for m in sorted_by_margin[:int(low_margin_threshold)])
            
            # Find intersection
            problematic_months = []
            for metric in months_with_margins:
                if (metric['year'], metric['month']) in high_sales_months and (metric['year'], metric['month']) in low_margin_months:
                    problematic_months.append(metric)
            
            if not problematic_months:
                if language == Language.SPANISH:
                    return (
                        "✅ No se encontraron meses con ventas altas pero ganancias desproporcionadamente bajas.\n"
                        "La relación ventas-ganancia parece consistente.",
                        [DB_BUSINESS_METRICS]
                    )
                return (
                    "✅ No months found with high sales but disproportionately low profit.\n"
                    "Sales-profit relationship appears consistent.",
                    [DB_BUSINESS_METRICS]
                )
            
            # Sort by worst margin
            problematic_months.sort(key=lambda x: x['margin'])
            
            if language == Language.SPANISH:
                answer = f"⚠️ Meses con ventas altas pero ganancia baja ({len(problematic_months)}):\n\n"
                for i, month in enumerate(problematic_months[:5], 1):
                    mn = MONTH_NAMES_ES[month['month']]
                    answer += (f"{i}. {mn} {month['year']}\n"
                              f"   • Ventas: ${month['sales']:,.2f} (altas)\n"
                              f"   • Ganancia: ${month['profit']:,.2f}\n"
                              f"   • Margen: {month['margin']:.1f}% (bajo)\n\n")
                
                answer += "🔍 **Posibles causas:**\n• Costos operativos elevados\n• Descuentos excesivos\n• Productos de bajo margen"
            else:
                answer = f"⚠️ Months with high sales but low profit ({len(problematic_months)}):\n\n"
                for i, month in enumerate(problematic_months[:5], 1):
                    mn = MONTH_NAMES_EN[month['month']]
                    answer += (f"{i}. {mn} {month['year']}\n"
                              f"   • Sales: ${month['sales']:,.2f} (high)\n"
                              f"   • Profit: ${month['profit']:,.2f}\n"
                              f"   • Margin: {month['margin']:.1f}% (low)\n\n")
                
                answer += "🔍 **Possible causes:**\n• High operational costs\n• Excessive discounts\n• Low-margin products"
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in high sales low profit analysis: {e}")
            return self._err(language), []

    async def _handle_surprising_performance(self, language: Language) -> Tuple[str, List[str]]:
        """Find months that performed surprisingly well compared to expectations."""
        try:
            all_metrics = self.db.get_all_sales_metrics()
            if not all_metrics:
                return self._no_data("sales", language), []
            
            # Sort by profit to find top performers
            sorted_by_profit = sorted(all_metrics, key=lambda x: float(x['profit']), reverse=True)
            
            # Get top 20% as "surprisingly good"
            top_count = max(1, len(sorted_by_profit) // 5)
            top_months = sorted_by_profit[:top_count]
            
            # Calculate average for comparison
            avg_profit = sum(float(m['profit']) for m in all_metrics) / len(all_metrics)
            
            if language == Language.SPANISH:
                answer = f"🌟 Meses con rendimiento sorprendentemente bueno (Top {top_count}):\n\n"
                for i, month in enumerate(top_months, 1):
                    mn = MONTH_NAMES_ES[month['month']]
                    profit = float(month['profit'])
                    above_avg = profit - avg_profit
                    above_avg_pct = (above_avg / avg_profit * 100) if avg_profit > 0 else 0
                    
                    answer += (f"{i}. {mn} {month['year']}\n"
                              f"   • Ganancia: ${profit:,.2f}\n"
                              f"   • Sobre promedio: ${above_avg:,.2f} (+{above_avg_pct:.1f}%)\n"
                              f"   • Ventas: ${month['total_sales']:,.2f}\n\n")
                
                best = top_months[0]
                mn_best = MONTH_NAMES_ES[best['month']]
                answer += f"🏆 **Mejor mes: {mn_best} {best['year']}** con ${float(best['profit']):,.2f} de ganancia"
            else:
                answer = f"🌟 Months with surprisingly good performance (Top {top_count}):\n\n"
                for i, month in enumerate(top_months, 1):
                    mn = MONTH_NAMES_EN[month['month']]
                    profit = float(month['profit'])
                    above_avg = profit - avg_profit
                    above_avg_pct = (above_avg / avg_profit * 100) if avg_profit > 0 else 0
                    
                    answer += (f"{i}. {mn} {month['year']}\n"
                              f"   • Profit: ${profit:,.2f}\n"
                              f"   • Above average: ${above_avg:,.2f} (+{above_avg_pct:.1f}%)\n"
                              f"   • Sales: ${month['total_sales']:,.2f}\n\n")
                
                best = top_months[0]
                mn_best = MONTH_NAMES_EN[best['month']]
                answer += f"🏆 **Best month: {mn_best} {best['year']}** with ${float(best['profit']):,.2f} profit"
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in surprising performance analysis: {e}")
            return self._err(language), []

    async def _handle_suspicious_months(self, language: Language) -> Tuple[str, List[str]]:
        """Find months with suspicious patterns (outliers in sales or profit)."""
        try:
            all_metrics = self.db.get_all_sales_metrics()
            if not all_metrics:
                return self._no_data("sales", language), []
            
            # Calculate statistics for outlier detection
            sales_values = [float(m['total_sales']) for m in all_metrics]
            profit_values = [float(m['profit']) for m in all_metrics]
            
            import statistics
            
            # Calculate quartiles and IQR for sales
            sales_q1 = statistics.quantiles(sales_values, n=4)[0]
            sales_q3 = statistics.quantiles(sales_values, n=4)[2]
            sales_iqr = sales_q3 - sales_q1
            sales_lower = sales_q1 - 1.5 * sales_iqr
            sales_upper = sales_q3 + 1.5 * sales_iqr
            
            # Calculate quartiles and IQR for profit
            profit_q1 = statistics.quantiles(profit_values, n=4)[0]
            profit_q3 = statistics.quantiles(profit_values, n=4)[2]
            profit_iqr = profit_q3 - profit_q1
            profit_lower = profit_q1 - 1.5 * profit_iqr
            profit_upper = profit_q3 + 1.5 * profit_iqr
            
            # Find outliers
            suspicious_months = []
            for metric in all_metrics:
                sales = float(metric['total_sales'])
                profit = float(metric['profit'])
                
                reasons = []
                if sales < sales_lower:
                    reasons.append("ventas muy bajas" if language == Language.SPANISH else "very low sales")
                elif sales > sales_upper:
                    reasons.append("ventas muy altas" if language == Language.SPANISH else "very high sales")
                
                if profit < profit_lower:
                    reasons.append("ganancia muy baja" if language == Language.SPANISH else "very low profit")
                elif profit > profit_upper:
                    reasons.append("ganancia muy alta" if language == Language.SPANISH else "very high profit")
                
                if reasons:
                    suspicious_months.append({
                        'month': metric['month'],
                        'year': metric['year'],
                        'sales': sales,
                        'profit': profit,
                        'reasons': reasons
                    })
            
            if not suspicious_months:
                if language == Language.SPANISH:
                    return (
                        "✅ No se detectaron meses sospechosos o con patrones anómalos.\n"
                        "Todos los meses están dentro de rangos normales.",
                        [DB_BUSINESS_METRICS]
                    )
                return (
                    "✅ No suspicious months or anomalous patterns detected.\n"
                    "All months are within normal ranges.",
                    [DB_BUSINESS_METRICS]
                )
            
            if language == Language.SPANISH:
                answer = f"🚨 Meses sospechosos detectados ({len(suspicious_months)}):\n\n"
                for i, month in enumerate(suspicious_months, 1):
                    mn = MONTH_NAMES_ES[month['month']]
                    reasons_str = ", ".join(month['reasons'])
                    answer += (f"{i}. {mn} {month['year']}\n"
                              f"   • Ventas: ${month['sales']:,.2f}\n"
                              f"   • Ganancia: ${month['profit']:,.2f}\n"
                              f"   • Razones: {reasons_str}\n\n")
                
                answer += "🔍 Estos meses requieren investigación adicional para entender las anomalías."
            else:
                answer = f"🚨 Suspicious months detected ({len(suspicious_months)}):\n\n"
                for i, month in enumerate(suspicious_months, 1):
                    mn = MONTH_NAMES_EN[month['month']]
                    reasons_str = ", ".join(month['reasons'])
                    answer += (f"{i}. {mn} {month['year']}\n"
                              f"   • Sales: ${month['sales']:,.2f}\n"
                              f"   • Profit: ${month['profit']:,.2f}\n"
                              f"   • Reasons: {reasons_str}\n\n")
                
                answer += "🔍 These months require additional investigation to understand the anomalies."
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in suspicious months analysis: {e}")
            return self._err(language), []

    async def _handle_closest_to_loss(self, language: Language) -> Tuple[str, List[str]]:
        """Find when the business was closest to losing money (lowest positive profit or highest loss)."""
        try:
            all_metrics = self.db.get_all_sales_metrics()
            if not all_metrics:
                return self._no_data("sales", language), []
            
            # Find month with profit closest to zero (could be positive or negative)
            closest_month = min(all_metrics, key=lambda x: abs(float(x['profit'])))
            profit = float(closest_month['profit'])
            
            # Convert all Decimal values to float
            total_sales = float(closest_month['total_sales'])
            total_costs = float(closest_month['total_costs'])
            
            mn = MONTH_NAMES_EN[closest_month['month']]
            mn_es = MONTH_NAMES_ES[closest_month['month']]
            
            # Also find the actual worst loss month for context
            worst_loss = min(all_metrics, key=lambda x: float(x['profit']))
            worst_profit = float(worst_loss['profit'])
            
            if language == Language.SPANISH:
                if profit >= 0:
                    answer = (f"💸 **Más cerca de perder dinero: {mn_es} {closest_month['year']}**\n\n"
                             f"💰 Resultados:\n"
                             f"• Ganancia: ${profit:,.2f} (apenas positiva)\n"
                             f"• Ventas: ${total_sales:,.2f}\n"
                             f"• Costos: ${total_costs:,.2f}\n\n"
                             f"⚠️ Este mes estuvo a solo ${profit:,.2f} de operar con pérdidas.\n")
                else:
                    answer = (f"💸 **Más cerca de perder dinero: {mn_es} {closest_month['year']}**\n\n"
                             f"💰 Resultados:\n"
                             f"• Pérdida: ${abs(profit):,.2f}\n"
                             f"• Ventas: ${total_sales:,.2f}\n"
                             f"• Costos: ${total_costs:,.2f}\n\n"
                             f"🚨 Este mes operamos con pérdidas de ${abs(profit):,.2f}.\n")
                
                if worst_profit != profit:
                    mn_worst = MONTH_NAMES_ES[worst_loss['month']]
                    answer += f"\n📉 Peor pérdida histórica: {mn_worst} {worst_loss['year']} (${abs(worst_profit):,.2f})"
            else:
                if profit >= 0:
                    answer = (f"💸 **Closest to losing money: {mn} {closest_month['year']}**\n\n"
                             f"💰 Results:\n"
                             f"• Profit: ${profit:,.2f} (barely positive)\n"
                             f"• Sales: ${total_sales:,.2f}\n"
                             f"• Costs: ${total_costs:,.2f}\n\n"
                             f"⚠️ This month was only ${profit:,.2f} away from operating at a loss.\n")
                else:
                    answer = (f"💸 **Closest to losing money: {mn} {closest_month['year']}**\n\n"
                             f"💰 Results:\n"
                             f"• Loss: ${abs(profit):,.2f}\n"
                             f"• Sales: ${total_sales:,.2f}\n"
                             f"• Costs: ${total_costs:,.2f}\n\n"
                             f"🚨 This month we operated at a loss of ${abs(profit):,.2f}.\n")
                
                if worst_profit != profit:
                    mn_worst = MONTH_NAMES_EN[worst_loss['month']]
                    answer += f"\n📉 Worst historical loss: {mn_worst} {worst_loss['year']} (${abs(worst_profit):,.2f})"
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in closest to loss analysis: {e}", exc_info=True)
            return self._err(language), []

    async def _handle_failure_scenarios(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze what would need to happen for the business to stop being profitable."""
        try:
            # Get recent metrics for scenario analysis
            recent_metrics = self.db.get_sales_metrics()
            if not recent_metrics:
                return self._no_data("sales", language), []
            
            recent = recent_metrics[0]
            current_sales = float(recent['total_sales'])
            current_costs = float(recent['total_costs'])
            current_profit = float(recent['profit'])
            
            # Calculate break-even scenarios
            scenarios = []
            
            # Scenario 1: Cost increase to eliminate profit
            cost_increase_to_break_even = current_profit
            cost_increase_pct = (cost_increase_to_break_even / current_costs * 100) if current_costs > 0 else 0
            
            # Scenario 2: Sales decrease to eliminate profit
            sales_decrease_to_break_even = current_profit
            sales_decrease_pct = (sales_decrease_to_break_even / current_sales * 100) if current_sales > 0 else 0
            
            # Scenario 3: Combined moderate changes
            moderate_cost_increase = current_costs * 0.15  # 15% cost increase
            required_sales_drop = current_profit - moderate_cost_increase
            required_sales_drop_pct = (required_sales_drop / current_sales * 100) if current_sales > 0 else 0
            
            mn = MONTH_NAMES_EN[recent['month']]
            mn_es = MONTH_NAMES_ES[recent['month']]
            
            if language == Language.SPANISH:
                answer = (f"⚠️ **Escenarios de riesgo para el negocio**\n"
                         f"Basado en {mn_es} {recent['year']} (ganancia actual: ${current_profit:,.2f})\n\n"
                         f"🔴 **Escenario 1: Aumento de costos**\n"
                         f"• Si los costos suben ${cost_increase_to_break_even:,.2f} ({cost_increase_pct:.1f}%)\n"
                         f"• El negocio llegaría al punto de equilibrio (ganancia = $0)\n\n"
                         f"🔴 **Escenario 2: Caída de ventas**\n"
                         f"• Si las ventas bajan ${sales_decrease_to_break_even:,.2f} ({sales_decrease_pct:.1f}%)\n"
                         f"• El negocio llegaría al punto de equilibrio\n\n"
                         f"🔴 **Escenario 3: Combinado (más realista)**\n"
                         f"• Costos suben 15% (+${moderate_cost_increase:,.2f})\n"
                         f"• Y ventas bajan {abs(required_sales_drop_pct):.1f}% (-${abs(required_sales_drop):,.2f})\n"
                         f"• Resultado: negocio no rentable\n\n"
                         f"💡 **Factores de riesgo principales:**\n"
                         f"• Inflación de costos operativos\n"
                         f"• Competencia que reduzca ventas\n"
                         f"• Recesión económica\n"
                         f"• Pérdida de clientes clave")
            else:
                answer = (f"⚠️ **Business Risk Scenarios**\n"
                         f"Based on {mn} {recent['year']} (current profit: ${current_profit:,.2f})\n\n"
                         f"🔴 **Scenario 1: Cost increase**\n"
                         f"• If costs increase by ${cost_increase_to_break_even:,.2f} ({cost_increase_pct:.1f}%)\n"
                         f"• Business would reach break-even (profit = $0)\n\n"
                         f"🔴 **Scenario 2: Sales decline**\n"
                         f"• If sales drop by ${sales_decrease_to_break_even:,.2f} ({sales_decrease_pct:.1f}%)\n"
                         f"• Business would reach break-even\n\n"
                         f"🔴 **Scenario 3: Combined (more realistic)**\n"
                         f"• Costs increase 15% (+${moderate_cost_increase:,.2f})\n"
                         f"• And sales drop {abs(required_sales_drop_pct):.1f}% (-${abs(required_sales_drop):,.2f})\n"
                         f"• Result: business becomes unprofitable\n\n"
                         f"💡 **Main risk factors:**\n"
                         f"• Operational cost inflation\n"
                         f"• Competition reducing sales\n"
                         f"• Economic recession\n"
                         f"• Loss of key customers")
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in failure scenarios analysis: {e}")
            return self._err(language), []

    async def _handle_near_failure_month(self, language: Language) -> Tuple[str, List[str]]:
        """Identify the month where the business almost failed (worst performance)."""
        try:
            all_metrics = self.db.get_all_sales_metrics()
            if not all_metrics:
                return self._no_data("sales", language), []
            
            # Find the month with the worst profit (most negative or lowest positive)
            worst_month = min(all_metrics, key=lambda x: float(x['profit']))
            worst_profit = float(worst_month['profit'])
            
            # Get context: average profit and how bad this was
            avg_profit = sum(float(m['profit']) for m in all_metrics) / len(all_metrics)
            profit_diff = worst_profit - avg_profit
            
            # Calculate how close to bankruptcy (if costs exceeded sales significantly)
            sales = float(worst_month['total_sales'])
            costs = float(worst_month['total_costs'])
            loss_ratio = abs(worst_profit) / sales if sales > 0 and worst_profit < 0 else 0
            
            mn = MONTH_NAMES_EN[worst_month['month']]
            mn_es = MONTH_NAMES_ES[worst_month['month']]
            
            if language == Language.SPANISH:
                if worst_profit < 0:
                    answer = (f"💥 **Mes más cerca del fracaso: {mn_es} {worst_month['year']}**\n\n"
                             f"📉 Resultados catastróficos:\n"
                             f"• Pérdida: ${abs(worst_profit):,.2f}\n"
                             f"• Ventas: ${sales:,.2f}\n"
                             f"• Costos: ${costs:,.2f}\n"
                             f"• Ratio de pérdida: {loss_ratio:.1%}\n\n"
                             f"⚠️ **¿Qué tan grave fue?**\n"
                             f"• ${abs(profit_diff):,.2f} peor que el promedio\n"
                             f"• Los costos excedieron las ventas por ${abs(worst_profit):,.2f}\n"
                             f"• Pérdida equivalente al {loss_ratio:.1%} de las ventas\n\n"
                             f"🚨 Este mes representó el mayor riesgo de quiebra del negocio.")
                else:
                    answer = (f"😰 **Mes más cerca del fracaso: {mn_es} {worst_month['year']}**\n\n"
                             f"📉 Resultados preocupantes:\n"
                             f"• Ganancia mínima: ${worst_profit:,.2f}\n"
                             f"• Ventas: ${sales:,.2f}\n"
                             f"• Costos: ${costs:,.2f}\n\n"
                             f"⚠️ **¿Qué tan grave fue?**\n"
                             f"• ${abs(profit_diff):,.2f} peor que el promedio\n"
                             f"• Apenas ${worst_profit:,.2f} de ganancia\n"
                             f"• Cualquier gasto adicional habría causado pérdidas\n\n"
                             f"🚨 Este mes estuvo peligrosamente cerca de la quiebra.")
            else:
                if worst_profit < 0:
                    answer = (f"💥 **Month closest to failure: {mn} {worst_month['year']}**\n\n"
                             f"📉 Catastrophic results:\n"
                             f"• Loss: ${abs(worst_profit):,.2f}\n"
                             f"• Sales: ${sales:,.2f}\n"
                             f"• Costs: ${costs:,.2f}\n"
                             f"• Loss ratio: {loss_ratio:.1%}\n\n"
                             f"⚠️ **How bad was it?**\n"
                             f"• ${abs(profit_diff):,.2f} worse than average\n"
                             f"• Costs exceeded sales by ${abs(worst_profit):,.2f}\n"
                             f"• Loss equivalent to {loss_ratio:.1%} of sales\n\n"
                             f"🚨 This month represented the highest bankruptcy risk.")
                else:
                    answer = (f"😰 **Month closest to failure: {mn} {worst_month['year']}**\n\n"
                             f"📉 Concerning results:\n"
                             f"• Minimal profit: ${worst_profit:,.2f}\n"
                             f"• Sales: ${sales:,.2f}\n"
                             f"• Costs: ${costs:,.2f}\n\n"
                             f"⚠️ **How bad was it?**\n"
                             f"• ${abs(profit_diff):,.2f} worse than average\n"
                             f"• Only ${worst_profit:,.2f} in profit\n"
                             f"• Any additional expense would have caused losses\n\n"
                             f"🚨 This month was dangerously close to bankruptcy.")
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in near failure month analysis: {e}")
            return self._err(language), []
    # ── Enhanced Product Analysis Methods ────────────────────────────────────

    async def _handle_underpriced_products(self, language: Language) -> Tuple[str, List[str]]:
        """Identify products that may be underpriced based on sales volume vs profit contribution."""
        try:
            # Get top products by volume (transaction count) and revenue
            top_products = self.db.get_top_products(limit=20)
            if not top_products:
                return self._no_data("products", language), []
            
            # Analyze products for potential underpricing
            # High sales volume but relatively low revenue per unit suggests underpricing
            underpriced_candidates = []
            
            for product in top_products:
                revenue = float(product['total_revenue'])
                # Get product details to estimate volume and pricing
                product_details = self.db.get_product_by_name(product['name'])
                if product_details:
                    price = float(product_details[0]['price'])
                    estimated_volume = revenue / price if price > 0 else 0
                    
                    # Calculate revenue per transaction (proxy for pricing efficiency)
                    # Products with high volume but low price might be underpriced
                    if estimated_volume > 50 and price < 1000:  # High volume, relatively low price
                        underpriced_candidates.append({
                            'name': product['name'],
                            'category': product['category'],
                            'price': price,
                            'revenue': revenue,
                            'estimated_volume': estimated_volume,
                            'revenue_per_unit': price
                        })
            
            # Sort by estimated volume (highest volume products that might be underpriced)
            underpriced_candidates.sort(key=lambda x: x['estimated_volume'], reverse=True)
            
            if not underpriced_candidates:
                if language == Language.SPANISH:
                    return (
                        "✅ No se detectaron productos claramente subvalorados.\n"
                        "Los precios parecen estar alineados con el volumen de ventas.",
                        [DB_PRODUCTS, DB_SALES_TRANSACTIONS]
                    )
                return (
                    "✅ No clearly underpriced products detected.\n"
                    "Pricing appears aligned with sales volume.",
                    [DB_PRODUCTS, DB_SALES_TRANSACTIONS]
                )
            
            if language == Language.SPANISH:
                answer = f"💰 Productos potencialmente subvalorados ({len(underpriced_candidates)}):\n\n"
                for i, product in enumerate(underpriced_candidates[:5], 1):
                    answer += (f"{i}. {product['name']}\n"
                              f"   • Precio actual: ${product['price']:,.2f}\n"
                              f"   • Volumen estimado: {product['estimated_volume']:.0f} unidades\n"
                              f"   • Ingresos totales: ${product['revenue']:,.2f}\n"
                              f"   • Categoría: {product['category']}\n\n")
                
                answer += ("🔍 **Recomendación:** Considera aumentar precios gradualmente\n"
                          "para productos con alta demanda y bajo precio.")
            else:
                answer = f"💰 Potentially underpriced products ({len(underpriced_candidates)}):\n\n"
                for i, product in enumerate(underpriced_candidates[:5], 1):
                    answer += (f"{i}. {product['name']}\n"
                              f"   • Current price: ${product['price']:,.2f}\n"
                              f"   • Estimated volume: {product['estimated_volume']:.0f} units\n"
                              f"   • Total revenue: ${product['revenue']:,.2f}\n"
                              f"   • Category: {product['category']}\n\n")
                
                answer += ("🔍 **Recommendation:** Consider gradual price increases\n"
                          "for high-demand, low-price products.")
            
            return answer, [DB_PRODUCTS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in underpriced products analysis: {e}")
            return self._err(language), []

    async def _handle_high_volume_low_margin_products(self, language: Language) -> Tuple[str, List[str]]:
        """Identify products that sell well but generate low profit margins."""
        try:
            top_products = self.db.get_top_products(limit=15)
            if not top_products:
                return self._no_data("products", language), []
            
            # Analyze margin efficiency for top products
            margin_analysis = []
            for product in top_products:
                revenue = float(product['total_revenue'])
                
                # Get product price for margin calculation
                product_details = self.db.get_product_by_name(product['name'])
                if product_details:
                    price = float(product_details[0]['price'])
                    # Estimate cost as 60-70% of price (industry average)
                    estimated_cost = price * 0.65
                    margin_per_unit = price - estimated_cost
                    margin_pct = (margin_per_unit / price * 100) if price > 0 else 0
                    
                    estimated_units = revenue / price if price > 0 else 0
                    
                    margin_analysis.append({
                        'name': product['name'],
                        'category': product['category'],
                        'revenue': revenue,
                        'price': price,
                        'estimated_cost': estimated_cost,
                        'margin_per_unit': margin_per_unit,
                        'margin_pct': margin_pct,
                        'estimated_units': estimated_units
                    })
            
            # Find products with high volume but low margins
            high_volume_low_margin = [
                p for p in margin_analysis 
                if p['estimated_units'] > 30 and p['margin_pct'] < 40  # High volume, low margin
            ]
            
            # Sort by revenue (most important products first)
            high_volume_low_margin.sort(key=lambda x: x['revenue'], reverse=True)
            
            if not high_volume_low_margin:
                if language == Language.SPANISH:
                    return (
                        "✅ Los productos más vendidos mantienen márgenes saludables.\n"
                        "No se detectaron productos con alto volumen y bajo margen.",
                        [DB_PRODUCTS, DB_SALES_TRANSACTIONS]
                    )
                return (
                    "✅ Top-selling products maintain healthy margins.\n"
                    "No high-volume, low-margin products detected.",
                    [DB_PRODUCTS, DB_SALES_TRANSACTIONS]
                )
            
            if language == Language.SPANISH:
                answer = f"⚠️ Productos con alto volumen pero bajo margen ({len(high_volume_low_margin)}):\n\n"
                for i, product in enumerate(high_volume_low_margin, 1):
                    answer += (f"{i}. {product['name']}\n"
                              f"   • Ingresos: ${product['revenue']:,.2f} (alto)\n"
                              f"   • Unidades estimadas: {product['estimated_units']:.0f}\n"
                              f"   • Margen por unidad: ${product['margin_per_unit']:,.2f}\n"
                              f"   • Margen %: {product['margin_pct']:.1f}% (bajo)\n"
                              f"   • Categoría: {product['category']}\n\n")
                
                answer += ("💡 **Estrategias de optimización:**\n"
                          "• Negociar mejores precios con proveedores\n"
                          "• Aumentar precios gradualmente\n"
                          "• Crear paquetes con productos de mayor margen")
            else:
                answer = f"⚠️ High-volume, low-margin products ({len(high_volume_low_margin)}):\n\n"
                for i, product in enumerate(high_volume_low_margin, 1):
                    answer += (f"{i}. {product['name']}\n"
                              f"   • Revenue: ${product['revenue']:,.2f} (high)\n"
                              f"   • Estimated units: {product['estimated_units']:.0f}\n"
                              f"   • Margin per unit: ${product['margin_per_unit']:,.2f}\n"
                              f"   • Margin %: {product['margin_pct']:.1f}% (low)\n"
                              f"   • Category: {product['category']}\n\n")
                
                answer += ("💡 **Optimization strategies:**\n"
                          "• Negotiate better supplier prices\n"
                          "• Gradually increase prices\n"
                          "• Bundle with higher-margin products")
            
            return answer, [DB_PRODUCTS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in high volume low margin analysis: {e}")
            return self._err(language), []

    # ── Enhanced Customer Analysis Methods ───────────────────────────────────

    async def _handle_customer_frequency_analysis(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze which countries or segments buy most frequently."""
        try:
            # Get all customers with transaction data
            top_customers = self.db.get_top_customers_by_orders(limit=50)
            if not top_customers:
                return self._no_data("customers", language), []
            
            # Group by country and segment for frequency analysis
            country_stats = {}
            segment_stats = {}
            
            for customer in top_customers:
                country = customer['country']
                segment = customer['segment']
                orders = customer['transaction_count']
                
                # Country analysis
                if country not in country_stats:
                    country_stats[country] = {'customers': 0, 'total_orders': 0, 'total_spent': 0}
                country_stats[country]['customers'] += 1
                country_stats[country]['total_orders'] += orders
                country_stats[country]['total_spent'] += float(customer['total_purchases'])
                
                # Segment analysis
                if segment not in segment_stats:
                    segment_stats[segment] = {'customers': 0, 'total_orders': 0, 'total_spent': 0}
                segment_stats[segment]['customers'] += 1
                segment_stats[segment]['total_orders'] += orders
                segment_stats[segment]['total_spent'] += float(customer['total_purchases'])
            
            # Calculate averages
            for stats in country_stats.values():
                stats['avg_orders_per_customer'] = stats['total_orders'] / stats['customers']
                stats['avg_spent_per_customer'] = stats['total_spent'] / stats['customers']
            
            for stats in segment_stats.values():
                stats['avg_orders_per_customer'] = stats['total_orders'] / stats['customers']
                stats['avg_spent_per_customer'] = stats['total_spent'] / stats['customers']
            
            # Sort by frequency (orders per customer)
            top_countries = sorted(country_stats.items(), key=lambda x: x[1]['avg_orders_per_customer'], reverse=True)[:5]
            top_segments = sorted(segment_stats.items(), key=lambda x: x[1]['avg_orders_per_customer'], reverse=True)
            
            if language == Language.SPANISH:
                answer = "🔄 **Análisis de frecuencia de compra**\n\n"
                answer += "🌍 **Por país (promedio de pedidos por cliente):**\n"
                for i, (country, stats) in enumerate(top_countries, 1):
                    answer += (f"{i}. {country}: {stats['avg_orders_per_customer']:.1f} pedidos/cliente\n"
                              f"   • {stats['customers']} clientes, ${stats['avg_spent_per_customer']:,.0f} promedio\n")
                
                answer += "\n🏢 **Por segmento:**\n"
                for i, (segment, stats) in enumerate(top_segments, 1):
                    answer += (f"{i}. {segment}: {stats['avg_orders_per_customer']:.1f} pedidos/cliente\n"
                              f"   • {stats['customers']} clientes, ${stats['avg_spent_per_customer']:,.0f} promedio\n")
                
                most_frequent_country = top_countries[0][0]
                most_frequent_segment = top_segments[0][0]
                answer += f"\n🏆 **Más frecuente:** {most_frequent_country} ({most_frequent_segment})"
            else:
                answer = "🔄 **Purchase Frequency Analysis**\n\n"
                answer += "🌍 **By country (average orders per customer):**\n"
                for i, (country, stats) in enumerate(top_countries, 1):
                    answer += (f"{i}. {country}: {stats['avg_orders_per_customer']:.1f} orders/customer\n"
                              f"   • {stats['customers']} customers, ${stats['avg_spent_per_customer']:,.0f} average\n")
                
                answer += "\n🏢 **By segment:**\n"
                for i, (segment, stats) in enumerate(top_segments, 1):
                    answer += (f"{i}. {segment}: {stats['avg_orders_per_customer']:.1f} orders/customer\n"
                              f"   • {stats['customers']} customers, ${stats['avg_spent_per_customer']:,.0f} average\n")
                
                most_frequent_country = top_countries[0][0]
                most_frequent_segment = top_segments[0][0]
                answer += f"\n🏆 **Most frequent:** {most_frequent_country} ({most_frequent_segment})"
            
            return answer, [DB_CUSTOMERS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in customer frequency analysis: {e}")
            return self._err(language), []

    async def _handle_most_valuable_segment(self, language: Language) -> Tuple[str, List[str]]:
        """Determine which customer segment is most valuable to the business."""
        try:
            # Get comprehensive customer data
            all_customers = self.db.get_customers(limit=1000)
            if not all_customers:
                return self._no_data("customers", language), []
            
            # Get top customers with transaction data for value analysis
            top_customers = self.db.get_top_customers(limit=100)
            
            # Analyze segments by multiple value metrics
            segment_analysis = {}
            
            for customer in top_customers:
                segment = customer['segment']
                if segment not in segment_analysis:
                    segment_analysis[segment] = {
                        'customers': 0,
                        'total_spent': 0,
                        'total_transactions': 0,
                        'customers_list': []
                    }
                
                segment_analysis[segment]['customers'] += 1
                segment_analysis[segment]['total_spent'] += float(customer['total_purchases'])
                segment_analysis[segment]['total_transactions'] += customer['transaction_count']
                segment_analysis[segment]['customers_list'].append(customer)
            
            # Calculate value metrics for each segment
            for segment, data in segment_analysis.items():
                data['avg_spent_per_customer'] = data['total_spent'] / data['customers']
                data['avg_transactions_per_customer'] = data['total_transactions'] / data['customers']
                data['avg_spent_per_transaction'] = data['total_spent'] / data['total_transactions'] if data['total_transactions'] > 0 else 0
                
                # Calculate value score (weighted combination of metrics)
                data['value_score'] = (
                    data['avg_spent_per_customer'] * 0.4 +  # 40% weight on spending
                    data['avg_transactions_per_customer'] * 100 * 0.3 +  # 30% weight on frequency
                    data['avg_spent_per_transaction'] * 0.3  # 30% weight on transaction size
                )
            
            # Sort segments by value score
            sorted_segments = sorted(segment_analysis.items(), key=lambda x: x[1]['value_score'], reverse=True)
            
            if language == Language.SPANISH:
                answer = "💎 **Análisis de valor por segmento de cliente**\n\n"
                for i, (segment, data) in enumerate(sorted_segments, 1):
                    answer += (f"{i}. **{segment}**\n"
                              f"   • Clientes analizados: {data['customers']}\n"
                              f"   • Gasto promedio: ${data['avg_spent_per_customer']:,.0f}/cliente\n"
                              f"   • Transacciones promedio: {data['avg_transactions_per_customer']:.1f}/cliente\n"
                              f"   • Valor por transacción: ${data['avg_spent_per_transaction']:,.0f}\n"
                              f"   • Puntuación de valor: {data['value_score']:,.0f}\n\n")
                
                most_valuable = sorted_segments[0]
                answer += (f"🏆 **Segmento más valioso: {most_valuable[0]}**\n"
                          f"Genera ${most_valuable[1]['avg_spent_per_customer']:,.0f} promedio por cliente")
            else:
                answer = "💎 **Customer Segment Value Analysis**\n\n"
                for i, (segment, data) in enumerate(sorted_segments, 1):
                    answer += (f"{i}. **{segment}**\n"
                              f"   • Customers analyzed: {data['customers']}\n"
                              f"   • Average spending: ${data['avg_spent_per_customer']:,.0f}/customer\n"
                              f"   • Average transactions: {data['avg_transactions_per_customer']:.1f}/customer\n"
                              f"   • Value per transaction: ${data['avg_spent_per_transaction']:,.0f}\n"
                              f"   • Value score: {data['value_score']:,.0f}\n\n")
                
                most_valuable = sorted_segments[0]
                answer += (f"🏆 **Most valuable segment: {most_valuable[0]}**\n"
                          f"Generates ${most_valuable[1]['avg_spent_per_customer']:,.0f} average per customer")
            
            return answer, [DB_CUSTOMERS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in most valuable segment analysis: {e}")
            return self._err(language), []
    # ── Marketing and Business Analysis Methods ────────────────────────────

    async def _handle_marketing_analysis(self, question: str, language: Language) -> Tuple[str, List[str]]:
        """Handle marketing-focused business questions."""
        try:
            q = question.lower()
            
            # Best customer type analysis
            if any(w in q for w in [CUSTOMER_TYPE_ES, MOST_PROFITABLE_CLIENT_ES, 'client type', 'customer type']):
                return await self._handle_most_profitable_customer_type(language)
            
            # Monthly segment analysis
            if any(w in q for w in ['segmento compró más este mes', 'segment bought most', 'compró más este mes']):
                return await self._handle_monthly_segment_analysis(language)
            
            # Country performance analysis
            if any(w in q for w in ['país tuvo mejor comportamiento', 'country performance', SALES_BEHAVIOR_ES]):
                return await self._handle_country_performance_analysis(language)
            
            # Product promotion recommendations
            if any(w in q for w in [PROMOTION_TARGET_ES, 'should promote', 'promocionarse más']):
                return await self._handle_promotion_recommendations(language)
            
            # Campaign targeting
            if any(w in q for w in [CAMPAIGN_INTEREST_ES, 'interesting for campaign', 'para una campaña']):
                return await self._handle_campaign_targeting(language)
            
            # Segment decline analysis
            if any(w in q for w in ['comprando menos que antes', 'buying less than before', 'menos que antes']):
                return await self._handle_segment_decline_analysis(language)
            
            # Best promotion timing
            if any(w in q for w in [BEST_LAUNCH_MONTH_ES, 'best month to launch', LAUNCH_PROMOTIONS_ES]):
                return await self._handle_promotion_timing(language)
            
            # Product acceptance analysis
            if any(w in q for w in [BEST_ACCEPTANCE_ES, 'best acceptance', 'aceptación por los clientes']):
                return await self._handle_product_acceptance(language)
            
            # Premium segment targeting
            if any(w in q for w in [EXPENSIVE_PRODUCTS_ES, 'sell expensive products', 'productos más caros']):
                return await self._handle_premium_segment_targeting(language)
            
            # Default marketing response
            return await self._handle_customer_info(question, language)
            
        except Exception as e:
            logger.error(f"Error in marketing analysis: {e}")
            return self._err(language), []

    async def _handle_most_profitable_customer_type(self, language: Language) -> Tuple[str, List[str]]:
        """Identify which customer type generates the most profit."""
        try:
            # Get customer segment profitability
            top_customers = self.db.get_top_customers(limit=100)
            if not top_customers:
                return self._no_data("customers", language), []
            
            # Analyze by segment
            segment_stats = {}
            for customer in top_customers:
                segment = customer['segment']
                if segment not in segment_stats:
                    segment_stats[segment] = {'total_spent': 0, 'customers': 0, 'transactions': 0}
                
                segment_stats[segment]['total_spent'] += float(customer['total_purchases'])
                segment_stats[segment]['customers'] += 1
                segment_stats[segment]['transactions'] += customer['transaction_count']
            
            # Calculate averages and sort by profitability
            for segment, stats in segment_stats.items():
                stats['avg_per_customer'] = stats['total_spent'] / stats['customers']
                stats['avg_per_transaction'] = stats['total_spent'] / stats['transactions'] if stats['transactions'] > 0 else 0
            
            sorted_segments = sorted(segment_stats.items(), key=lambda x: x[1]['avg_per_customer'], reverse=True)
            
            if language == Language.SPANISH:
                answer = "💰 **Tipos de cliente que dejan más dinero:**\n\n"
                for i, (segment, stats) in enumerate(sorted_segments, 1):
                    answer += (f"{i}. **{segment}**\n"
                              f"   • Promedio por cliente: ${stats['avg_per_customer']:,.0f}\n"
                              f"   • Promedio por transacción: ${stats['avg_per_transaction']:,.0f}\n"
                              f"   • Total clientes analizados: {stats['customers']}\n\n")
                
                best_segment = sorted_segments[0]
                answer += f"🏆 **Más rentable: {best_segment[0]}** (${best_segment[1]['avg_per_customer']:,.0f} promedio por cliente)"
            else:
                answer = "💰 **Customer types that generate most money:**\n\n"
                for i, (segment, stats) in enumerate(sorted_segments, 1):
                    answer += (f"{i}. **{segment}**\n"
                              f"   • Average per customer: ${stats['avg_per_customer']:,.0f}\n"
                              f"   • Average per transaction: ${stats['avg_per_transaction']:,.0f}\n"
                              f"   • Total customers analyzed: {stats['customers']}\n\n")
                
                best_segment = sorted_segments[0]
                answer += f"🏆 **Most profitable: {best_segment[0]}** (${best_segment[1]['avg_per_customer']:,.0f} average per customer)"
            
            return answer, [DB_CUSTOMERS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in most profitable customer type: {e}")
            return self._err(language), []

    async def _handle_monthly_segment_analysis(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze which segment bought the most this month."""
        try:
            # Get recent month data
            recent_metrics = self.db.get_sales_metrics()
            if not recent_metrics:
                return self._no_data("sales", language), []
            
            recent = recent_metrics[0]
            mn = MONTH_NAMES_EN[recent['month']]
            mn_es = MONTH_NAMES_ES[recent['month']]
            
            # Get top customers for segment analysis
            top_customers = self.db.get_top_customers(limit=50)
            
            # Simulate monthly segment performance (in real system, would filter by month)
            segment_performance = {}
            for customer in top_customers:
                segment = customer['segment']
                if segment not in segment_performance:
                    segment_performance[segment] = {'customers': 0, 'total_spent': 0, 'transactions': 0}
                
                # Estimate monthly performance (total / number of months in data)
                monthly_estimate = float(customer['total_purchases']) / 97  # 97 months of data
                segment_performance[segment]['customers'] += 1
                segment_performance[segment]['total_spent'] += monthly_estimate
                segment_performance[segment]['transactions'] += customer['transaction_count'] / 97
            
            sorted_segments = sorted(segment_performance.items(), key=lambda x: x[1]['total_spent'], reverse=True)
            
            if language == Language.SPANISH:
                answer = f"📊 **Segmentos que más compraron en {mn_es} {recent['year']}:**\n\n"
                for i, (segment, stats) in enumerate(sorted_segments, 1):
                    answer += (f"{i}. **{segment}**\n"
                              f"   • Compras estimadas: ${stats['total_spent']:,.0f}\n"
                              f"   • Clientes activos: {stats['customers']}\n"
                              f"   • Transacciones: {stats['transactions']:.0f}\n\n")
                
                winner = sorted_segments[0]
                answer += f"🥇 **Ganador del mes: {winner[0]}** con ${winner[1]['total_spent']:,.0f} en compras"
            else:
                answer = f"📊 **Segments that bought most in {mn} {recent['year']}:**\n\n"
                for i, (segment, stats) in enumerate(sorted_segments, 1):
                    answer += (f"{i}. **{segment}**\n"
                              f"   • Estimated purchases: ${stats['total_spent']:,.0f}\n"
                              f"   • Active customers: {stats['customers']}\n"
                              f"   • Transactions: {stats['transactions']:.0f}\n\n")
                
                winner = sorted_segments[0]
                answer += f"🥇 **Month winner: {winner[0]}** with ${winner[1]['total_spent']:,.0f} in purchases"
            
            return answer, [DB_CUSTOMERS, DB_SALES_TRANSACTIONS, DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in monthly segment analysis: {e}")
            return self._err(language), []

    async def _handle_country_performance_analysis(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze which country had the best sales performance."""
        try:
            top_customers = self.db.get_top_customers(limit=100)
            if not top_customers:
                return self._no_data("customers", language), []
            
            # Analyze by country
            country_stats = {}
            for customer in top_customers:
                country = customer['country']
                if country not in country_stats:
                    country_stats[country] = {
                        'customers': 0, 'total_spent': 0, 'transactions': 0,
                        'avg_per_customer': 0, 'avg_per_transaction': 0
                    }
                
                country_stats[country]['customers'] += 1
                country_stats[country]['total_spent'] += float(customer['total_purchases'])
                country_stats[country]['transactions'] += customer['transaction_count']
            
            # Calculate performance metrics
            for country, stats in country_stats.items():
                stats['avg_per_customer'] = stats['total_spent'] / stats['customers']
                stats['avg_per_transaction'] = stats['total_spent'] / stats['transactions'] if stats['transactions'] > 0 else 0
                # Performance score: combination of total revenue and efficiency
                stats['performance_score'] = stats['total_spent'] * 0.6 + stats['avg_per_customer'] * 0.4
            
            # Sort by performance score
            sorted_countries = sorted(country_stats.items(), key=lambda x: x[1]['performance_score'], reverse=True)
            
            if language == Language.SPANISH:
                answer = "🌍 **Países con mejor comportamiento de ventas:**\n\n"
                for i, (country, stats) in enumerate(sorted_countries[:10], 1):
                    answer += (f"{i}. **{country}**\n"
                              f"   • Ingresos totales: ${stats['total_spent']:,.0f}\n"
                              f"   • Promedio por cliente: ${stats['avg_per_customer']:,.0f}\n"
                              f"   • Clientes: {stats['customers']}\n"
                              f"   • Transacciones: {stats['transactions']}\n\n")
                
                best_country = sorted_countries[0]
                answer += f"🏆 **Mejor país: {best_country[0]}** con puntuación de {best_country[1]['performance_score']:,.0f}"
            else:
                answer = "🌍 **Countries with best sales performance:**\n\n"
                for i, (country, stats) in enumerate(sorted_countries[:10], 1):
                    answer += (f"{i}. **{country}**\n"
                              f"   • Total revenue: ${stats['total_spent']:,.0f}\n"
                              f"   • Average per customer: ${stats['avg_per_customer']:,.0f}\n"
                              f"   • Customers: {stats['customers']}\n"
                              f"   • Transactions: {stats['transactions']}\n\n")
                
                best_country = sorted_countries[0]
                answer += f"🏆 **Best country: {best_country[0]}** with score of {best_country[1]['performance_score']:,.0f}"
            
            return answer, [DB_CUSTOMERS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in country performance analysis: {e}")
            return self._err(language), []

    async def _handle_promotion_recommendations(self, language: Language) -> Tuple[str, List[str]]:
        """Recommend which products should be promoted more."""
        try:
            top_products = self.db.get_top_products(limit=20)
            if not top_products:
                return self._no_data("products", language), []
            
            # Analyze products for promotion potential
            promotion_candidates = []
            for product in top_products:
                revenue = float(product['total_revenue'])
                
                # Get product details for pricing analysis
                product_details = self.db.get_product_by_name(product['name'])
                if product_details:
                    price = float(product_details[0]['price'])
                    estimated_volume = revenue / price if price > 0 else 0
                    
                    # Promotion score: high revenue potential but not oversaturated
                    # Good candidates: medium-high revenue, reasonable price point
                    promotion_score = 0
                    if 500 <= price <= 2000:  # Good price range for promotion
                        promotion_score += 30
                    if 50000 <= revenue <= 800000:  # Medium-high revenue range
                        promotion_score += 40
                    if estimated_volume >= 100:  # Decent volume
                        promotion_score += 30
                    
                    promotion_candidates.append({
                        'name': product['name'],
                        'category': product['category'],
                        'revenue': revenue,
                        'price': price,
                        'estimated_volume': estimated_volume,
                        'promotion_score': promotion_score
                    })
            
            # Sort by promotion score
            promotion_candidates.sort(key=lambda x: x['promotion_score'], reverse=True)
            
            if language == Language.SPANISH:
                answer = "📢 **Productos que deberían promocionarse más:**\n\n"
                for i, product in enumerate(promotion_candidates[:8], 1):
                    answer += (f"{i}. **{product['name']}**\n"
                              f"   • Categoría: {product['category']}\n"
                              f"   • Precio: ${product['price']:,.2f}\n"
                              f"   • Ingresos actuales: ${product['revenue']:,.0f}\n"
                              f"   • Volumen estimado: {product['estimated_volume']:.0f} unidades\n"
                              f"   • Potencial de promoción: {product['promotion_score']}/100\n\n")
                
                if promotion_candidates:
                    top_candidate = promotion_candidates[0]
                    answer += f"🎯 **Mejor candidato: {top_candidate['name']}** (puntuación: {top_candidate['promotion_score']}/100)"
            else:
                answer = "📢 **Products that should be promoted more:**\n\n"
                for i, product in enumerate(promotion_candidates[:8], 1):
                    answer += (f"{i}. **{product['name']}**\n"
                              f"   • Category: {product['category']}\n"
                              f"   • Price: ${product['price']:,.2f}\n"
                              f"   • Current revenue: ${product['revenue']:,.0f}\n"
                              f"   • Estimated volume: {product['estimated_volume']:.0f} units\n"
                              f"   • Promotion potential: {product['promotion_score']}/100\n\n")
                
                if promotion_candidates:
                    top_candidate = promotion_candidates[0]
                    answer += f"🎯 **Top candidate: {top_candidate['name']}** (score: {top_candidate['promotion_score']}/100)"
            
            return answer, [DB_PRODUCTS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in promotion recommendations: {e}")
            return self._err(language), []

    # ── Accounting and Cost Analysis Methods ─────────────────────────────────

    async def _handle_accounting_analysis(self, question: str, language: Language) -> Tuple[str, List[str]]:
        """Handle accounting and cost-focused questions."""
        try:
            q = question.lower()
            
            # High spending month analysis
            if any(w in q for w in ['gastamos más de lo normal', 'spent more than normal', 'mes gastamos más']):
                return await self._handle_high_spending_analysis(language)
            
            # Cost coverage analysis
            if any(w in q for w in [COST_COVERAGE_ES, 'covered the costs', 'ventas cubrieron']):
                return await self._handle_cost_coverage_analysis(language)
            
            # Net profit analysis
            if any(w in q for w in [ACTUAL_PROFIT_ES, 'quedó después de', 'really left', 'after costs']):
                return await self._handle_net_profit_analysis(language)
            
            # Negative profit months
            if any(w in q for w in [NEGATIVE_PROFIT_ES, 'profit was negative', 'meses la utilidad']):
                return await self._handle_negative_profit_months(language)
            
            # Cost growth analysis
            if any(w in q for w in [RISING_COSTS_ES, 'costs are growing', 'creciendo más rápido']):
                return await self._handle_cost_growth_analysis(language)
            
            # Most profitable year
            if any(w in q for w in [MOST_PROFITABLE_YEAR_ES, 'year was most profitable', 'más rentable']):
                return await self._handle_most_profitable_year(language)
            
            # Cost reduction scenarios
            if any(w in q for w in [REDUCE_EXPENSES_ES, 'reduce expenses', 'quedar en positivo']):
                return await self._handle_cost_reduction_scenarios(language)
            
            # Money flow analysis
            if any(w in q for w in [MONEY_DRAIN_ES, 'money is going', 'yendo la plata']):
                return await self._handle_money_flow_analysis(language)
            
            # Profit vs sales analysis
            if any(w in q for w in [PROFIT_VS_SALES_ES, 'earning or just selling', 'solo vendiendo mucho']):
                return await self._handle_profit_vs_sales_analysis(language)
            
            # Default: return generic accounting message
            if language == Language.SPANISH:
                return (
                    "💡 Pregunta sobre contabilidad detectada. "
                    "Puedo ayudarte con análisis de costos, ganancias, márgenes y tendencias financieras.",
                    []
                )
            return (
                "💡 Accounting question detected. "
                "I can help with cost analysis, profit analysis, margins, and financial trends.",
                []
            )
            
        except Exception as e:
            logger.error(f"Error in accounting analysis: {e}")
            return self._err(language), []

    async def _handle_high_spending_analysis(self, language: Language) -> Tuple[str, List[str]]:
        """Identify months with unusually high costs."""
        try:
            all_metrics = self.db.get_all_sales_metrics()
            if not all_metrics:
                return self._no_data("sales", language), []
            
            # Calculate average costs and identify outliers
            costs = [float(m['total_costs']) for m in all_metrics]
            avg_costs = sum(costs) / len(costs)
            
            # Find months with costs significantly above average (>20% above average)
            high_spending_months = []
            for metric in all_metrics:
                cost = float(metric['total_costs'])
                if cost > avg_costs * 1.2:  # 20% above average
                    deviation = ((cost - avg_costs) / avg_costs) * 100
                    high_spending_months.append({
                        'month': metric['month'],
                        'year': metric['year'],
                        'costs': cost,
                        'deviation': deviation,
                        'sales': float(metric['total_sales']),
                        'profit': float(metric['profit'])
                    })
            
            # Sort by deviation (highest first)
            high_spending_months.sort(key=lambda x: x['deviation'], reverse=True)
            
            if not high_spending_months:
                if language == Language.SPANISH:
                    return (
                        f"✅ No se detectaron meses con gastos anormalmente altos.\n"
                        f"Costo promedio mensual: ${avg_costs:,.2f}",
                        [DB_BUSINESS_METRICS]
                    )
                return (
                    f"✅ No months with abnormally high spending detected.\n"
                    f"Average monthly cost: ${avg_costs:,.2f}",
                    [DB_BUSINESS_METRICS]
                )
            
            if language == Language.SPANISH:
                answer = f"💸 **Meses con gastos más altos de lo normal:**\n"
                answer += f"(Promedio: ${avg_costs:,.2f})\n\n"
                
                for i, month in enumerate(high_spending_months[:8], 1):
                    mn = MONTH_NAMES_ES[month['month']]
                    answer += (f"{i}. {mn} {month['year']}\n"
                              f"   • Costos: ${month['costs']:,.2f} (+{month['deviation']:.1f}%)\n"
                              f"   • Ventas: ${month['sales']:,.2f}\n"
                              f"   • Ganancia: ${month['profit']:,.2f}\n\n")
                
                worst = high_spending_months[0]
                mn_worst = MONTH_NAMES_ES[worst['month']]
                answer += f"⚠️ **Peor mes: {mn_worst} {worst['year']}** con ${worst['costs']:,.2f} en costos (+{worst['deviation']:.1f}%)"
            else:
                answer = f"💸 **Months with higher than normal spending:**\n"
                answer += f"(Average: ${avg_costs:,.2f})\n\n"
                
                for i, month in enumerate(high_spending_months[:8], 1):
                    mn = MONTH_NAMES_EN[month['month']]
                    answer += (f"{i}. {mn} {month['year']}\n"
                              f"   • Costs: ${month['costs']:,.2f} (+{month['deviation']:.1f}%)\n"
                              f"   • Sales: ${month['sales']:,.2f}\n"
                              f"   • Profit: ${month['profit']:,.2f}\n\n")
                
                worst = high_spending_months[0]
                mn_worst = MONTH_NAMES_EN[worst['month']]
                answer += f"⚠️ **Worst month: {mn_worst} {worst['year']}** with ${worst['costs']:,.2f} in costs (+{worst['deviation']:.1f}%)"
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in high spending analysis: {e}")
            return self._err(language), []

    async def _handle_cost_coverage_analysis(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze if sales covered costs this month."""
        try:
            recent_metrics = self.db.get_sales_metrics()
            if not recent_metrics:
                return self._no_data("sales", language), []
            
            recent = recent_metrics[0]
            sales = float(recent['total_sales'])
            costs = float(recent['total_costs'])
            profit = float(recent['profit'])
            
            coverage_ratio = (sales / costs) if costs > 0 else 0
            mn = MONTH_NAMES_EN[recent['month']]
            mn_es = MONTH_NAMES_ES[recent['month']]
            
            if language == Language.SPANISH:
                if profit > 0:
                    answer = (f"✅ **Sí, las ventas cubrieron los costos en {mn_es} {recent['year']}**\n\n"
                             f"📊 Análisis de cobertura:\n"
                             f"• Ventas: ${sales:,.2f}\n"
                             f"• Costos: ${costs:,.2f}\n"
                             f"• Ganancia: ${profit:,.2f}\n"
                             f"• Ratio de cobertura: {coverage_ratio:.2f}x\n\n"
                             f"💡 Las ventas cubrieron {coverage_ratio:.1f} veces los costos, "
                             f"dejando ${profit:,.2f} de ganancia.")
                else:
                    answer = (f"❌ **No, las ventas NO cubrieron los costos en {mn_es} {recent['year']}**\n\n"
                             f"📊 Análisis de cobertura:\n"
                             f"• Ventas: ${sales:,.2f}\n"
                             f"• Costos: ${costs:,.2f}\n"
                             f"• Pérdida: ${abs(profit):,.2f}\n"
                             f"• Ratio de cobertura: {coverage_ratio:.2f}x\n\n"
                             f"⚠️ Faltaron ${abs(profit):,.2f} para cubrir todos los costos.")
            else:
                if profit > 0:
                    answer = (f"✅ **Yes, sales covered costs in {mn} {recent['year']}**\n\n"
                             f"📊 Coverage analysis:\n"
                             f"• Sales: ${sales:,.2f}\n"
                             f"• Costs: ${costs:,.2f}\n"
                             f"• Profit: ${profit:,.2f}\n"
                             f"• Coverage ratio: {coverage_ratio:.2f}x\n\n"
                             f"💡 Sales covered {coverage_ratio:.1f} times the costs, "
                             f"leaving ${profit:,.2f} in profit.")
                else:
                    answer = (f"❌ **No, sales did NOT cover costs in {mn} {recent['year']}**\n\n"
                             f"📊 Coverage analysis:\n"
                             f"• Sales: ${sales:,.2f}\n"
                             f"• Costs: ${costs:,.2f}\n"
                             f"• Loss: ${abs(profit):,.2f}\n"
                             f"• Coverage ratio: {coverage_ratio:.2f}x\n\n"
                             f"⚠️ We were ${abs(profit):,.2f} short of covering all costs.")
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in cost coverage analysis: {e}")
            return self._err(language), []

    async def _handle_net_profit_analysis(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze what's left after all costs and expenses."""
        try:
            recent_metrics = self.db.get_sales_metrics()
            if not recent_metrics:
                return self._no_data("sales", language), []
            
            recent = recent_metrics[0]
            sales = float(recent['total_sales'])
            costs = float(recent['total_costs'])
            profit = float(recent['profit'])
            
            # Calculate percentages
            cost_percentage = (costs / sales * 100) if sales > 0 else 0
            profit_percentage = (profit / sales * 100) if sales > 0 else 0
            
            mn = MONTH_NAMES_EN[recent['month']]
            mn_es = MONTH_NAMES_ES[recent['month']]
            
            if language == Language.SPANISH:
                answer = (f"💰 **Lo que nos quedó después de costos y gastos ({mn_es} {recent['year']}):**\n\n"
                         f"📊 Desglose financiero:\n"
                         f"• Ingresos brutos: ${sales:,.2f} (100%)\n"
                         f"• Costos y gastos: ${costs:,.2f} ({cost_percentage:.1f}%)\n"
                         f"• **Ganancia neta: ${profit:,.2f} ({profit_percentage:.1f}%)**\n\n")
                
                if profit > 0:
                    answer += (f"✅ **Resultado positivo**\n"
                              f"Por cada $100 de ventas, nos quedaron ${profit_percentage:.1f} de ganancia neta.")
                else:
                    answer += (f"❌ **Resultado negativo**\n"
                              f"Tuvimos una pérdida de ${abs(profit):,.2f} este mes.")
            else:
                answer = (f"💰 **What's left after costs and expenses ({mn} {recent['year']}):**\n\n"
                         f"📊 Financial breakdown:\n"
                         f"• Gross revenue: ${sales:,.2f} (100%)\n"
                         f"• Costs and expenses: ${costs:,.2f} ({cost_percentage:.1f}%)\n"
                         f"• **Net profit: ${profit:,.2f} ({profit_percentage:.1f}%)**\n\n")
                
                if profit > 0:
                    answer += (f"✅ **Positive result**\n"
                              f"For every $100 in sales, we kept ${profit_percentage:.1f} in net profit.")
                else:
                    answer += (f"❌ **Negative result**\n"
                              f"We had a loss of ${abs(profit):,.2f} this month.")
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in net profit analysis: {e}")
            return self._err(language), []


    # ═══════════════════════════════════════════════════════════════════════════════
    # MARKETING ANALYSIS SUB-METHODS
    # ═══════════════════════════════════════════════════════════════════════════════

    async def _handle_campaign_targeting(self, language: Language) -> Tuple[str, List[str]]:
        """Identify interesting customers for campaigns."""
        try:
            customers = self.db.get_customers(limit=1000)
            if not customers:
                return self._no_data("customers", language), []
            
            # Find high-value customers by segment
            segment_value = {}
            for c in customers:
                seg = c.get('segment', 'Unknown')
                purchases = float(c.get('total_purchases', 0))
                if seg not in segment_value:
                    segment_value[seg] = {'total': 0, 'count': 0, 'customers': []}
                segment_value[seg]['total'] += purchases
                segment_value[seg]['count'] += 1
                segment_value[seg]['customers'].append(c)
            
            # Calculate average value per segment
            segment_avg = {seg: data['total'] / data['count'] for seg, data in segment_value.items()}
            top_segment = max(segment_avg, key=segment_avg.get)
            top_customers = sorted(segment_value[top_segment]['customers'], 
                                  key=lambda x: float(x.get('total_purchases', 0)), reverse=True)[:3]
            
            if language == Language.SPANISH:
                answer = f"🎯 **Clientes interesantes para campaña:**\n\n"
                answer += f"📊 Segmento más valioso: **{top_segment}** (${segment_avg[top_segment]:,.2f} promedio)\n\n"
                answer += f"👥 Top 3 clientes para contactar:\n"
                for i, c in enumerate(top_customers, 1):
                    answer += f"{i}. {c['name']} ({c['country']}) - ${float(c.get('total_purchases', 0)):,.2f}\n"
            else:
                answer = f"🎯 **Interesting customers for campaigns:**\n\n"
                answer += f"📊 Most valuable segment: **{top_segment}** (${segment_avg[top_segment]:,.2f} average)\n\n"
                answer += f"👥 Top 3 customers to contact:\n"
                for i, c in enumerate(top_customers, 1):
                    answer += f"{i}. {c['name']} ({c['country']}) - ${float(c.get('total_purchases', 0)):,.2f}\n"
            
            return answer, [DB_CUSTOMERS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in campaign targeting: {e}")
            return self._err(language), []

    async def _handle_segment_decline_analysis(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze which segments are buying less than before."""
        try:
            customers = self.db.get_customers(limit=1000)
            if not customers:
                return self._no_data("customers", language), []
            
            # Analyze segment activity
            segment_stats = {}
            for c in customers:
                seg = c.get('segment', 'Unknown')
                purchases = float(c.get('total_purchases', 0))
                if seg not in segment_stats:
                    segment_stats[seg] = {'total': 0, 'count': 0}
                segment_stats[seg]['total'] += purchases
                segment_stats[seg]['count'] += 1
            
            # Calculate average per segment
            segment_avg = {seg: data['total'] / data['count'] for seg, data in segment_stats.items()}
            
            # Sort by average purchase value
            sorted_segments = sorted(segment_avg.items(), key=lambda x: x[1])
            
            if language == Language.SPANISH:
                answer = f"📉 **Análisis de actividad por segmento:**\n\n"
                for seg, avg in sorted_segments:
                    answer += f"• **{seg}**: ${avg:,.2f} promedio por cliente\n"
                answer += f"\n💡 El segmento **{sorted_segments[0][0]}** tiene menor actividad de compra."
            else:
                answer = f"📉 **Segment activity analysis:**\n\n"
                for seg, avg in sorted_segments:
                    answer += f"• **{seg}**: ${avg:,.2f} average per customer\n"
                answer += f"\n💡 The **{sorted_segments[0][0]}** segment has lower purchase activity."
            
            return answer, [DB_CUSTOMERS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in segment decline analysis: {e}")
            return self._err(language), []

    async def _handle_promotion_timing(self, language: Language) -> Tuple[str, List[str]]:
        """Find the best month to launch promotions."""
        try:
            metrics = self.db.get_sales_metrics()
            if not metrics:
                return self._no_data("sales", language), []
            
            # Find month with highest sales (best for promotions)
            best_month = max(metrics, key=lambda x: float(x.get('total_sales', 0)))
            worst_month = min(metrics, key=lambda x: float(x.get('total_sales', 0)))
            
            best_sales = float(best_month['total_sales'])
            worst_sales = float(worst_month['total_sales'])
            
            mn_best = MONTH_NAMES_EN[best_month['month']]
            mn_worst = MONTH_NAMES_EN[worst_month['month']]
            mn_best_es = MONTH_NAMES_ES[best_month['month']]
            mn_worst_es = MONTH_NAMES_ES[worst_month['month']]
            
            if language == Language.SPANISH:
                answer = f"📅 **Mejor mes para lanzar promociones:**\n\n"
                answer += f"🚀 **{mn_best_es}** es el mejor mes (${best_sales:,.2f} en ventas)\n"
                answer += f"💡 Lanzar promociones en {mn_best_es} para aprovechar el momentum natural.\n\n"
                answer += f"⚠️ {mn_worst_es} es el mes más lento (${worst_sales:,.2f})\n"
                answer += f"💡 Considera promociones agresivas en {mn_worst_es} para estimular ventas."
            else:
                answer = f"📅 **Best month to launch promotions:**\n\n"
                answer += f"🚀 **{mn_best}** is the best month (${best_sales:,.2f} in sales)\n"
                answer += f"💡 Launch promotions in {mn_best} to leverage natural momentum.\n\n"
                answer += f"⚠️ {mn_worst} is the slowest month (${worst_sales:,.2f})\n"
                answer += f"💡 Consider aggressive promotions in {mn_worst} to stimulate sales."
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in promotion timing: {e}")
            return self._err(language), []

    async def _handle_product_acceptance(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze which products have the best customer acceptance."""
        try:
            products = self.db.get_products(limit=100)
            if not products:
                return self._no_data("products", language), []
            
            # Calculate acceptance metrics: high sales + high frequency
            acceptance_scores = []
            for p in products:
                sales = float(p.get('total_sales', 0))
                quantity = float(p.get('quantity_sold', 1))
                avg_price = sales / quantity if quantity > 0 else 0
                # Acceptance = frequency (quantity) + consistency (low variance)
                acceptance = quantity * (1 + (sales / max(float(p.get('total_sales', 1)), 1)))
                acceptance_scores.append((p['name'], acceptance, quantity, sales))
            
            acceptance_scores.sort(key=lambda x: x[1], reverse=True)
            top_products = acceptance_scores[:3]
            
            if language == Language.SPANISH:
                answer = f"✨ **Productos con mejor aceptación:**\n\n"
                for i, (name, score, qty, sales) in enumerate(top_products, 1):
                    answer += f"{i}. **{name}**\n"
                    answer += f"   • Unidades vendidas: {int(qty)}\n"
                    answer += f"   • Ingresos: ${sales:,.2f}\n\n"
            else:
                answer = f"✨ **Products with best acceptance:**\n\n"
                for i, (name, score, qty, sales) in enumerate(top_products, 1):
                    answer += f"{i}. **{name}**\n"
                    answer += f"   • Units sold: {int(qty)}\n"
                    answer += f"   • Revenue: ${sales:,.2f}\n\n"
            
            return answer, [DB_PRODUCTS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in product acceptance: {e}")
            return self._err(language), []

    async def _handle_premium_segment_targeting(self, language: Language) -> Tuple[str, List[str]]:
        """Identify which segment should be targeted with premium products."""
        try:
            customers = self.db.get_customers(limit=1000)
            if not customers:
                return self._no_data("customers", language), []
            
            # Find segment with highest average purchase value
            segment_stats = {}
            for c in customers:
                seg = c.get('segment', 'Unknown')
                purchases = float(c.get('total_purchases', 0))
                if seg not in segment_stats:
                    segment_stats[seg] = {'total': 0, 'count': 0}
                segment_stats[seg]['total'] += purchases
                segment_stats[seg]['count'] += 1
            
            segment_avg = {seg: data['total'] / data['count'] for seg, data in segment_stats.items()}
            premium_segment = max(segment_avg, key=segment_avg.get)
            premium_value = segment_avg[premium_segment]
            
            if language == Language.SPANISH:
                answer = f"💎 **Segmento para vender productos más caros:**\n\n"
                answer += f"🎯 **{premium_segment}** es el segmento premium\n"
                answer += f"💰 Valor promedio por cliente: ${premium_value:,.2f}\n\n"
                answer += f"💡 Este segmento tiene mayor capacidad de compra.\n"
                answer += f"📈 Recomendación: Ofrece productos premium a este segmento."
            else:
                answer = f"💎 **Segment for selling premium products:**\n\n"
                answer += f"🎯 **{premium_segment}** is the premium segment\n"
                answer += f"💰 Average customer value: ${premium_value:,.2f}\n\n"
                answer += f"💡 This segment has higher purchasing power.\n"
                answer += f"📈 Recommendation: Offer premium products to this segment."
            
            return answer, [DB_CUSTOMERS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in premium segment targeting: {e}")
            return self._err(language), []

    # ═══════════════════════════════════════════════════════════════════════════════
    # ACCOUNTING ANALYSIS SUB-METHODS
    # ═══════════════════════════════════════════════════════════════════════════════

    async def _handle_negative_profit_months(self, language: Language) -> Tuple[str, List[str]]:
        """Find months with negative profit."""
        try:
            metrics = self.db.get_sales_metrics()
            if not metrics:
                return self._no_data("sales", language), []
            
            negative_months = []
            for m in metrics:
                profit = float(m.get('profit', 0))
                if profit < 0:
                    negative_months.append((m['month'], m['year'], profit))
            
            negative_months.sort(key=lambda x: x[2])
            
            if language == Language.SPANISH:
                answer = f"❌ **Meses con utilidad negativa:**\n\n"
                if negative_months:
                    for month, year, profit in negative_months:
                        mn = MONTH_NAMES_ES[month]
                        answer += f"• {mn} {year}: Pérdida de ${abs(profit):,.2f}\n"
                else:
                    answer = "✅ ¡Excelente! No hay meses con pérdidas."
            else:
                answer = f"❌ **Months with negative profit:**\n\n"
                if negative_months:
                    for month, year, profit in negative_months:
                        mn = MONTH_NAMES_EN[month]
                        answer += f"• {mn} {year}: Loss of ${abs(profit):,.2f}\n"
                else:
                    answer = "✅ Great! No months with losses."
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in negative profit months: {e}")
            return self._err(language), []

    async def _handle_cost_growth_analysis(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze if costs are growing faster than sales."""
        try:
            metrics = self.db.get_sales_metrics()
            if not metrics or len(metrics) < 2:
                return self._no_data("sales", language), []
            
            # Calculate growth rates
            sales_list = [float(m['total_sales']) for m in metrics]
            costs_list = [float(m['total_costs']) for m in metrics]
            
            sales_growth = ((sales_list[0] - sales_list[-1]) / sales_list[-1] * 100) if sales_list[-1] > 0 else 0
            costs_growth = ((costs_list[0] - costs_list[-1]) / costs_list[-1] * 100) if costs_list[-1] > 0 else 0
            
            if language == Language.SPANISH:
                answer = f"📊 **Análisis de crecimiento de costos vs ventas:**\n\n"
                answer += f"📈 Crecimiento de ventas: {sales_growth:+.1f}%\n"
                answer += f"📈 Crecimiento de costos: {costs_growth:+.1f}%\n\n"
                
                if costs_growth > sales_growth:
                    answer += f"⚠️ **Los costos crecen más rápido que las ventas**\n"
                    answer += f"Diferencia: {costs_growth - sales_growth:.1f}%\n"
                    answer += f"💡 Necesitas optimizar costos o aumentar ventas."
                else:
                    answer += f"✅ **Las ventas crecen más rápido que los costos**\n"
                    answer += f"Diferencia: {sales_growth - costs_growth:.1f}%\n"
                    answer += f"💡 Buena tendencia de rentabilidad."
            else:
                answer = f"📊 **Cost vs Sales growth analysis:**\n\n"
                answer += f"📈 Sales growth: {sales_growth:+.1f}%\n"
                answer += f"📈 Cost growth: {costs_growth:+.1f}%\n\n"
                
                if costs_growth > sales_growth:
                    answer += f"⚠️ **Costs are growing faster than sales**\n"
                    answer += f"Difference: {costs_growth - sales_growth:.1f}%\n"
                    answer += f"💡 You need to optimize costs or increase sales."
                else:
                    answer += f"✅ **Sales are growing faster than costs**\n"
                    answer += f"Difference: {sales_growth - costs_growth:.1f}%\n"
                    answer += f"💡 Good profitability trend."
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in cost growth analysis: {e}")
            return self._err(language), []

    async def _handle_most_profitable_year(self, language: Language) -> Tuple[str, List[str]]:
        """Find the most profitable year."""
        try:
            metrics = self.db.get_sales_metrics()
            if not metrics:
                return self._no_data("sales", language), []
            
            # Group by year
            year_profits = {}
            for m in metrics:
                year = m['year']
                profit = float(m.get('profit', 0))
                if year not in year_profits:
                    year_profits[year] = 0
                year_profits[year] += profit
            
            best_year = max(year_profits, key=year_profits.get)
            best_profit = year_profits[best_year]
            
            if language == Language.SPANISH:
                answer = f"🏆 **Año más rentable:**\n\n"
                answer += f"**{best_year}** fue el mejor año\n"
                answer += f"💰 Ganancia total: ${best_profit:,.2f}\n\n"
                answer += f"📊 Comparación de años:\n"
                for year in sorted(year_profits.keys(), reverse=True):
                    answer += f"• {year}: ${year_profits[year]:,.2f}\n"
            else:
                answer = f"🏆 **Most profitable year:**\n\n"
                answer += f"**{best_year}** was the best year\n"
                answer += f"💰 Total profit: ${best_profit:,.2f}\n\n"
                answer += f"📊 Year comparison:\n"
                for year in sorted(year_profits.keys(), reverse=True):
                    answer += f"• {year}: ${year_profits[year]:,.2f}\n"
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in most profitable year: {e}")
            return self._err(language), []

    async def _handle_cost_reduction_scenarios(self, language: Language) -> Tuple[str, List[str]]:
        """Calculate how much costs need to be reduced to be profitable."""
        try:
            metrics = self.db.get_sales_metrics()
            if not metrics:
                return self._no_data("sales", language), []
            
            recent = metrics[0]
            sales = float(recent['total_sales'])
            costs = float(recent['total_costs'])
            profit = float(recent['profit'])
            
            if profit > 0:
                if language == Language.SPANISH:
                    answer = f"✅ **Ya estamos en positivo**\n\n"
                    answer += f"Ganancia actual: ${profit:,.2f}\n"
                    answer += f"Margen: {(profit/sales*100):.1f}%"
                else:
                    answer = f"✅ **Already profitable**\n\n"
                    answer += f"Current profit: ${profit:,.2f}\n"
                    answer += f"Margin: {(profit/sales*100):.1f}%"
            else:
                reduction_needed = abs(profit)
                reduction_percent = (reduction_needed / costs * 100) if costs > 0 else 0
                
                if language == Language.SPANISH:
                    answer = f"❌ **Necesitamos reducir costos para ser rentables**\n\n"
                    answer += f"Pérdida actual: ${abs(profit):,.2f}\n"
                    answer += f"Costos actuales: ${costs:,.2f}\n\n"
                    answer += f"📉 **Opciones para quedar en positivo:**\n"
                    answer += f"1. Reducir costos en ${reduction_needed:,.2f} ({reduction_percent:.1f}%)\n"
                    answer += f"2. Aumentar ventas en ${reduction_needed:,.2f}\n"
                    answer += f"3. Combinación de ambas estrategias"
                else:
                    answer = f"❌ **We need to reduce costs to be profitable**\n\n"
                    answer += f"Current loss: ${abs(profit):,.2f}\n"
                    answer += f"Current costs: ${costs:,.2f}\n\n"
                    answer += f"📉 **Options to become profitable:**\n"
                    answer += f"1. Reduce costs by ${reduction_needed:,.2f} ({reduction_percent:.1f}%)\n"
                    answer += f"2. Increase sales by ${reduction_needed:,.2f}\n"
                    answer += f"3. Combination of both strategies"
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in cost reduction scenarios: {e}")
            return self._err(language), []

    async def _handle_money_flow_analysis(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze where the money is going."""
        try:
            metrics = self.db.get_sales_metrics()
            if not metrics:
                return self._no_data("sales", language), []
            
            recent = metrics[0]
            sales = float(recent['total_sales'])
            costs = float(recent['total_costs'])
            profit = float(recent['profit'])
            
            cost_percent = (costs / sales * 100) if sales > 0 else 0
            profit_percent = (profit / sales * 100) if sales > 0 else 0
            
            if language == Language.SPANISH:
                answer = f"💸 **Análisis de flujo de dinero:**\n\n"
                answer += f"📊 De cada $100 de ventas:\n"
                answer += f"• ${cost_percent:.2f} se va en costos y gastos\n"
                answer += f"• ${profit_percent:.2f} queda como ganancia\n\n"
                
                if cost_percent > 80:
                    answer += f"⚠️ **Alerta**: Los costos son muy altos ({cost_percent:.1f}%)\n"
                    answer += f"💡 Necesitas optimizar operaciones o aumentar precios."
                elif cost_percent > 60:
                    answer += f"⚠️ **Atención**: Los costos están en nivel moderado ({cost_percent:.1f}%)\n"
                    answer += f"💡 Hay margen para mejorar."
                else:
                    answer += f"✅ **Bueno**: Los costos están controlados ({cost_percent:.1f}%)\n"
                    answer += f"💡 Mantén esta eficiencia."
            else:
                answer = f"💸 **Money flow analysis:**\n\n"
                answer += f"📊 For every $100 in sales:\n"
                answer += f"• ${cost_percent:.2f} goes to costs and expenses\n"
                answer += f"• ${profit_percent:.2f} remains as profit\n\n"
                
                if cost_percent > 80:
                    answer += f"⚠️ **Alert**: Costs are very high ({cost_percent:.1f}%)\n"
                    answer += f"💡 You need to optimize operations or increase prices."
                elif cost_percent > 60:
                    answer += f"⚠️ **Attention**: Costs are at moderate level ({cost_percent:.1f}%)\n"
                    answer += f"💡 There's room for improvement."
                else:
                    answer += f"✅ **Good**: Costs are controlled ({cost_percent:.1f}%)\n"
                    answer += f"💡 Maintain this efficiency."
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in money flow analysis: {e}")
            return self._err(language), []

    async def _handle_profit_vs_sales_analysis(self, language: Language) -> Tuple[str, List[str]]:
        """Analyze if we're earning or just selling a lot."""
        try:
            metrics = self.db.get_sales_metrics()
            if not metrics:
                return self._no_data("sales", language), []
            
            recent = metrics[0]
            sales = float(recent['total_sales'])
            profit = float(recent['profit'])
            profit_margin = (profit / sales * 100) if sales > 0 else 0
            
            if language == Language.SPANISH:
                answer = f"💰 **¿Estamos ganando o solo vendiendo mucho?**\n\n"
                answer += f"📊 Análisis del mes:\n"
                answer += f"• Ventas: ${sales:,.2f}\n"
                answer += f"• Ganancia: ${profit:,.2f}\n"
                answer += f"• Margen: {profit_margin:.1f}%\n\n"
                
                if profit_margin > 20:
                    answer += f"✅ **¡Excelente!** Estamos ganando bien\n"
                    answer += f"Por cada $100 vendidos, ganamos ${profit_margin:.1f}"
                elif profit_margin > 10:
                    answer += f"⚠️ **Moderado** Vendemos mucho pero ganamos poco\n"
                    answer += f"Por cada $100 vendidos, ganamos solo ${profit_margin:.1f}"
                else:
                    answer += f"❌ **Problema** Solo estamos vendiendo, no ganando\n"
                    answer += f"Por cada $100 vendidos, ganamos solo ${profit_margin:.1f}"
            else:
                answer = f"💰 **Are we earning or just selling a lot?**\n\n"
                answer += f"📊 Month analysis:\n"
                answer += f"• Sales: ${sales:,.2f}\n"
                answer += f"• Profit: ${profit:,.2f}\n"
                answer += f"• Margin: {profit_margin:.1f}%\n\n"
                
                if profit_margin > 20:
                    answer += f"✅ **Excellent!** We're earning well\n"
                    answer += f"For every $100 sold, we earn ${profit_margin:.1f}"
                elif profit_margin > 10:
                    answer += f"⚠️ **Moderate** We sell a lot but earn little\n"
                    answer += f"For every $100 sold, we earn only ${profit_margin:.1f}"
                else:
                    answer += f"❌ **Problem** We're just selling, not earning\n"
                    answer += f"For every $100 sold, we earn only ${profit_margin:.1f}"
            
            return answer, [DB_BUSINESS_METRICS]
        except Exception as e:
            logger.error(f"Error in profit vs sales analysis: {e}")
            return self._err(language), []

    async def _handle_highest_transaction(self, language: Language) -> Tuple[str, List[str]]:
        """Handle: ¿Cuál fue la factura o venta más alta?"""
        try:
            transaction = self.db.get_highest_transaction()
            if not transaction:
                return self._no_data("transactions", language), []
            
            date_str = transaction.get('transaction_date', 'Unknown')
            
            if language == Language.SPANISH:
                return (
                    f"💰 **Venta más alta registrada:**\n\n"
                    f"📊 Detalles:\n"
                    f"• Monto: ${transaction['total_amount']:,.2f}\n"
                    f"• Cliente: {transaction['customer_name']}\n"
                    f"• Producto: {transaction['product_name']}\n"
                    f"• Cantidad: {transaction['quantity']} unidades\n"
                    f"• Fecha: {date_str}\n\n"
                    f"✨ Esta es la transacción individual más grande en nuestro historial.",
                    [DB_SALES_TRANSACTIONS, DB_CUSTOMERS, DB_PRODUCTS]
                )
            else:
                return (
                    f"💰 **Highest transaction recorded:**\n\n"
                    f"📊 Details:\n"
                    f"• Amount: ${transaction['total_amount']:,.2f}\n"
                    f"• Customer: {transaction['customer_name']}\n"
                    f"• Product: {transaction['product_name']}\n"
                    f"• Quantity: {transaction['quantity']} units\n"
                    f"• Date: {date_str}\n\n"
                    f"✨ This is the largest individual transaction in our history.",
                    [DB_SALES_TRANSACTIONS, DB_CUSTOMERS, DB_PRODUCTS]
                )
        except Exception as e:
            logger.error(f"Error in highest transaction handler: {e}")
            return self._err(language), []

    async def _handle_top_product_by_revenue(self, language: Language) -> Tuple[str, List[str]]:
        """Handle: ¿Qué producto se facturó más?"""
        try:
            products = self.db.get_top_products_by_revenue(limit=3)
            if not products:
                return self._no_data("products", language), []
            
            top = products[0]
            
            if language == Language.SPANISH:
                answer = f"🏆 **Producto más facturado:**\n\n"
                answer += f"📦 {top['name']}\n"
                answer += f"• Categoría: {top['category']}\n"
                answer += f"• Ingresos totales: ${top['total_revenue']:,.2f}\n"
                answer += f"• Unidades vendidas: {int(top['total_units'])}\n"
                answer += f"• Precio unitario: ${top['price']:,.2f}\n"
                answer += f"• Margen: {top['margin_percentage']:.1f}%\n"
                answer += f"• Ganancia estimada: ${top['estimated_profit']:,.2f}\n"
                
                if len(products) > 1:
                    answer += f"\n📊 **Otros productos principales:**\n"
                    for i, p in enumerate(products[1:3], 2):
                        answer += f"{i}. {p['name']}: ${p['total_revenue']:,.2f}\n"
                
                return answer, [DB_PRODUCTS, DB_SALES_TRANSACTIONS]
            else:
                answer = f"🏆 **Top product by revenue:**\n\n"
                answer += f"📦 {top['name']}\n"
                answer += f"• Category: {top['category']}\n"
                answer += f"• Total revenue: ${top['total_revenue']:,.2f}\n"
                answer += f"• Units sold: {int(top['total_units'])}\n"
                answer += f"• Unit price: ${top['price']:,.2f}\n"
                answer += f"• Margin: {top['margin_percentage']:.1f}%\n"
                answer += f"• Estimated profit: ${top['estimated_profit']:,.2f}\n"
                
                if len(products) > 1:
                    answer += f"\n📊 **Other top products:**\n"
                    for i, p in enumerate(products[1:3], 2):
                        answer += f"{i}. {p['name']}: ${p['total_revenue']:,.2f}\n"
                
                return answer, [DB_PRODUCTS, DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in top product by revenue handler: {e}")
            return self._err(language), []

    async def _handle_sales_by_day(self, language: Language) -> Tuple[str, List[str]]:
        """Handle: ¿Qué día tuvimos más ventas?"""
        try:
            sales_by_day = self.db.get_sales_by_day()
            if not sales_by_day:
                return self._no_data("sales", language), []
            
            top_day = sales_by_day[0]
            
            if language == Language.SPANISH:
                answer = f"📅 **Día con más ventas:**\n\n"
                answer += f"📊 {top_day['sale_date']}\n"
                answer += f"• Ingresos: ${top_day['daily_revenue']:,.2f}\n"
                answer += f"• Transacciones: {top_day['transaction_count']}\n"
                answer += f"• Unidades vendidas: {int(top_day['daily_units'])}\n"
                answer += f"• Promedio por transacción: ${top_day['daily_revenue'] / top_day['transaction_count']:,.2f}\n"
                
                if len(sales_by_day) > 1:
                    answer += f"\n📈 **Otros días principales:**\n"
                    for i, day in enumerate(sales_by_day[1:4], 2):
                        answer += f"{i}. {day['sale_date']}: ${day['daily_revenue']:,.2f}\n"
                
                return answer, [DB_SALES_TRANSACTIONS]
            else:
                answer = f"📅 **Day with highest sales:**\n\n"
                answer += f"📊 {top_day['sale_date']}\n"
                answer += f"• Revenue: ${top_day['daily_revenue']:,.2f}\n"
                answer += f"• Transactions: {top_day['transaction_count']}\n"
                answer += f"• Units sold: {int(top_day['daily_units'])}\n"
                answer += f"• Average per transaction: ${top_day['daily_revenue'] / top_day['transaction_count']:,.2f}\n"
                
                if len(sales_by_day) > 1:
                    answer += f"\n📈 **Other top days:**\n"
                    for i, day in enumerate(sales_by_day[1:4], 2):
                        answer += f"{i}. {day['sale_date']}: ${day['daily_revenue']:,.2f}\n"
                
                return answer, [DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in sales by day handler: {e}")
            return self._err(language), []

    async def _handle_small_transactions(self, language: Language) -> Tuple[str, List[str]]:
        """Handle: ¿Hay ventas muy pequeñas que no valen la pena?"""
        try:
            small_txns = self.db.get_small_transactions(limit=5)
            if not small_txns:
                return self._no_data("transactions", language), []
            
            total_small = sum(float(t['total_amount']) for t in small_txns)
            avg_small = total_small / len(small_txns)
            
            # Get total sales for percentage calculation
            all_sales = self.db.get_sales_metrics()
            total_all_sales = sum(float(s['total_sales']) for s in all_sales) if all_sales else 1
            
            if language == Language.SPANISH:
                answer = f"💸 **Ventas muy pequeñas:**\n\n"
                answer += f"📊 Encontramos {len(small_txns)} transacciones pequeñas:\n\n"
                
                for i, txn in enumerate(small_txns[:3], 1):
                    answer += f"{i}. ${float(txn['total_amount']):,.2f} - {txn['product_name']} ({txn['customer_name']})\n"
                
                answer += f"\n💡 **Análisis:**\n"
                answer += f"• Monto promedio: ${avg_small:,.2f}\n"
                answer += f"• Total de estas ventas: ${total_small:,.2f}\n"
                answer += f"• Representan el {(total_small / total_all_sales) * 100:.2f}% del total\n"
                answer += f"\n⚠️ Considera si vale la pena procesar transacciones tan pequeñas."
                
                return answer, [DB_SALES_TRANSACTIONS, DB_PRODUCTS, DB_CUSTOMERS]
            else:
                answer = f"💸 **Small transactions:**\n\n"
                answer += f"📊 Found {len(small_txns)} small transactions:\n\n"
                
                for i, txn in enumerate(small_txns[:3], 1):
                    answer += f"{i}. ${float(txn['total_amount']):,.2f} - {txn['product_name']} ({txn['customer_name']})\n"
                
                answer += f"\n💡 **Analysis:**\n"
                answer += f"• Average amount: ${avg_small:,.2f}\n"
                answer += f"• Total of these sales: ${total_small:,.2f}\n"
                answer += f"• Represent {(total_small / total_all_sales) * 100:.2f}% of total\n"
                answer += f"\n⚠️ Consider if it's worth processing such small transactions."
                
                return answer, [DB_SALES_TRANSACTIONS, DB_PRODUCTS, DB_CUSTOMERS]
        except Exception as e:
            logger.error(f"Error in small transactions handler: {e}")
            return self._err(language), []

    async def _handle_monthly_sales_count(self, language: Language) -> Tuple[str, List[str]]:
        """Handle: ¿Cuántas ventas hicimos por mes?"""
        try:
            sales_by_month = self.db.get_sales_by_month()
            if not sales_by_month:
                return self._no_data("sales", language), []
            
            # Get last 12 months
            recent_months = sales_by_month[:12]
            
            if language == Language.SPANISH:
                answer = f"📊 **Ventas por mes (últimos 12 meses):**\n\n"
                
                for month_data in recent_months:
                    month_name = MONTH_NAMES_ES[month_data['month']]
                    answer += f"• {month_name} {month_data['year']}: {month_data['transaction_count']} transacciones (${month_data['monthly_revenue']:,.2f})\n"
                
                avg_txns = sum(m['transaction_count'] for m in recent_months) / len(recent_months)
                total_txns = sum(m['transaction_count'] for m in recent_months)
                
                answer += f"\n📈 **Resumen:**\n"
                answer += f"• Total de transacciones: {total_txns}\n"
                answer += f"• Promedio por mes: {avg_txns:.0f}\n"
                answer += f"• Ingresos totales: ${sum(m['monthly_revenue'] for m in recent_months):,.2f}\n"
                
                return answer, [DB_SALES_TRANSACTIONS]
            else:
                answer = f"📊 **Sales per month (last 12 months):**\n\n"
                
                for month_data in recent_months:
                    month_name = MONTH_NAMES_EN[month_data['month']]
                    answer += f"• {month_name} {month_data['year']}: {month_data['transaction_count']} transactions (${month_data['monthly_revenue']:,.2f})\n"
                
                avg_txns = sum(m['transaction_count'] for m in recent_months) / len(recent_months)
                total_txns = sum(m['transaction_count'] for m in recent_months)
                
                answer += f"\n📈 **Summary:**\n"
                answer += f"• Total transactions: {total_txns}\n"
                answer += f"• Average per month: {avg_txns:.0f}\n"
                answer += f"• Total revenue: ${sum(m['monthly_revenue'] for m in recent_months):,.2f}\n"
                
                return answer, [DB_SALES_TRANSACTIONS]
        except Exception as e:
            logger.error(f"Error in monthly sales count handler: {e}")
            return self._err(language), []
