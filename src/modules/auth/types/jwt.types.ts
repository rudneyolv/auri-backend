export interface AuthJwtPayload {
  iss: string; // issuer
  sub: string; // supabase user id
  aud: string; // audience, ex: 'authenticated'
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
  email: string;
  phone: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: {
    email: string;
    email_verified: boolean;
    phone_verified: boolean;
    sub: string;
  };
  role: string; // user role, ex: 'authenticated'
  aal: string; // authentication assurance level
  amr: Array<{
    method: string;
    timestamp: number;
  }>;
  session_id: string;
  is_anonymous: boolean;
}
