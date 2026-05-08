-- =============================================
-- MIGRATION: Add FULLTEXT Indexes for Search Optimization
-- Date: 2026-05-04
-- Description: Create FULLTEXT indexes on key columns to enhance search performance across events, users, zones, and messages.
-- =============================================

USE eventmanager;

-- Index FULLTEXT sur les événements (name, description, location)
ALTER TABLE events 
ADD FULLTEXT idx_fulltext_events (name, description, location);

-- Index FULLTEXT sur les utilisateurs (first_name, last_name, email)
ALTER TABLE users 
ADD FULLTEXT idx_fulltext_users (first_name, last_name, email);

-- Index FULLTEXT sur les zones (name, description)
ALTER TABLE zones 
ADD FULLTEXT idx_fulltext_zones (name, description);

-- Index FULLTEXT sur les messages (content)
ALTER TABLE messages 
ADD FULLTEXT idx_fulltext_messages (content);

-- Index simple pour optimiser les recherches filtrées
CREATE INDEX idx_events_deleted_status ON events(status) WHERE status != 'CANCELLED';
CREATE INDEX idx_zones_capacity ON zones(capacity);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_messages_event_deleted ON messages(event_id, is_deleted);
