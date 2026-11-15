import pg from 'pg';

let pool: pg.Pool | null = null;

function connectionString(): string {
  const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
  if (!url) throw new Error('POSTGRES_URL is not set');
  // node-postgres now reads sslmode=require as full certificate verification,
  // which Supabase's pooler cert chain fails; this opts back into libpq's
  // "encrypt, don't verify the chain" behaviour, as the restaurant watcher
  // does. The menu endpoint only ever reads, so a read-only role is enough,
  // and is what the deployed POSTGRES_URL should point at.
  const parsed = new URL(url);
  parsed.searchParams.set('uselibpqcompat', 'true');
  return parsed.toString();
}

function getPool(): pg.Pool {
  pool ??= new pg.Pool({ connectionString: connectionString(), max: 2 });
  return pool;
}

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}
