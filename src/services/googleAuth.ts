declare const google: any;

const CLIENT_ID = (import.meta as any).env.VITE_CLIENT_ID;

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send',
].join(' ');

let accessToken: string | null = null;
let tokenExpiry: number = 0;

export const getAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error('VITE_CLIENT_ID is not configured in .env'));
      return;
    }

    // Check cache
    if (accessToken && Date.now() < tokenExpiry) {
      resolve(accessToken);
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            accessToken = response.access_token;
            // Response typically includes expires_in (seconds)
            tokenExpiry = Date.now() + (response.expires_in || 3600) * 1000;
            resolve(accessToken);
          } else {
            reject(new Error('Failed to get access token: ' + (response.error || 'Unknown error')));
          }
        },
      });
      client.requestAccessToken();
    } catch (error) {
      reject(error);
    }
  });
};

export const logout = () => {
  accessToken = null;
  tokenExpiry = 0;
};
