import type { Role } from '@ish-maydoni/shared';

export interface UserRecord {
  id: string;
  login: string;
  fullName: string;
  position: string;
  department: string;
  role: Role;
  passwordHash: string;
}
