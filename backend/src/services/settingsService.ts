import { prisma } from '../utils/prisma';

export interface SystemSettingsData {
  emailVerificationEnabled: boolean;
  passwordResetEnabled: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPasswordSet: boolean; // never expose the actual password to the client
  smtpFrom: string | null;
}

export interface UpdateSystemSettingsInput {
  emailVerificationEnabled?: boolean;
  passwordResetEnabled?: boolean;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPassword?: string | null; // null = clear, undefined = keep existing
  smtpFrom?: string | null;
}

const SINGLETON_ID = 'singleton';

export const getSettings = async (): Promise<SystemSettingsData> => {
  const row = await prisma.systemSettings.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });

  return {
    emailVerificationEnabled: row.emailVerificationEnabled,
    passwordResetEnabled: row.passwordResetEnabled,
    smtpHost: row.smtpHost,
    smtpPort: row.smtpPort,
    smtpUser: row.smtpUser,
    smtpPasswordSet: Boolean(row.smtpPassword),
    smtpFrom: row.smtpFrom,
  };
};

export const updateSettings = async (
  input: UpdateSystemSettingsInput
): Promise<SystemSettingsData> => {
  const data: Record<string, unknown> = {};

  if (input.emailVerificationEnabled !== undefined) {
    data.emailVerificationEnabled = input.emailVerificationEnabled;
  }
  if (input.passwordResetEnabled !== undefined) {
    data.passwordResetEnabled = input.passwordResetEnabled;
  }
  if ('smtpHost' in input) data.smtpHost = input.smtpHost ?? null;
  if ('smtpPort' in input) data.smtpPort = input.smtpPort ?? null;
  if ('smtpUser' in input) data.smtpUser = input.smtpUser ?? null;
  if ('smtpPassword' in input) data.smtpPassword = input.smtpPassword ?? null;
  if ('smtpFrom' in input) data.smtpFrom = input.smtpFrom ?? null;

  const row = await prisma.systemSettings.upsert({
    where: { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...data },
  });

  return {
    emailVerificationEnabled: row.emailVerificationEnabled,
    passwordResetEnabled: row.passwordResetEnabled,
    smtpHost: row.smtpHost,
    smtpPort: row.smtpPort,
    smtpUser: row.smtpUser,
    smtpPasswordSet: Boolean(row.smtpPassword),
    smtpFrom: row.smtpFrom,
  };
};
