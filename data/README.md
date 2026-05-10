# Static dataset

Run this command from the repository root to export MySQL data for GitHub Pages:

```bash
MYSQL_PASSWORD='your_password' python3 database/export_static_dataset.py
```

The exporter writes JSON and CSV files for products, customers, sales transactions,
business metrics, documents, and the dashboard summary.
