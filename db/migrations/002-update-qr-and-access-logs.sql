-- Migration for databases created before signed QR access control was added.
-- New databases already receive this schema from db/init.sql.
USE eventmanager;

ALTER TABLE participations
    MODIFY qr_code VARCHAR(512) NULL;

ALTER TABLE access_logs
    MODIFY participation_id BIGINT UNSIGNED NULL,
    MODIFY zone_id BIGINT UNSIGNED NULL;

SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'access_logs'
      AND index_name = 'idx_access_logs_participation_zone_valid'
);

SET @create_index = IF(
    @index_exists = 0,
    'CREATE INDEX idx_access_logs_participation_zone_valid ON access_logs (participation_id, zone_id, is_valid)',
    'SELECT 1'
);

PREPARE statement FROM @create_index;
EXECUTE statement;
DEALLOCATE PREPARE statement;
