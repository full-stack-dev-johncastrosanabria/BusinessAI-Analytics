"""
Advanced Query Processor - Business Intelligence Assistant
Handles complex business queries in English and Spanish with real database data.
"""

import re
import logging
from typing import Tuple, List, Optional, Dict, Any
from chatbot.intent_classifier import AdvancedIntentClassifier, Intent, Language

logger = logging.getLogger(__name__)

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
        product_signals = [
            'product', 'products', 'producto', 'productos', 'item', 'items',
            'most sold', 'best selling', 'bestseller', 'top selling',
            'más vendido', 'más vendidos', 'más popular', 'más populares',
            'selling', 'vendido', 'vendidos', 'sku', 'catalog', 'catálogo',
            'categoría', 'categoria', 'category', 'categories',
            'which product', 'what product', 'qué producto', 'cuál producto',
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
        ]
        sales_signals = [
            'sales', 'revenue', 'ventas', 'ingresos', 'income', 'sold',
            'how much', 'cuánto', 'total sales', 'total ventas', 'profit',
            'ganancia', 'rentable', 'rentabilidad', 'margin', 'margen',
            'transactions', 'transacciones', 'worst month', 'best month',
            'peor mes', 'mejor mes', 'año pasado', 'last year', 'annual',
            'anual', 'trimestre', 'quarter', 'q1', 'q2', 'q3', 'q4',
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

            # ── Best / worst month ──
            is_best = any(w in q for w in ['best', 'mejor', 'highest', 'más alto',
                                           'top', 'peak', 'rentable', 'profitable'])
            is_worst = any(w in q for w in ['worst', 'peor', 'lowest', 'más bajo',
                                            'bottom', 'least'])
            if is_best or is_worst:
                bw = self.db.get_best_worst_months()
                key = 'best_month' if is_best else 'worst_month'
                rec = bw.get(key)
                if rec:
                    label_en = 'best' if is_best else 'worst'
                    label_es = 'mejor' if is_best else 'peor'
                    mn = MONTH_NAMES_EN[rec['month']]
                    mn_es = MONTH_NAMES_ES[rec['month']]
                    if language == Language.SPANISH:
                        return (
                            f"📊 El {label_es} mes fue **{mn_es} {rec['year']}**\n"
                            f"• Ganancia: ${rec['profit']:,.2f}\n\n"
                            f"💡 Esto se basa en el historial completo de métricas de negocio.",
                            ["database:business_metrics"]
                        )
                    return (
                        f"📊 The {label_en} performing month was **{mn} {rec['year']}**\n"
                        f"• Profit: ${rec['profit']:,.2f}\n\n"
                        f"💡 Based on the full history of business metrics.",
                        ["database:business_metrics"]
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
            date_info = self._extract_date_from_question(question)
            if date_info:
                year, month = date_info
                rec = self.db.get_sales_for_period(year, month)
                if rec:
                    mn = MONTH_NAMES_EN[month]
                    mn_es = MONTH_NAMES_ES[month]
                    margin = (rec['profit'] / rec['total_sales'] * 100) if rec['total_sales'] else 0
                    if language == Language.SPANISH:
                        return (
                            f"📅 Ventas de {mn_es} {year}:\n"
                            f"• Ventas Totales: ${rec['total_sales']:,.2f}\n"
                            f"• Costos Totales: ${rec['total_costs']:,.2f}\n"
                            f"• Ganancia: ${rec['profit']:,.2f}\n"
                            f"• Margen: {margin:.1f}%",
                            ["database:business_metrics"]
                        )
                    return (
                        f"📅 Sales for {mn} {year}:\n"
                        f"• Total Sales: ${rec['total_sales']:,.2f}\n"
                        f"• Total Costs: ${rec['total_costs']:,.2f}\n"
                        f"• Profit: ${rec['profit']:,.2f}\n"
                        f"• Margin: {margin:.1f}%",
                        ["database:business_metrics"]
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
            margin = (r['profit'] / r['total_sales'] * 100) if r['total_sales'] else 0
            mn = MONTH_NAMES_EN[r['month']]
            mn_es = MONTH_NAMES_ES[r['month']]
            if language == Language.SPANISH:
                return (
                    f"📊 Métricas más recientes — {mn_es} {r['year']}:\n"
                    f"• Ventas Totales: ${r['total_sales']:,.2f}\n"
                    f"• Costos Totales: ${r['total_costs']:,.2f}\n"
                    f"• Ganancia: ${r['profit']:,.2f}\n"
                    f"• Margen: {margin:.1f}%",
                    ["database:business_metrics"]
                )
            return (
                f"📊 Most recent metrics — {mn} {r['year']}:\n"
                f"• Total Sales: ${r['total_sales']:,.2f}\n"
                f"• Total Costs: ${r['total_costs']:,.2f}\n"
                f"• Profit: ${r['profit']:,.2f}\n"
                f"• Margin: {margin:.1f}%",
                ["database:business_metrics"]
            )
        except Exception as e:
            logger.error("Error in sales handler: %s", e)
            return self._err(language), []

    async def _handle_profit_analysis(self, question: str, language: Language) -> Tuple[str, List[str]]:
        return await self._handle_sales_metrics(question, language)

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
                    ["database:business_metrics"]
                )
            return (
                f"📈 Average profit margin: **{avg:.1f}%**\n"
                f"• Best month: {best:.1f}%\n"
                f"• Worst month: {worst:.1f}%\n"
                f"• Based on {len(margins)} months of data",
                ["database:business_metrics"]
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
                    ["database:business_metrics"]
                )
            return (
                f"📊 {q_num} {year} Summary ({len(found)} months):\n"
                f"• Total Sales: ${total_sales:,.2f}\n"
                f"• Total Costs: ${total_costs:,.2f}\n"
                f"• Profit: ${total_profit:,.2f}\n"
                f"• Margin: {margin:.1f}%",
                ["database:business_metrics"]
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
                    ["database:business_metrics"]
                )
            return (
                f"📊 Annual Summary {year} ({len(months_found)} months):\n"
                f"• Total Sales: ${total_sales:,.2f}\n"
                f"• Total Costs: ${total_costs:,.2f}\n"
                f"• Profit: ${total_profit:,.2f}\n"
                f"• Average Margin: {margin:.1f}%",
                ["database:business_metrics"]
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
                        ["database:sales_transactions"]
                    )
                return (
                    f"🔢 Transactions in {mn} {date_info[0]}: **{count}**",
                    ["database:sales_transactions"]
                )
            if language == Language.SPANISH:
                return (
                    f"🔢 Total de transacciones registradas: **{count}**",
                    ["database:sales_transactions"]
                )
            return (
                f"🔢 Total transactions on record: **{count}**",
                ["database:sales_transactions"]
            )
        except Exception as e:
            logger.error("Error in transaction count: %s", e)
            return self._err(language), []

    # ── Product handler ──────────────────────────────────────────────────────

    async def _handle_product_info(self, question: str, language: Language) -> Tuple[str, List[str]]:
        try:
            q = question.lower()

            # ── Category revenue breakdown ──
            if any(w in q for w in ['category', 'categoría', 'categoria', 'categories',
                                    'categorías', 'which category', 'qué categoría',
                                    'highest margin', 'most revenue', 'más ingresos']):
                return await self._handle_category_revenue(language)

            # ── Top / best / most sold ──
            if any(w in q for w in ['top', 'best', 'most sold', 'bestseller',
                                    'mejor', 'más vendido', 'principal',
                                    'which', 'cuál', 'what', 'qué', 'show',
                                    'list', 'lista', 'ranking']):
                top = self.db.get_top_products(limit=5)
                if top:
                    if language == Language.SPANISH:
                        ans = "🏆 Top 5 productos por ingresos:\n\n"
                        for i, p in enumerate(top, 1):
                            ans += (f"{i}. {p['name']}\n"
                                    f"   • Categoría: {p['category']}\n"
                                    f"   • Ingresos: ${p['total_revenue']:,.2f}\n\n")
                        ans += f"✨ Producto líder: **{top[0]['name']}**"
                    else:
                        ans = "🏆 Top 5 products by revenue:\n\n"
                        for i, p in enumerate(top, 1):
                            ans += (f"{i}. {p['name']}\n"
                                    f"   • Category: {p['category']}\n"
                                    f"   • Revenue: ${p['total_revenue']:,.2f}\n\n")
                        ans += f"✨ Top product: **{top[0]['name']}**"
                    return ans, ["database:products", "database:sales_transactions"]

            # ── Specific product search ──
            keywords = self._extract_product_keywords(question)
            for kw in keywords:
                matches = self.db.get_product_by_name(kw)
                if matches:
                    if len(matches) == 1:
                        p = matches[0]
                        if language == Language.SPANISH:
                            ans = (f"📦 {p['name']}\n"
                                   f"• Categoría: {p['category']}\n"
                                   f"• Precio: ${p['price']:,.2f}")
                        else:
                            ans = (f"📦 {p['name']}\n"
                                   f"• Category: {p['category']}\n"
                                   f"• Price: ${p['price']:,.2f}")
                    else:
                        names = ', '.join(p['name'] for p in matches[:5])
                        ans = f"Productos encontrados: {names}" if language == Language.SPANISH \
                              else f"Products found: {names}"
                    return ans, ["database:products"]

            # ── Default: catalog overview ──
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
                    ["database:products"]
                )
            return (
                f"📦 Catalog: {len(products)} products\n"
                f"Categories: {cat_str}\n\n"
                f"💡 Ask for top products or a specific category.",
                ["database:products"]
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
            return ans, ["database:products", "database:sales_transactions"]
        except Exception as e:
            logger.error("Error in category revenue: %s", e)
            return self._err(language), []

    # ── Customer handler ─────────────────────────────────────────────────────

    async def _handle_customer_info(self, question: str, language: Language) -> Tuple[str, List[str]]:
        try:
            q = question.lower()

            # ── Filter by country ──
            country = self._extract_country(q)
            if country:
                return await self._handle_customers_by_country(country, language)

            # ── Filter by segment ──
            segment = self._extract_segment(q)
            if segment:
                return await self._handle_customers_by_segment(segment, language)

            # ── Top customers by orders (transaction count) ──
            if any(w in q for w in ['orders', 'pedidos', 'transactions', 'transacciones',
                                    'most orders', 'más pedidos', 'most frequent',
                                    'más frecuente']):
                return await self._handle_top_customers_by_orders(language)

            # ── Top customers by spend / best customer ──
            if any(w in q for w in ['best', 'top', 'biggest', 'major', 'mejor',
                                    'principal', 'mayor', 'who', 'quién',
                                    'which', 'cuál', 'show', 'list', 'lista']):
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
                    return ans, ["database:customers", "database:sales_transactions"]

            # ── Count query ──
            if any(w in q for w in ['how many', 'cuántos', 'count', 'total',
                                    'number', 'número', 'cantidad']):
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
                return ans, ["database:customers"]

            # ── Default overview ──
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
                    ["database:customers"]
                )
            return (
                f"👥 Customer base: {len(customers)} customers\n"
                f"Segments: {seg_str}\n\n"
                f"💡 You can ask for top customers, customers by country or segment.",
                ["database:customers"]
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
            return ans, ["database:customers"]
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
            return ans, ["database:customers"]
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
            return ans, ["database:customers", "database:sales_transactions"]
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
                            ["database:business_metrics"]
                        )
                    return (
                        f"📊 Comparison: {mn1_en} {y1} vs {mn2_en} {y2}\n\n"
                        f"{'Period':15} {'Sales':>12} {'Profit':>12}\n"
                        f"{mn1_en+' '+str(y1):15} ${r1['total_sales']:>10,.0f} ${r1['profit']:>10,.0f}\n"
                        f"{mn2_en+' '+str(y2):15} ${r2['total_sales']:>10,.0f} ${r2['profit']:>10,.0f}\n\n"
                        f"{arrow} Sales change: {diff_pct:+.1f}% (${diff_sales:+,.0f})",
                        ["database:business_metrics"]
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
                return "No hay suficientes datos para analizar tendencias.", ["database:business_metrics"]
            return "Not enough data to analyze trends.", ["database:business_metrics"]

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
                ["database:business_metrics"]
            )
        return (
            f"📊 Trend — last {len(recent)} months:\n"
            f"{arrow_s} Sales: {sales_pct:+.1f}% vs {len(recent)} months ago\n"
            f"{arrow_p} Profit: {profit_pct:+.1f}% vs {len(recent)} months ago\n\n"
            f"Most recent ({MONTH_NAMES_EN[last['month']]} {last['year']}): "
            f"${last['total_sales']:,.0f} sales, ${last['profit']:,.0f} profit",
            ["database:business_metrics"]
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
                    "Puedo mostrarte datos internos de ventas y clientes.", ["database:business_metrics"])
        return ("External market analysis is not available. "
                "I can show you internal sales and customer data.", ["database:business_metrics"])

    async def _handle_competitive_intelligence(self, question: str, language: Language) -> Tuple[str, List[str]]:
        if language == Language.SPANISH:
            return ("No tengo datos de competidores. "
                    "Puedo mostrarte nuestro rendimiento interno.", ["database:business_metrics"])
        return ("No competitor data available. "
                "I can show you our internal performance.", ["database:business_metrics"])

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
                        'todo el', 'entire', 'completo', 'last year', 'año pasado',
                        'this year', 'este año']
        if not any(s in q for s in year_signals):
            return None
        m = re.search(r'\b(20\d{2})\b', q)
        if m:
            return int(m.group(1))
        # "last year" / "año pasado" → current year - 1
        if 'last year' in q or 'año pasado' in q:
            return 2025  # relative to current date context
        return None

    def _extract_quarter(self, question: str) -> Optional[Tuple[int, List[int]]]:
        """Return (year, [months]) for quarter queries like 'Q3 2023'."""
        q = question.lower()
        m = re.search(r'q([1-4])\s*(\d{4})', q)
        if not m:
            m = re.search(r'(\d{4})\s*q([1-4])', q)
            if m:
                year, qnum = int(m.group(1)), int(m.group(2))
            else:
                return None
        else:
            qnum, year = int(m.group(1)), int(m.group(2))
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
