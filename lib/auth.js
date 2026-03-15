import bcrypt from "bcryptjs";
import { db } from "./db";
export {
  ADMIN_SESSION_COOKIE,
  buildClearedSessionCookie,
  buildSessionCookie,
  createAdminSession,
  readAdminSession,
} from "./session";

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function clearAdminSession() {
  return "";
}

export async function verifyAdminLogin(username, password) {
  const adminUser = await db.adminUser.findUnique({
    where: { username },
  });

  if (!adminUser) {
    throw new Error("Invalid credentials");
  }

  const valid = await verifyPassword(password, adminUser.passwordHash);

  if (!valid) {
    throw new Error("Invalid credentials");
  }

  return { username: adminUser.username };
}
