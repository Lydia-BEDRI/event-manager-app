import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readSecretFromFile } from './secrets';

dotenv.config();

const dbPassword = readSecretFromFile('DB_PASSWORD_FILE') || process.env.DB_PASSWORD || 'eventmanager123';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3307', 10),
  user: process.env.DB_USER || 'eventmanager',
  password: dbPassword,
  database: process.env.DB_NAME || 'eventmanager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  charset: 'utf8mb4',
  connectAttributes: {
    program_name: 'eventmanager-backend',
  },
});

pool.on('connection', (connection) => {
  connection.query('SET NAMES utf8mb4');
  connection.query('SET CHARACTER SET utf8mb4');
});

export default pool;
