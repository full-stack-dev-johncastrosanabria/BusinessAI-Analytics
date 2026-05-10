#!/usr/bin/env python3
"""Export the BusinessAI MySQL dataset to static JSON and CSV files."""

from __future__ import annotations

import argparse
import csv
import json
import os
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

import mysql.connector


DEFAULT_OUTPUT_DIR = Path("frontend/public/data")

DATASETS = {
    "products": """
        SELECT
            id,
            name,
            category,
            cost,
            price
        FROM products
        ORDER BY id
    """,
    "customers": """
        SELECT
            id,
            name,
            email,
            segment,
            country
        FROM customers
        ORDER BY id
    """,
    "sales-transactions": """
        SELECT
            id,
            customer_id AS customerId,
            product_id AS productId,
            transaction_date AS transactionDate,
            quantity,
            total_amount AS totalAmount
        FROM sales_transactions
        ORDER BY transaction_date, id
    """,
    "business-metrics": """
        SELECT
            id,
            month,
            year,
            total_sales AS totalSales,
            total_costs AS totalCosts,
            total_expenses AS totalExpenses,
            profit
        FROM business_metrics
        ORDER BY year, month
    """,
}


def json_default(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value


def normalize_row(row: dict[str, Any]) -> dict[str, Any]:
    return {key: json_default(value) for key, value in row.items()}


def write_json(path: Path, rows: Any) -> None:
    path.write_text(json.dumps(rows, indent=2, default=json_default) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        path.write_text("", encoding="utf-8")
        return

    with path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def build_dashboard(rows: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    metrics = rows["business-metrics"]
    products = rows["products"]
    transactions = rows["sales-transactions"]

    total_sales = sum(float(metric["totalSales"]) for metric in metrics)
    total_costs = sum(float(metric["totalCosts"]) for metric in metrics)
    total_profit = sum(float(metric["profit"]) for metric in metrics)
    best_month = max(metrics, key=lambda metric: float(metric["profit"]), default=None)
    worst_month = min(metrics, key=lambda metric: float(metric["profit"]), default=None)

    product_lookup = {product["id"]: product for product in products}
    revenue_by_product: dict[int, float] = {}
    for transaction in transactions:
        product_id = int(transaction["productId"])
        revenue_by_product[product_id] = revenue_by_product.get(product_id, 0.0) + float(
            transaction["totalAmount"]
        )

    top_products = []
    for product_id, revenue in sorted(
        revenue_by_product.items(), key=lambda item: item[1], reverse=True
    )[:5]:
        product = product_lookup.get(product_id, {})
        top_products.append(
            {
                "id": product_id,
                "name": product.get("name", f"Product {product_id}"),
                "category": product.get("category", "Unknown"),
                "totalRevenue": round(revenue, 2),
            }
        )

    return {
        "totalSales": round(total_sales, 2),
        "totalCosts": round(total_costs, 2),
        "totalProfit": round(total_profit, 2),
        "bestMonth": format_month_summary(best_month),
        "worstMonth": format_month_summary(worst_month),
        "topProducts": top_products,
    }


def format_month_summary(metric: dict[str, Any] | None) -> dict[str, Any]:
    if not metric:
        return {"month": 0, "year": 0, "profit": 0}
    return {
        "month": metric["month"],
        "year": metric["year"],
        "profit": metric["profit"],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default=os.getenv("MYSQL_HOST", "localhost"))
    parser.add_argument("--port", type=int, default=int(os.getenv("MYSQL_PORT", "3306")))
    parser.add_argument("--user", default=os.getenv("MYSQL_USER", "root"))
    parser.add_argument("--password", default=os.getenv("MYSQL_PASSWORD", ""))
    parser.add_argument("--database", default=os.getenv("MYSQL_DATABASE", "businessai"))
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    connection = mysql.connector.connect(
        host=args.host,
        port=args.port,
        user=args.user,
        password=args.password,
        database=args.database,
    )

    exported_rows: dict[str, list[dict[str, Any]]] = {}
    try:
        cursor = connection.cursor(dictionary=True)
        for dataset_name, query in DATASETS.items():
            cursor.execute(query)
            rows = [normalize_row(row) for row in cursor.fetchall()]
            exported_rows[dataset_name] = rows
            write_json(output_dir / f"{dataset_name}.json", rows)
            write_csv(output_dir / f"{dataset_name}.csv", rows)
            print(f"Exported {dataset_name}: {len(rows)} rows")

        dashboard = build_dashboard(exported_rows)
        write_json(output_dir / "dashboard.json", dashboard)
        print("Exported dashboard: 1 summary")
    finally:
        connection.close()


if __name__ == "__main__":
    main()
