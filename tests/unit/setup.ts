import '@testing-library/jest-dom/vitest';
import { config } from 'dotenv';

// Prisma 사용 테스트가 DATABASE_URL을 읽을 수 있게.
config({ path: '.env' });
