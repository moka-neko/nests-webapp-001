export const generateSecret = jest.fn(() => 'JBSWY3DPEHPK3PXP');

export const generateURI = jest.fn(
  ({ issuer, label, secret }: { issuer: string; label: string; secret: string }) =>
    `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}`,
);

export const verify = jest.fn(async ({ token }: { token: string }) => ({
  valid: token === '123456',
}));

export const generate = jest.fn(async () => '123456');
