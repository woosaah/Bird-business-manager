import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

/**
 * User login
 */
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Get user from database
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Store session
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await pool.query(
      `INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, tokenHash.substring(0, 255), req.ip, req.get('user-agent'), expiresAt]
    );

    // Return user info and token
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const result = await pool.query(
      'SELECT id, username, email, full_name, role, last_login, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
}

/**
 * Logout user
 */
export async function logout(req: AuthRequest, res: Response) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token && req.user) {
      // Remove session
      await pool.query(
        'DELETE FROM user_sessions WHERE user_id = $1',
        [req.user.id]
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
}

/**
 * Register new user (admin only)
 */
export async function register(req: AuthRequest, res: Response) {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can create users'
      });
    }

    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if username or email already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, full_name, role, created_at`,
      [username, email, passwordHash, full_name, role || 'staff']
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can view all users'
      });
    }

    const result = await pool.query(
      `SELECT id, username, email, full_name, role, is_active, last_login, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
}

/**
 * Update user (admin only)
 */
export async function updateUser(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can update users'
      });
    }

    const { id } = req.params;
    const { username, email, full_name, role, is_active, password } = req.body;

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (username !== undefined) {
      fields.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }

    if (email !== undefined) {
      fields.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (full_name !== undefined) {
      fields.push(`full_name = $${paramCount}`);
      values.push(full_name);
      paramCount++;
    }

    if (role !== undefined) {
      fields.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (is_active !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      fields.push(`password_hash = $${paramCount}`);
      values.push(passwordHash);
      paramCount++;
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    values.push(id);
    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, email, full_name, role, is_active
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can delete users'
      });
    }

    const { id } = req.params;

    // Prevent deleting yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    const result = await pool.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
}
