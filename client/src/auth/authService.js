
import {
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
} from "aws-amplify/auth";

export async function login(email, password) {
  const result = await signIn({
    username: email,
    password,
  });

  // Handle MFA, email confirmation, password reset,
  // or other required steps if Cognito requests them.
  if (!result.isSignedIn) {
    return {
      isSignedIn: false,
      nextStep: result.nextStep,
    };
  }

  return { isSignedIn: true };
}

export async function logout() {
  await signOut();
}

export async function getAuthenticatedUser() {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

export async function getAccessToken() {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken;

  if (!token) {
    throw new Error("You must sign in first.");
  }

  return token.toString();
}
