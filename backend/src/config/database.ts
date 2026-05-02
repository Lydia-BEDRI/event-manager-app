import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readSecretFromFile } from './secrets';

dotenv.config();

const dbPassword =
  readSecretFromFile('DB_PASSWORD_FILE') ||
  process.env.DB_PASSWORD;

const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER!,
  password: dbPassword,
  database: process.env.DB_NAME!,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  charset: 'utf8mb4',
});

export default pool;