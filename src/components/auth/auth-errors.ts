/** Friendly error mapping for Supabase auth errors. */
export function mapAuthError(err: unknown): string {
  if (!err) return "Something went wrong. Please try again.";
  const raw =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Authentication failed";
  const msg = raw.toLowerCase();
  if (msg.includes("invalid login") || msg.includes("invalid_credentials")) {
    return "Wrong email or password.";
  }
  if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
    return "Please confirm your email — check your inbox for the link.";
  }
  if (msg.includes("user already registered") || msg.includes("already registered")) {
    return "An account with this email already exists. Try signing in.";
  }
  if (msg.includes("rate limit") || msg.includes("over_email_send_rate_limit")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (msg.includes("provider is not enabled") || msg.includes("unsupported provider")) {
    return "This sign-in provider isn't enabled yet.";
  }
  if (msg.includes("password should be") || msg.includes("weak password")) {
    return "That password is too weak — use at least 8 characters with a letter and a number.";
  }
  if (msg.includes("token has expired") || msg.includes("otp_expired")) {
    return "That link expired. Request a new one.";
  }
  return raw;
}

export function sanitizeRedirect(input: string | undefined | null): string {
  if (!input) return "/";
  // Must be a single-slash relative path. Reject:
  //  - anything not starting with "/"
  //  - protocol-relative "//host"
  //  - backslash tricks "/\host" (some browsers normalize to //host)
  //  - any candidate that smuggles a scheme like javascript:/data:
  if (!input.startsWith("/")) return "/";
  if (input.startsWith("//") || input.startsWith("/\\")) return "/";
  if (input.includes(":")) return "/";
  // Cap length to keep search params bounded.
  return input.length > 512 ? "/" : input;
}

export const POST_AUTH_REDIRECT_KEY = "jobion.postAuthRedirect";
