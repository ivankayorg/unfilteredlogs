import {
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  CheckCircle2,
  Mail,
  UserRound,
} from "lucide-react";

import {
  createPasswordAccount,
  resendSignupConfirmation,
  signInWithPassword,
  validateUsername,
} from "../../services/auth";

import "./PasswordAuthForm.css";


/* ==========================================================
   UNFILTERED LOG
   EMAIL / PASSWORD AUTH
   ========================================================== */


type Mode =
  | "signin"
  | "create";


function getPasswordAuthReturnTo() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const requested =
    params.get(
      "returnTo"
    );

  if (
    !requested ||
    !requested.startsWith("/") ||
    requested.startsWith("//")
  ) {
    return "/";
  }

  return requested;
}


export default function PasswordAuthForm() {
  const [
    mode,
    setMode,
  ] =
    useState<Mode>(
      "signin"
    );

  const [
    username,
    setUsername,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    success,
    setSuccess,
  ] =
    useState<string | null>(
      null
    );

  const [
    awaitingConfirmation,
    setAwaitingConfirmation,
  ] =
    useState(false);


  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      params.get(
        "confirmed"
      ) === "1"
    ) {
      setSuccess(
        "Email confirmed. You can sign in now."
      );
    }
  }, []);


  const switchMode =
    (
      nextMode:
        Mode
    ) => {
      setMode(
        nextMode
      );

      setError(null);
      setSuccess(null);
      setAwaitingConfirmation(
        false
      );
    };


  const submit =
    async () => {
      setBusy(true);
      setError(null);
      setSuccess(null);

      try {
        if (
          mode ===
          "signin"
        ) {
          await signInWithPassword(
            email,
            password
          );

          window.location.assign(
            getPasswordAuthReturnTo()
          );

          return;
        }

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
          password !==
          confirmPassword
        ) {
          throw new Error(
            "Passwords do not match."
          );
        }

        const result =
          await createPasswordAccount(
            {
              username,
              email,
              password,
            }
          );

        if (
          result.session
        ) {
          window.location.assign(
            getPasswordAuthReturnTo()
          );

          return;
        }

        setAwaitingConfirmation(
          true
        );

        setSuccess(
          "Account created. Check your email and click the confirmation link before signing in."
        );
      } catch (
        nextError
      ) {
        const message =
          nextError
            instanceof Error
            ? nextError.message
            : "UNFILTERED LOG could not complete the request.";

        setError(
          message
        );
      } finally {
        setBusy(false);
      }
    };


  const resend =
    async () => {
      setBusy(true);
      setError(null);

      try {
        await resendSignupConfirmation(
          email
        );

        setSuccess(
          "Confirmation email sent again."
        );
      } catch (
        nextError
      ) {
        const message =
          nextError
            instanceof Error
            ? nextError.message
            : "Could not resend the email.";

        setError(
          message
        );
      } finally {
        setBusy(false);
      }
    };


  return (
    <div className="password-auth">
      <div className="password-auth-tabs">
        <button
          type="button"
          className={
            mode === "signin"
              ? "active"
              : ""
          }
          onClick={() => {
            switchMode(
              "signin"
            );
          }}
        >
          Sign in
        </button>

        <button
          type="button"
          className={
            mode === "create"
              ? "active"
              : ""
          }
          onClick={() => {
            switchMode(
              "create"
            );
          }}
        >
          Create account
        </button>
      </div>

      {mode ===
        "create" && (
        <label className="password-auth-field">
          <span>
            Username
          </span>

          <div>
            <UserRound
              size={15}
            />

            <input
              value={
                username
              }
              maxLength={24}
              autoComplete="username"
              onChange={
                (
                  event
                ) =>
                  setUsername(
                    event.target
                      .value
                  )
              }
              placeholder="little_guy"
            />
          </div>

          <small>
            3–24 letters, numbers, or underscores.
          </small>
        </label>
      )}

      <label className="password-auth-field">
        <span>
          Email
        </span>

        <div>
          <Mail size={15} />

          <input
            type="email"
            value={email}
            autoComplete="email"
            onChange={
              (
                event
              ) =>
                setEmail(
                  event.target
                    .value
                )
            }
            placeholder="you@example.com"
          />
        </div>
      </label>

      <label className="password-auth-field">
        <span>
          Password
        </span>

        <input
          className="password-auth-password"
          type="password"
          value={password}
          minLength={10}
          autoComplete={
            mode === "signin"
              ? "current-password"
              : "new-password"
          }
          onChange={
            (
              event
            ) =>
              setPassword(
                event.target
                  .value
              )
          }
          placeholder="8+ characters - just letters and numbers, we're not greedy..."
        />
      </label>

      {mode ===
        "create" && (
        <label className="password-auth-field">
          <span>
            Confirm password
          </span>

          <input
            className="password-auth-password"
            type="password"
            value={
              confirmPassword
            }
            minLength={10}
            autoComplete="new-password"
            onChange={
              (
                event
              ) =>
                setConfirmPassword(
                  event.target
                    .value
                )
            }
            placeholder="Do it again."
          />
        </label>
      )}

      {error && (
        <div className="password-auth-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="password-auth-message success">
          <CheckCircle2
            size={15}
          />

          <span>
            {success}
          </span>
        </div>
      )}

      <button
        className="password-auth-submit"
        type="button"
        disabled={
          busy ||
          !email.trim() ||
          !password ||
          (
            mode ===
              "create" &&
            (
              !username.trim() ||
              !confirmPassword
            )
          )
        }
        onClick={() => {
          void submit();
        }}
      >
        {busy
          ? "Working..."
          : mode ===
              "signin"
            ? "Sign in"
            : "Create account"}

        {!busy && (
          <ArrowRight
            size={15}
          />
        )}
      </button>

      {awaitingConfirmation && (
        <button
          className="password-auth-resend"
          type="button"
          disabled={busy}
          onClick={() => {
            void resend();
          }}
        >
          Resend confirmation email
        </button>
      )}
    </div>
  );
}
