-- V2__optimize_indexes.sql
-- Performance optimization indexes for production dashboard queries

ALTER TABLE orders ADD INDEX idx_order_created_at (created_at);
ALTER TABLE audit_logs ADD INDEX idx_audit_created_at (created_at);
