import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeychangeinprod';

export default async function authRoutes(server: FastifyInstance) {
  
  // Register
  server.post('/auth/register', async (request, reply) => {
    const { name, email, password } = request.body as any;

    if (!name || !email || !password) {
      return reply.code(400).send({ error: 'Missing fields' });
    }

    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return reply.code(400).send({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const returning = await db.insert(users).values({
        name,
        email,
        password: hashedPassword
      }).returning({ id: users.id, name: users.name, email: users.email });

      return reply.code(201).send({ user: returning[0] });
    } catch (e) {
      server.log.error(e);
      return reply.code(500).send({ error: 'Database error' });
    }
  });

  // Login
  server.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body as any;

    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user[0].password);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user[0].id, email: user[0].email }, JWT_SECRET, { expiresIn: '7d' });

    return { 
      token, 
      user: { id: user[0].id, name: user[0].name, email: user[0].email } 
    };
  });

  // Profile (Protected)
  // Simple custom auth middleware for now
  server.get('/auth/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) return reply.code(401).send({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
      
      if (user.length === 0) return reply.code(404).send({ error: 'User not found' });
      
      const { password, ...safeUser } = user[0];
      return { user: safeUser };
    } catch (e) {
       return reply.code(401).send({ error: 'Invalid token' });
    }
  });
}
