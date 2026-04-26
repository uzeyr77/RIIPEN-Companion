import { google } from "googleapis";
import { env } from "../../config/env";

export function createGoogleOAuthClient(refreshToken?: string) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );

  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }
  return oauth2Client;
}
