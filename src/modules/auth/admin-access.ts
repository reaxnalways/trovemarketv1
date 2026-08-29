export function parseAdminEmails(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(
  email: string | null | undefined,
  configuredEmails: string | undefined = process.env.TROVE_ADMIN_EMAILS,
): boolean {
  if (!email) {
    return false;
  }

  return parseAdminEmails(configuredEmails).has(email.trim().toLowerCase());
}
