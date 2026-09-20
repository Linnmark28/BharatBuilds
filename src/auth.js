// Cognito sign-up / sign-in for citizens. Disabled (authEnabled = false) until
// VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID are set, so the demo
// keeps working without a backend.
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
} from "amazon-cognito-identity-js";

const USER_POOL_ID = import.meta.env?.VITE_COGNITO_USER_POOL_ID || "";
const CLIENT_ID = import.meta.env?.VITE_COGNITO_CLIENT_ID || "";

export const authEnabled = Boolean(USER_POOL_ID && CLIENT_ID);
const pool = authEnabled ? new CognitoUserPool({ UserPoolId: USER_POOL_ID, ClientId: CLIENT_ID }) : null;

// Indian mobile numbers only; Cognito wants E.164 (+91XXXXXXXXXX).
export function toE164(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

export function userFromSession(session) {
  const claims = session.getIdToken().decodePayload();
  return {
    id: claims.sub,
    email: claims.email,
    name: claims.name,
    phone: claims.phone_number || null,
    wardId: claims["custom:ward_id"] || null,
    pincode: claims["custom:pincode"] || null,
  };
}

export function friendlyError(error) {
  switch (error?.code || error?.name) {
    case "UsernameExistsException":
      return "An account with this email already exists. Try logging in.";
    case "InvalidPasswordException":
      return "Password must be at least 8 characters with upper case, lower case and a number.";
    case "CodeMismatchException":
      return "That code is not right. Check the latest email and try again.";
    case "ExpiredCodeException":
      return "That code has expired. Request a new one.";
    case "NotAuthorizedException":
      return "Incorrect email or password.";
    case "LimitExceededException":
    case "TooManyRequestsException":
    case "TooManyFailedAttemptsException":
      return "Too many attempts. Wait a few minutes and try again.";
    case "InvalidParameterException":
      return error.message || "One of the details was not accepted.";
    default:
      return "Something went wrong. Please try again.";
  }
}

const cognitoUser = (email) => new CognitoUser({ Username: email.trim().toLowerCase(), Pool: pool });

export const signUp = ({ name, email, password, phone, wardId, pincode }) =>
  new Promise((resolve, reject) => {
    const attributes = [
      ["email", email.trim().toLowerCase()],
      ["name", name.trim()],
      ["custom:ward_id", wardId],
      ["custom:pincode", pincode],
    ];
    const e164 = toE164(phone);
    if (e164) attributes.push(["phone_number", e164]);
    pool.signUp(
      email.trim().toLowerCase(),
      password,
      attributes.map(([Name, Value]) => new CognitoUserAttribute({ Name, Value })),
      null,
      (error, result) => (error ? reject(error) : resolve(result)),
    );
  });

export const confirmSignUp = (email, code) =>
  new Promise((resolve, reject) => {
    cognitoUser(email).confirmRegistration(code.trim(), true, (error) => (error ? reject(error) : resolve()));
  });

export const resendCode = (email) =>
  new Promise((resolve, reject) => {
    cognitoUser(email).resendConfirmationCode((error) => (error ? reject(error) : resolve()));
  });

export const signIn = (email, password) =>
  new Promise((resolve, reject) => {
    cognitoUser(email).authenticateUser(
      new AuthenticationDetails({ Username: email.trim().toLowerCase(), Password: password }),
      {
        onSuccess: (session) => resolve(userFromSession(session)),
        onFailure: reject,
        newPasswordRequired: () => reject(new Error("A new password is required for this account.")),
      },
    );
  });

// Resolves to { user, idToken } for a still-valid saved session, otherwise null.
export const restoreSession = () =>
  new Promise((resolve) => {
    const current = pool?.getCurrentUser();
    if (!current) return resolve(null);
    current.getSession((error, session) => {
      if (error || !session?.isValid()) return resolve(null);
      resolve({ user: userFromSession(session), idToken: session.getIdToken().getJwtToken() });
    });
  });

// A fresh ID token (the library refreshes it from the refresh token when needed).
export const getIdToken = async () => (await restoreSession())?.idToken ?? null;

export const signOut = () => pool?.getCurrentUser()?.signOut();
