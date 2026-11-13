require("dotenv").config();

const requiredEnv = [
  "AWS_REGION",
  "COGNITO_USER_POOL_ID",
  "COGNITO_CLIENT_ID",
  "COGNITO_CLIENT_SECRET",
  "COGNITO_DOMAIN",
  "COGNITO_CALLBACK_URL",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

const cognitoDomain = process.env.COGNITO_DOMAIN.replace(/\/$/, "");

const issuer = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`;

module.exports = {
  region: process.env.AWS_REGION,

  userPoolId: process.env.COGNITO_USER_POOL_ID,

  clientId: process.env.COGNITO_CLIENT_ID,

  clientSecret: process.env.COGNITO_CLIENT_SECRET,

  domain: cognitoDomain,

  callbackUrl: process.env.COGNITO_CALLBACK_URL,

  issuer,

  jwksUrl: `${issuer}/.well-known/jwks.json`,

  authorizationUrl: `${cognitoDomain}/oauth2/authorize`,

  tokenUrl: `${cognitoDomain}/oauth2/token`,

  logoutUrl: `${cognitoDomain}/logout`,
};