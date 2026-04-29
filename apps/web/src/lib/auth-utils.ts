import { SignJWT, jwtVerify } from 'jose'
import { createPrivateKey, createPublicKey, randomBytes, createHash } from 'crypto'
import bcrypt from 'bcryptjs'

const ACCESS_EXPIRE_MINUTES = 15

function scopesForTier(tier: string): string[] {
  const base = ['humanize:write', 'scan:write']
  if (tier === 'pro' || tier === 'enterprise') base.push('batch:write', 'user:read')
  if (tier === 'enterprise') base.push('admin:read')
  return base
}

function privateKey() {
  const pem = (process.env.JWT_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
  return createPrivateKey(pem)
}

function publicKey() {
  const pem = (process.env.JWT_PUBLIC_KEY ?? '').replace(/\\n/g, '\n')
  return createPublicKey(pem)
}

export async function issueAccessToken(
  userId: string,
  email: string,
  tier: string,
  region: string,
): Promise<string> {
  return new SignJWT({
    email_hash: createHash('sha256').update(email).digest('hex'),
    tier,
    scopes: scopesForTier(tier),
    region,
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_EXPIRE_MINUTES}m`)
    .setJti(crypto.randomUUID())
    .sign(privateKey())
}

export async function verifyAccessToken(token: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(token, publicKey(), { algorithms: ['RS256'] })
  return payload as Record<string, unknown>
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url')
  const hash = createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}
