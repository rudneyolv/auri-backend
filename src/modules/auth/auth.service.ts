import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { verify, type JwtHeader, type JwtPayload } from 'jsonwebtoken';
import JwksRsa, { JwksClient } from 'jwks-rsa';

@Injectable()
export class AuthService {
  private readonly issuer: string;
  private readonly jwksClient: JwksClient;

  constructor() {
    const supabaseProjectId = process.env.SUPABASE_PROJECT_ID;

    if (!supabaseProjectId) {
      throw new InternalServerErrorException(
        'A variavel de ambiente SUPABASE_PROJECT_ID precisa ser configurada.',
      );
    }
    //TODO: Remove hardcoded issuer
    this.issuer = `https://${supabaseProjectId}.supabase.co/auth/v1`;

    this.jwksClient = JwksRsa({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `${this.issuer}/.well-known/jwks.json`,
    });
  }

  private readonly getKey = (
    header: JwtHeader,
    callback: (error: Error | null, key?: string) => void,
  ): void => {
    if (!header.kid) {
      return callback(new Error('Missing key id.'));
    }

    this.jwksClient
      .getSigningKey(header.kid)
      .then((signingKey) => {
        callback(null, signingKey.getPublicKey());
      })
      .catch((error: unknown) => {
        callback(
          error instanceof Error
            ? error
            : new Error('Error fetching signing key.'),
        );
      });
  };

  private verifyJwt(token: string): Promise<JwtPayload> {
    return new Promise((resolve, reject) => {
      verify(
        token,
        this.getKey,
        { algorithms: ['ES256'], issuer: this.issuer },
        (error, payload) => {
          if (error) {
            return reject(error);
          }

          if (!payload || typeof payload === 'string') {
            return reject(new Error('Invalid websocket token payload.'));
          }

          resolve(payload);
        },
      );
    });
  }

  private assertValidPayload(payload: JwtPayload): void {
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new Error('Invalid websocket token payload.');
    }
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    const decodedToken = await this.verifyJwt(token);
    this.assertValidPayload(decodedToken);
    return decodedToken;
  }
}
