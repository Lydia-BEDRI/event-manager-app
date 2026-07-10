SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET CHARACTER SET utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;

USE eventmanager;

SET @pwd = '$2b$12$bGvWrifjQwqVm2Ewz96Tu.0XAepCuXA2X9RXFp7x2/6hUECz07NsK';

-- =============================================
-- USERS
-- =============================================

INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, password_updated_at) VALUES
('admin@eventmanager.fr', @pwd, 'Alice', 'Martin', 'ADMIN', TRUE, NOW()),
('organiser@eventmanager.fr', @pwd, 'Bob', 'Dupont', 'ADMIN', TRUE, NOW()),
('participant1@eventmanager.fr', @pwd, 'Charlie', 'Durand', 'PARTICIPANT', TRUE, NOW()),
('participant2@eventmanager.fr', @pwd, 'Diana', 'Leroy', 'PARTICIPANT', TRUE, NOW()),
('participant3@eventmanager.fr', @pwd, 'Éric', 'Moreau', 'PARTICIPANT', TRUE, NOW());

-- =============================================
-- EVENTS
-- =============================================

INSERT INTO events (name, description, location, start_date, end_date, capacity, status, created_by) VALUES
('Conférence Tech 2026', 'Conférence annuelle sur les nouvelles technologies.', 'Paris - La Défense', '2026-04-15 09:00:00', '2026-04-15 18:00:00', 200, 'PUBLISHED', 1),
('Team Building Été', 'Journée de cohésion d''équipe avec activités sportives.', 'Lyon - Parc de la Tête d''Or', '2026-06-20 10:00:00', '2026-06-20 17:00:00', 50, 'DRAFT', 1),
('Séminaire IA & Data', 'Séminaire sur l''intelligence artificielle appliquée.', 'Marseille - Palais des Congrès', '2026-05-10 08:30:00', '2026-05-11 17:00:00', 150, 'PUBLISHED', 2);

-- =============================================
-- ZONES
-- =============================================

INSERT INTO zones (event_id, name, description, capacity) VALUES
(1, 'Hall Principal', 'Accueil et keynotes', 200),
(1, 'Salle Workshop A', 'Ateliers pratiques', 40),
(1, 'Salle Workshop B', 'Ateliers pratiques', 40),
(1, 'Espace Networking', 'Pause café et réseautage', 100),
(2, 'Terrain Sportif', 'Activités extérieures', 50),
(2, 'Salle de Réception', 'Déjeuner et remise de prix', 50),
(3, 'Amphithéâtre', 'Présentations principales', 150),
(3, 'Lab IA', 'Démos et ateliers IA', 30),
(3, 'Espace Poster', 'Présentations poster', 60);

-- =============================================
-- PARTICIPATIONS
-- =============================================

INSERT INTO participations (user_id, event_id, status, qr_code, approved_by, approved_at) VALUES
(3, 1, 'APPROVED', NULL, 1, NOW()),
(4, 1, 'APPROVED', NULL, 1, NOW()),
(5, 1, 'PENDING', NULL, NULL, NULL),
(3, 3, 'APPROVED', NULL, 2, NOW()),
(4, 3, 'REFUSED', NULL, 2, NOW());

-- =============================================
-- ACCESS LOGS
-- =============================================

INSERT INTO access_logs (participation_id, zone_id, scanned_by, scanned_at, is_valid, ip_address) VALUES
(1, 1, 1, '2026-04-15 08:45:00', TRUE, '192.168.1.10'),
(2, 1, 1, '2026-04-15 08:50:00', TRUE, '192.168.1.10'),
(1, 2, 1, '2026-04-15 10:05:00', TRUE, '192.168.1.11');

-- =============================================
-- MESSAGES
-- =============================================

INSERT INTO messages (event_id, user_id, content) VALUES
(1, 3, 'Bonjour à tous, hâte d''y être !'),
(1, 4, 'Quelqu''un sait si le workshop React est complet ?'),
(1, 1, 'Bienvenue à tous ! N''hésitez pas à poser vos questions ici.'),
(3, 3, 'Le programme du séminaire est dispo quelque part ?');

-- =============================================
-- NOTIFICATIONS
-- =============================================

INSERT INTO notifications (user_id, title, body, type, reference_type, reference_id) VALUES
(3, 'Participation approuvée', 'Votre participation à "Conférence Tech 2026" a été approuvée.', 'PARTICIPATION_APPROVED', 'participation', 1),
(4, 'Participation approuvée', 'Votre participation à "Conférence Tech 2026" a été approuvée.', 'PARTICIPATION_APPROVED', 'participation', 2),
(5, 'Demande en attente', 'Votre demande pour "Conférence Tech 2026" est en cours de traitement.', 'SYSTEM', 'participation', 3);

-- =============================================
-- AUDIT LOGS
-- =============================================

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES
(1, 'CREATE', 'event', 1, '192.168.1.1'),
(1, 'CREATE', 'event', 2, '192.168.1.1'),
(2, 'CREATE', 'event', 3, '192.168.1.2'),
(1, 'APPROVE_PARTICIPATION', 'participation', 1, '192.168.1.1'),
(1, 'APPROVE_PARTICIPATION', 'participation', 2, '192.168.1.1');
