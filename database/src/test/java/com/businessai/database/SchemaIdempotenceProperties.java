package com.businessai.database;

import net.jqwik.api.*;
import org.junit.jupiter.api.BeforeAll;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.*;
import java.util.*;

/**
 * Property-based tests for database schema idempotence.
 * 
 * **Validates: Requirements 16.6**
 */
public class SchemaIdempotenceProperties {

    private static final String DB_URL = "jdbc:mysql://localhost:3306/";
    private static final String DB_USER = System.getenv().getOrDefault("DB_USER", "root");
    private static final String DB_PASSWORD = System.getenv().getOrDefault("DB_PASSWORD", "");
    private static final String SCHEMA_FILE = "schema.sql";
    private static boolean databaseAvailable;

    @BeforeAll
    static void checkDatabaseConnection() {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            databaseAvailable = true;
        } catch (SQLException e) {
            databaseAvailable = false;
        }
    }

    /**
     * Property 21: Schema Script Idempotence
     * 
     * For any database state, running the schema creation script multiple times 
     * SHALL result in the same final schema without errors, regardless of whether 
     * tables already exist.
     * 
     * **Validates: Requirements 16.6**
     */
    @Property(tries = 10)
    void schemaScriptIsIdempotent(@ForAll("executionCounts") int executionCount) {
        if (!databaseAvailable) {
            return;
        }

        String testDbName = "test_businessai_" + System.currentTimeMillis();
        boolean testDatabaseCreated = false;
        
        try {
            // Create a fresh test database
            createTestDatabase(testDbName);
            testDatabaseCreated = true;
            
            // Capture schema state after each execution
            Map<String, TableSchema> firstRunSchema = null;
            Map<String, TableSchema> previousSchema = null;
            
            // Execute schema script multiple times
            for (int i = 1; i <= executionCount; i++) {
                executeSchemaScript(testDbName);
                
                Map<String, TableSchema> currentSchema = captureSchemaState(testDbName);
                
                if (i == 1) {
                    firstRunSchema = currentSchema;
                } else {
                    // Verify schema hasn't changed from first run
                    assertSchemasEqual(firstRunSchema, currentSchema, 
                        "Schema changed after execution " + i);
                }
                
                previousSchema = currentSchema;
            }
            
            // Verify all expected tables exist
            verifyExpectedTables(previousSchema);
            
        } catch (SQLException | IOException e) {
            throw new RuntimeException("Schema idempotence test failed: " + e.getMessage(), e);
        } finally {
            // Cleanup: drop test database
            if (testDatabaseCreated) {
                try {
                    dropTestDatabase(testDbName);
                } catch (SQLException e) {
                    throw new IllegalStateException("Failed to cleanup test database: " + testDbName, e);
                }
            }
        }
    }

    @Provide
    Arbitrary<Integer> executionCounts() {
        // Test running the schema script 2-5 times
        return Arbitraries.integers().between(2, 5);
    }

    private void createTestDatabase(String dbName) throws SQLException {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE DATABASE IF NOT EXISTS " + dbName);
        }
    }

    private void dropTestDatabase(String dbName) throws SQLException {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             Statement stmt = conn.createStatement()) {
            stmt.execute("DROP DATABASE IF EXISTS " + dbName);
        }
    }

    private void executeSchemaScript(String dbName) throws SQLException, IOException {
        String schemaContent = Files.readString(Paths.get(SCHEMA_FILE));
        
        // Split by semicolon and execute each statement
        String[] statements = schemaContent.split(";");
        
        try (Connection conn = DriverManager.getConnection(DB_URL + dbName, DB_USER, DB_PASSWORD);
             Statement stmt = conn.createStatement()) {
            
            for (String sql : statements) {
                String trimmedSql = sql.trim();
                if (!trimmedSql.isEmpty() && !trimmedSql.startsWith("--")) {
                    try {
                        stmt.execute(trimmedSql);
                    } catch (SQLException e) {
                        // Ignore SELECT statements that return results
                        if (!trimmedSql.toUpperCase().startsWith("SELECT")) {
                            throw e;
                        }
                    }
                }
            }
        }
    }

    private Map<String, TableSchema> captureSchemaState(String dbName) throws SQLException {
        Map<String, TableSchema> schemas = new HashMap<>();
        
        try (Connection conn = DriverManager.getConnection(DB_URL + dbName, DB_USER, DB_PASSWORD)) {
            DatabaseMetaData metaData = conn.getMetaData();
            
            // Get all tables
            try (ResultSet tables = metaData.getTables(dbName, null, "%", new String[]{"TABLE"})) {
                while (tables.next()) {
                    String tableName = tables.getString("TABLE_NAME");
                    TableSchema tableSchema = new TableSchema(tableName);
                    
                    // Get columns
                    try (ResultSet columns = metaData.getColumns(dbName, null, tableName, "%")) {
                        while (columns.next()) {
                            String columnName = columns.getString("COLUMN_NAME");
                            String columnType = columns.getString("TYPE_NAME");
                            int columnSize = columns.getInt("COLUMN_SIZE");
                            String isNullable = columns.getString("IS_NULLABLE");
                            
                            tableSchema.addColumn(new ColumnInfo(columnName, columnType, columnSize, isNullable));
                        }
                    }
                    
                    // Get primary keys
                    try (ResultSet pks = metaData.getPrimaryKeys(dbName, null, tableName)) {
                        while (pks.next()) {
                            tableSchema.addPrimaryKey(pks.getString("COLUMN_NAME"));
                        }
                    }
                    
                    // Get foreign keys
                    try (ResultSet fks = metaData.getImportedKeys(dbName, null, tableName)) {
                        while (fks.next()) {
                            String fkColumn = fks.getString("FKCOLUMN_NAME");
                            String pkTable = fks.getString("PKTABLE_NAME");
                            String pkColumn = fks.getString("PKCOLUMN_NAME");
                            
                            tableSchema.addForeignKey(new ForeignKeyInfo(fkColumn, pkTable, pkColumn));
                        }
                    }
                    
                    // Get indexes
                    try (ResultSet indexes = metaData.getIndexInfo(dbName, null, tableName, false, false)) {
                        while (indexes.next()) {
                            String indexName = indexes.getString("INDEX_NAME");
                            if (indexName != null && !indexName.equals("PRIMARY")) {
                                String columnName = indexes.getString("COLUMN_NAME");
                                boolean nonUnique = indexes.getBoolean("NON_UNIQUE");
                                
                                tableSchema.addIndex(new IndexInfo(indexName, columnName, !nonUnique));
                            }
                        }
                    }
                    
                    schemas.put(tableName, tableSchema);
                }
            }
        }
        
        return schemas;
    }

    private void assertSchemasEqual(Map<String, TableSchema> expected, 
                                   Map<String, TableSchema> actual, 
                                   String message) {
        if (!expected.keySet().equals(actual.keySet())) {
            throw new AssertionError(message + ": Table sets differ. Expected: " + 
                expected.keySet() + ", Actual: " + actual.keySet());
        }
        
        for (String tableName : expected.keySet()) {
            TableSchema expectedTable = expected.get(tableName);
            TableSchema actualTable = actual.get(tableName);
            
            if (!expectedTable.equals(actualTable)) {
                throw new AssertionError(message + ": Table '" + tableName + 
                    "' schema differs.\nExpected: " + expectedTable + 
                    "\nActual: " + actualTable);
            }
        }
    }

    private void verifyExpectedTables(Map<String, TableSchema> schema) {
        List<String> expectedTables = Arrays.asList(
            "products", "customers", "sales_transactions", 
            "business_metrics", "documents"
        );
        
        for (String expectedTable : expectedTables) {
            if (!schema.containsKey(expectedTable)) {
                throw new AssertionError("Expected table '" + expectedTable + "' not found in schema");
            }
        }
    }

    // Helper classes for schema representation
    
    static class TableSchema {
        private final String name;
        private final List<ColumnInfo> columns = new ArrayList<>();
        private final List<String> primaryKeys = new ArrayList<>();
        private final List<ForeignKeyInfo> foreignKeys = new ArrayList<>();
        private final List<IndexInfo> indexes = new ArrayList<>();
        
        public TableSchema(String name) {
            this.name = name;
        }
        
        public void addColumn(ColumnInfo column) {
            columns.add(column);
        }
        
        public void addPrimaryKey(String columnName) {
            primaryKeys.add(columnName);
        }
        
        public void addForeignKey(ForeignKeyInfo fk) {
            foreignKeys.add(fk);
        }
        
        public void addIndex(IndexInfo index) {
            indexes.add(index);
        }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            TableSchema that = (TableSchema) o;
            return Objects.equals(name, that.name) &&
                   Objects.equals(columns, that.columns) &&
                   Objects.equals(primaryKeys, that.primaryKeys) &&
                   Objects.equals(foreignKeys, that.foreignKeys) &&
                   Objects.equals(indexes, that.indexes);
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(name, columns, primaryKeys, foreignKeys, indexes);
        }
        
        @Override
        public String toString() {
            return "TableSchema{name='" + name + "', columns=" + columns + 
                   ", primaryKeys=" + primaryKeys + ", foreignKeys=" + foreignKeys + 
                   ", indexes=" + indexes + "}";
        }
    }
    
    static class ColumnInfo {
        private final String name;
        private final String type;
        private final int size;
        private final String nullable;
        
        public ColumnInfo(String name, String type, int size, String nullable) {
            this.name = name;
            this.type = type;
            this.size = size;
            this.nullable = nullable;
        }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            ColumnInfo that = (ColumnInfo) o;
            return size == that.size &&
                   Objects.equals(name, that.name) &&
                   Objects.equals(type, that.type) &&
                   Objects.equals(nullable, that.nullable);
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(name, type, size, nullable);
        }
        
        @Override
        public String toString() {
            return "ColumnInfo{name='" + name + "', type='" + type + 
                   "', size=" + size + ", nullable='" + nullable + "'}";
        }
    }
    
    static class ForeignKeyInfo {
        private final String columnName;
        private final String referencedTable;
        private final String referencedColumn;
        
        public ForeignKeyInfo(String columnName, String referencedTable, String referencedColumn) {
            this.columnName = columnName;
            this.referencedTable = referencedTable;
            this.referencedColumn = referencedColumn;
        }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            ForeignKeyInfo that = (ForeignKeyInfo) o;
            return Objects.equals(columnName, that.columnName) &&
                   Objects.equals(referencedTable, that.referencedTable) &&
                   Objects.equals(referencedColumn, that.referencedColumn);
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(columnName, referencedTable, referencedColumn);
        }
        
        @Override
        public String toString() {
            return "ForeignKeyInfo{columnName='" + columnName + 
                   "', referencedTable='" + referencedTable + 
                   "', referencedColumn='" + referencedColumn + "'}";
        }
    }
    
    static class IndexInfo {
        private final String name;
        private final String columnName;
        private final boolean unique;
        
        public IndexInfo(String name, String columnName, boolean unique) {
            this.name = name;
            this.columnName = columnName;
            this.unique = unique;
        }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            IndexInfo that = (IndexInfo) o;
            return unique == that.unique &&
                   Objects.equals(name, that.name) &&
                   Objects.equals(columnName, that.columnName);
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(name, columnName, unique);
        }
        
        @Override
        public String toString() {
            return "IndexInfo{name='" + name + "', columnName='" + columnName + 
                   "', unique=" + unique + "}";
        }
    }
}
