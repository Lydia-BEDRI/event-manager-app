import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

const parseNumbers = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(parseNumbers);
  }
  if (obj instanceof Date) {
    return obj;
  }
  if (obj && typeof obj === 'object') {
    const parsed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value instanceof Date) {
        parsed[key] = value;
      } else if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
        parsed[key] = Number(value);
      } else if (value && typeof value === 'object') {
        parsed[key] = parseNumbers(value);
      } else {
        parsed[key] = value;
      }
    }
    return parsed;
  }
  return obj;
};

// GET /api/admin/dashboard-stats
export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  try {
    const [eventStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_events,
        SUM(CASE WHEN status = 'PUBLISHED' THEN 1 ELSE 0 END) as published_events,
        SUM(CASE WHEN status = 'ONGOING' THEN 1 ELSE 0 END) as ongoing_events,
        SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft_events,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_events,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_events,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) 
                 AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as events_this_month
      FROM events
    `);

    const [fillRateStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COALESCE(ROUND(AVG((approved_count * 100.0) / NULLIF(capacity, 0)), 2), 0) as average_fill_rate
      FROM (
        SELECT 
          e.capacity,
          COUNT(CASE WHEN p.status = 'APPROVED' THEN 1 END) as approved_count
        FROM events e
        LEFT JOIN participations p ON e.id = p.event_id
        WHERE e.status IN ('PUBLISHED', 'ONGOING', 'COMPLETED')
        GROUP BY e.id, e.capacity
      ) as event_fills
    `);

    const [zonesPerEvent] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COALESCE(ROUND(AVG(zone_count), 1), 0) as avg_zones_per_event
      FROM (
        SELECT event_id, COUNT(*) as zone_count
        FROM zones
        GROUP BY event_id
      ) as zone_counts
    `);

    const [attendanceByEvent] = await pool.query<RowDataPacket[]>(`
      SELECT 
        e.id,
        e.name,
        e.status,
        COUNT(DISTINCT p.id) as total_approved,
        COUNT(DISTINCT al.participation_id) as attended,
        COALESCE(ROUND((COUNT(DISTINCT al.participation_id) * 100.0) / NULLIF(COUNT(DISTINCT p.id), 0), 2), 0) as attendance_rate
      FROM events e
      LEFT JOIN participations p ON e.id = p.event_id AND p.status = 'APPROVED'
      LEFT JOIN access_logs al ON p.id = al.participation_id
      WHERE e.status IN ('ONGOING', 'COMPLETED')
      GROUP BY e.id, e.name, e.status
      ORDER BY attendance_rate DESC
    `);

    const [participantStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_participants,
        SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as total_admins,
        SUM(CASE WHEN role = 'PARTICIPANT' THEN 1 ELSE 0 END) as total_users,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) 
                 AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as new_this_month
      FROM users
    `);

    const [approvalRate] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
        COALESCE(ROUND((SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(*), 0), 2), 0) as approval_rate
      FROM participations
    `);

    const [avgParticipation] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COALESCE(ROUND(AVG(participant_count), 1), 0) as avg_participants_per_event
      FROM (
        SELECT event_id, COUNT(*) as participant_count
        FROM participations
        WHERE status = 'APPROVED'
        GROUP BY event_id
      ) as event_participants
    `);

    const [accessStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_scans,
        SUM(CASE WHEN DATE(scanned_at) = CURRENT_DATE() THEN 1 ELSE 0 END) as scans_today,
        SUM(CASE WHEN is_valid = TRUE THEN 1 ELSE 0 END) as valid_scans,
        SUM(CASE WHEN is_valid = FALSE THEN 1 ELSE 0 END) as invalid_scans
      FROM access_logs
    `);

    const [accessByZone] = await pool.query<RowDataPacket[]>(`
      SELECT 
        z.id,
        z.name,
        e.name as event_name,
        z.capacity,
        COUNT(al.id) as total_scans,
        COUNT(DISTINCT al.participation_id) as unique_visitors,
        COALESCE(ROUND((COUNT(DISTINCT al.participation_id) * 100.0) / NULLIF(z.capacity, 0), 2), 0) as occupancy_rate
      FROM zones z
      JOIN events e ON z.event_id = e.id
      LEFT JOIN access_logs al ON z.id = al.zone_id
      GROUP BY z.id, z.name, e.name, z.capacity
      ORDER BY total_scans DESC
    `);

    const [peakHours] = await pool.query<RowDataPacket[]>(`
      SELECT 
        HOUR(scanned_at) as hour,
        COUNT(*) as scan_count
      FROM access_logs
      WHERE is_valid = TRUE
      GROUP BY HOUR(scanned_at)
      ORDER BY scan_count DESC
    `);

    const [avgScansPerEvent] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COALESCE(ROUND(AVG(scan_count), 1), 0) as avg_scans_per_event
      FROM (
        SELECT e.id, COUNT(al.id) as scan_count
        FROM events e
        LEFT JOIN participations p ON e.id = p.event_id
        LEFT JOIN access_logs al ON p.id = al.participation_id
        GROUP BY e.id
      ) as event_scans
    `);

    const [zoneStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_zones,
        SUM(capacity) as total_capacity,
        COALESCE(ROUND(AVG(capacity), 0), 0) as avg_capacity
      FROM zones
    `);

    const [topZones] = await pool.query<RowDataPacket[]>(`
      SELECT 
        z.id,
        z.name,
        e.name as event_name,
        z.capacity,
        COUNT(DISTINCT al.participation_id) as unique_visitors,
        COUNT(al.id) as total_visits
      FROM zones z
      JOIN events e ON z.event_id = e.id
      LEFT JOIN access_logs al ON z.id = al.zone_id
      GROUP BY z.id, z.name, e.name, z.capacity
      ORDER BY unique_visitors DESC
      LIMIT 5
    `);

    const [zoneDistribution] = await pool.query<RowDataPacket[]>(`
      SELECT 
        z.name as zone_name,
        COUNT(DISTINCT za.participation_id) as authorized_participants
      FROM zones z
      LEFT JOIN zone_access za ON z.id = za.zone_id
      GROUP BY z.id, z.name
      ORDER BY authorized_participants DESC
    `);

    const [messageStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(DISTINCT user_id) as active_chat_users,
        SUM(CASE WHEN DATE(created_at) = CURRENT_DATE() THEN 1 ELSE 0 END) as messages_today,
        SUM(CASE WHEN is_moderated = TRUE THEN 1 ELSE 0 END) as moderated_messages
      FROM messages
      WHERE is_deleted = FALSE
    `);

    const [actionsByType] = await pool.query<RowDataPacket[]>(`
      SELECT 
        action,
        COUNT(*) as count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC
    `);

    const [actionsByAdmin] = await pool.query<RowDataPacket[]>(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(al.id) as action_count
      FROM users u
      JOIN audit_logs al ON u.id = al.user_id
      WHERE u.role = 'ADMIN'
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY action_count DESC
    `);

    const [notificationStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_notifications,
        SUM(CASE WHEN is_read = TRUE THEN 1 ELSE 0 END) as read_notifications,
        SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread_notifications,
        type,
        COUNT(*) as count_by_type
      FROM notifications
      GROUP BY type
    `);

    const [notificationSummary] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_read = TRUE THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread_count
      FROM notifications
    `);

    const [exportStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_exports,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_exports,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_exports,
        SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) as processing_exports,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_exports
      FROM export_jobs
    `);

    const [recentExports] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ej.id,
        ej.type,
        ej.status,
        ej.created_at,
        ej.completed_at,
        u.first_name,
        u.last_name,
        e.name as event_name
      FROM export_jobs ej
      JOIN users u ON ej.requested_by = u.id
      LEFT JOIN events e ON ej.event_id = e.id
      ORDER BY ej.created_at DESC
      LIMIT 5
    `);

    const [participationRate] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COALESCE(
          ROUND(
            (SUM(CASE WHEN p.status = 'APPROVED' THEN 1 ELSE 0 END) * 100.0) / 
            NULLIF(SUM(e.capacity), 0), 
            2
          ), 
          0
        ) as global_participation_rate
      FROM events e
      LEFT JOIN participations p ON e.id = p.event_id
      WHERE e.status IN ('PUBLISHED', 'ONGOING', 'COMPLETED')
    `);

    const [avgValidationTime] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COALESCE(
          ROUND(
            AVG(TIMESTAMPDIFF(HOUR, p.created_at, p.approved_at)), 
            1
          ), 
          0
        ) as avg_validation_hours
      FROM participations p
      WHERE p.status = 'APPROVED' AND p.approved_at IS NOT NULL
    `);

    const [zoneFillRate] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COALESCE(
          ROUND(
            AVG((unique_visitors * 100.0) / NULLIF(capacity, 0)), 
            2
          ), 
          0
        ) as avg_zone_fill_rate
      FROM (
        SELECT 
          z.capacity,
          COUNT(DISTINCT al.participation_id) as unique_visitors
        FROM zones z
        LEFT JOIN access_logs al ON z.id = al.zone_id
        GROUP BY z.id, z.capacity
      ) as zone_fills
    `);

    const [participationStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_participations,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_participations,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_participations,
        SUM(CASE WHEN status = 'REFUSED' THEN 1 ELSE 0 END) as refused_participations
      FROM participations
    `);

    const [globalAttendanceRate] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COALESCE(
          ROUND(
            (COUNT(DISTINCT al.participation_id) * 100.0) / 
            NULLIF(COUNT(DISTINCT p.id), 0), 
            2
          ), 
          0
        ) as attendance_rate
      FROM participations p
      LEFT JOIN access_logs al ON p.id = al.participation_id
      WHERE p.status = 'APPROVED'
    `);

    const [upcomingEvents] = await pool.query<RowDataPacket[]>(`
      SELECT 
        e.id,
        e.name,
        e.start_date,
        e.end_date,
        e.capacity,
        e.location,
        e.status,
        COUNT(DISTINCT p.id) as participants_count,
        COUNT(DISTINCT CASE WHEN p.status = 'APPROVED' THEN p.id END) as approved_count
      FROM events e
      LEFT JOIN participations p ON e.id = p.event_id
      WHERE e.start_date >= CURRENT_DATE() AND e.status IN ('PUBLISHED', 'ONGOING')
      GROUP BY e.id
      ORDER BY e.start_date ASC
      LIMIT 3
    `);

    const [recentActivity] = await pool.query<RowDataPacket[]>(`
      SELECT 
        al.id,
        al.action,
        al.entity_type,
        al.created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

    const [pendingRequests] = await pool.query<RowDataPacket[]>(`
      SELECT 
        p.id,
        p.created_at,
        u.first_name,
        u.last_name,
        u.email,
        e.name as event_name,
        e.id as event_id
      FROM participations p
      JOIN users u ON p.user_id = u.id
      JOIN events e ON p.event_id = e.id
      WHERE p.status = 'PENDING'
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    res.status(200).json(parseNumbers({
      events: {
        ...eventStats[0],
        average_fill_rate: fillRateStats[0].average_fill_rate,
        avg_zones_per_event: zonesPerEvent[0].avg_zones_per_event,
      },
      attendanceByEvent,
      
      participants: {
        ...participantStats[0],
        approval_rate: approvalRate[0].approval_rate,
        avg_participants_per_event: avgParticipation[0].avg_participants_per_event,
      },
      approvalStats: approvalRate[0],
      
      participations: participationStats[0],
      
      access: {
        ...accessStats[0],
        avg_scans_per_event: avgScansPerEvent[0].avg_scans_per_event,
      },
      accessByZone,
      peakHours,
      
      zones: zoneStats[0],
      topZones,
      zoneDistribution,
      
      messages: messageStats[0],
      
      actionsByType,
      actionsByAdmin,
      notifications: {
        ...notificationSummary[0],
        byType: notificationStats,
      },
      exports: {
        ...exportStats[0],
        recent: recentExports,
      },
      
      kpis: {
        global_participation_rate: participationRate[0].global_participation_rate,
        avg_validation_hours: avgValidationTime[0].avg_validation_hours,
        avg_zone_fill_rate: zoneFillRate[0].avg_zone_fill_rate,
        attendance_rate: globalAttendanceRate[0].attendance_rate,
      },
      
      upcomingEvents,
      recentActivity,
      pendingRequests,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des statistiques.' });
  }
}
