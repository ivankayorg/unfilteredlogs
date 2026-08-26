import { supabase } from "../lib/supabase";


/* ==========================================================
   UNFILTERED LOGS
   PASSWORD AUTH SERVICE
   ========================================================== */


export type CreateAccountInput = {
  username: string;
  email: string;
  password: string;
};


export function normalizeUsername(
  value: string,
) {
  return value
    .trim()
    .replace(/\s+/g, "_");
}


export function validateUsername(
  value: string,
) {
  const username =
    normalizeUsername(value);

  if (
    !/^[A-Za-z0-9_]{3,24}$/.test(
      username
    )
  ) {
    return "Username must be 3–24 characters using only letters, numbers, and underscores.";
  }

  return null;
}


export async function usernameAvailable(
  value: string,
) {
  const username =
    normalizeUsername(value);

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "is_username_available",
      {
        candidate:
          username,
      }
    );

  if (error) {
    throw error;
  }

  return Boolean(data);
}


export async function createPasswordAccount(
  input:
    CreateAccountInput,
) {
  const username =
    normalizeUsername(
      input.username
    );

  const usernameError =
    validateUsername(
      username
    );

  if (usernameError) {
    throw new Error(
      usernameError
    );
  }

  if (
    input.password.length <
    10
  ) {
    throw new Error(
      "Password must be at least 10 characters."
    );
  }

  const available =
    await usernameAvailable(
      username
    );

  if (!available) {
    throw new Error(
      "That username is already taken."
    );
  }

  const {
    data,
    error,
  } =
    await supabase.auth
      .signUp({
        email:
          input.email.trim(),

        password:
          input.password,

        options: {
          emailRedirectTo:
            `${window.location.origin}/login?confirmed=1`,

          data: {
            username,

            display_name:
              username,
          },
        },
      });

  if (error) {
    throw error;
  }

  return data;
}


export async function signInWithPassword(
  email: string,
  password: string,
) {
  const {
    data,
    error,
  } =
    await supabase.auth
      .signInWithPassword({
        email:
          email.trim(),

        password,
      });

  if (error) {
    if (
      error.message
        .toLowerCase()
        .includes(
          "email not confirmed"
        )
    ) {
      throw new Error(
        "Confirm your email before signing in."
      );
    }

    throw error;
  }

  return data;
}


export async function resendSignupConfirmation(
  email: string,
) {
  const {
    error,
  } =
    await supabase.auth
      .resend({
        type:
          "signup",

        email:
          email.trim(),

        options: {
          emailRedirectTo:
            `${window.location.origin}/login?confirmed=1`,
        },
      });

  if (error) {
    throw error;
  }
}
