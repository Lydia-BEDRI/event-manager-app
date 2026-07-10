-- Drop legacy per-zone grants.
-- Access is now event-wide for approved participations, and each scan is a logged passage.
USE eventmanager;

DROP TABLE IF EXISTS zone_access;
