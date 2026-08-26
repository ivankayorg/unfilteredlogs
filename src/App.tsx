import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import { supabase } from "./lib/supabase";

import PasswordAuthForm from "./components/auth/PasswordAuthForm";
import SiteFooter from "./components/layout/SiteFooter";
import {
  UnfilteredLogsLogo,
} from "./components/layout/SiteHeader";

import "./components/auth/LoginPage.css";
import "./AppV2.css";

const AppV2 = lazy(() => import("./AppV2"));

const Admin = lazy(
  () =>
    import(
      "./pages/admin/Admin"
    )
);


const Forum = lazy(
  () =>
    import(
      "./pages/forum/Forum"
    )
);


const Blog = lazy(
  () =>
    import(
      "./pages/blog/Blog"
    )
);


const UserAdmin = lazy(
  () =>
    import(
      "./pages/account/UserAdmin"
    )
);


const ProfilePage = lazy(
  () =>
    import(
      "./pages/profile/ProfilePage"
    )
);


const PostPage = lazy(
  () =>
    import(
      "./pages/posts/PostPage"
    )
);


/* ==========================================================
   UNFILTERED LOGS
   APP ENTRY / LOGIN
   ========================================================== */


function PrototypeLoading() {
  return (
    <main className="roffle-auth-loading">
      <span>Loading UNFILTERED LOGS...</span>
    </main>
  );
}



function GoogleLogo() {
  return (
    <svg
      className="auth-provider-logo"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.89-1.74 2.99-4.31 2.99-7.38Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.89 6.62-2.4l-3.22-2.51c-.9.6-2.04.96-3.4.96-2.6 0-4.8-1.75-5.59-4.11H3.08v2.58A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.94A6.01 6.01 0 0 1 6.1 12c0-.67.11-1.32.31-1.94V7.48H3.08A10 10 0 0 0 2 12c0 1.61.39 3.13 1.08 4.52l3.33-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.5 3.82 1.49l2.87-2.87C16.96 2.96 14.7 2 12 2a10 10 0 0 0-8.92 5.48l3.33 2.58C7.2 7.7 9.4 5.95 12 5.95Z"
      />
    </svg>
  );
}


function DiscordLogo() {
  return (
    <svg
      className="auth-provider-logo discord-logo"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M19.54 5.32A16.7 16.7 0 0 0 15.44 4l-.5 1.03a15.3 15.3 0 0 0-5.87 0L8.56 4a16.8 16.8 0 0 0-4.11 1.33C1.85 9.17 1.15 12.9 1.5 16.58a16.5 16.5 0 0 0 5.03 2.54l1.2-1.65a10.5 10.5 0 0 1-1.89-.9l.46-.35a12 12 0 0 0 11.4 0l.47.35c-.6.35-1.23.65-1.9.9l1.2 1.65a16.5 16.5 0 0 0 5.03-2.54c.4-4.27-.68-7.97-2.46-11.26ZM8.34 14.72c-1.08 0-1.97-.99-1.97-2.2 0-1.22.87-2.2 1.97-2.2 1.1 0 1.99 1 1.97 2.2 0 1.21-.87 2.2-1.97 2.2Zm7.32 0c-1.08 0-1.97-.99-1.97-2.2 0-1.22.87-2.2 1.97-2.2 1.1 0 1.99 1 1.97 2.2 0 1.21-.87 2.2-1.97 2.2Z"
      />
    </svg>
  );
}


function getSafeReturnTo() {
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


function LoginPage() {
  const [
    signingIn,
    setSigningIn,
  ] = useState<
    "google" | "discord" | null
  >(null);

  const [
    signedIn,
    setSignedIn,
  ] = useState(false);

  const [
    authError,
    setAuthError,
  ] = useState<string | null>(
    null
  );


  useEffect(() => {
    let active = true;

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) {
          return;
        }

        const hasSession =
          Boolean(
            data.session
          );

        setSignedIn(
          hasSession
        );

        if (hasSession) {
          window.location.replace(
            getSafeReturnTo()
          );
        }
      });

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!active) {
            return;
          }

          const hasSession =
            Boolean(
              session
            );

          setSignedIn(
            hasSession
          );

          if (hasSession) {
            window.location.replace(
              getSafeReturnTo()
            );
          }
        }
      );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);


  const signInWithProvider =
    async (
      provider:
        | "google"
        | "discord"
    ) => {
      setSigningIn(provider);
      setAuthError(null);

      const { error } =
        await supabase.auth
          .signInWithOAuth({
            provider,

            options: {
              redirectTo:
                `${window.location.origin}/login?returnTo=${encodeURIComponent(
                  getSafeReturnTo()
                )}`,
            },
          });

      if (error) {
        setAuthError(
          error.message
        );

        setSigningIn(null);
      }
    };


  const continueToUnfilteredLogs =
    () => {
      window.location.assign(
        getSafeReturnTo()
      );
    };


  return (
    <div className="roffle-auth-page">
      <header className="roffle-auth-header">
        <div className="roffle-auth-header-shell">
          <UnfilteredLogsLogo variant="dark" />

          <a
            className="roffle-auth-browse"
            href="/"
          >
            Browse without an account »
          </a>
        </div>
      </header>

      <main className="roffle-auth-main">
        <section className="roffle-auth-welcome">
          <div className="roffle-auth-welcome-copy">
            <div className="roffle-auth-kicker">
              <Sparkles size={12} />
              WTF INTERNET
            </div>

            <h1>
              Welcome back little guy!
            </h1>

            <p>
              Sign in to post weird stuff,
              questionable videos, and things
              you probably should have kept to
              yourself, in your demented little brain.
            </p>
          </div>

          <aside className="roffle-auth-welcome-note">
            <strong>
              COMMUNITY ACCESS
            </strong>

            <span>
              Post. Comment. React. Participate.
            </span>

            <em>
              Lurking is an option. But we judge you.
            </em>
          </aside>
        </section>

        <div className="roffle-auth-layout">
          <section className="roffle-auth-panel roffle-auth-member-panel">
            <header className="roffle-auth-panel-heading">
              <div>
                <span>
                  MEMBER ACCESS
                </span>

                <h2>
                  Sign in or create an account
                </h2>
              </div>

              <LockKeyhole size={16} />
            </header>

            <div className="roffle-auth-panel-body">
              <p className="roffle-auth-panel-intro">
                Email and password. Nothing fancy.
                We have nonsense to get to.
              </p>

              <PasswordAuthForm />
            </div>
          </section>

          <aside className="roffle-auth-side">
            <section className="roffle-auth-panel roffle-auth-quick-panel">
              <header className="roffle-auth-panel-heading">
                <div>
                  <span>
                    QUICK LOGIN
                  </span>

                  <h2>
                    Use another account
                  </h2>
                </div>
              </header>

              <div className="roffle-auth-panel-body">
                {signedIn && (
                  <button
                    className="roffle-continue-button"
                    type="button"
                    onClick={
                      continueToUnfilteredLogs
                    }
                  >
                    Continue to UNFILTERED LOGS

                    <ArrowRight size={14} />
                  </button>
                )}

                <button
                  className="roffle-google-button"
                  type="button"
                  disabled={
                    signingIn !== null
                  }
                  onClick={() => {
                    void signInWithProvider(
                      "google"
                    );
                  }}
                >
                  <GoogleLogo />

                  <span>
                    {signingIn === "google"
                      ? "Opening Google..."
                      : "Continue with Google"}
                  </span>
                </button>

                <button
                  className="roffle-discord-button"
                  type="button"
                  disabled={
                    signingIn !== null
                  }
                  onClick={() => {
                    void signInWithProvider(
                      "discord"
                    );
                  }}
                >
                  <DiscordLogo />

                  <span>
                    {signingIn === "discord"
                      ? "Opening Discord..."
                      : "Continue with Discord"}
                  </span>
                </button>

                {authError && (
                  <div className="roffle-auth-error">
                    {authError}
                  </div>
                )}
              </div>
            </section>

            <section className="roffle-auth-panel roffle-auth-lurk-panel">
              <header className="roffle-auth-panel-heading">
                <div>
                  <span>
                    NOT READY TO COMMIT?
                  </span>

                  <h2>
                    Lurk like a coward
                  </h2>
                </div>
              </header>

              <div className="roffle-auth-panel-body">
                <p>
                  You can browse the whole place
                  without signing in.
                </p>

                <a
                  className="roffle-auth-guest"
                  href="/"
                >
                  Lurk, so mommy and daddy don't know...

                  <ArrowRight size={13} />
                </a>
              </div>
            </section>

            <div className="roffle-auth-footnote">
              <LockKeyhole size={12} />

              <span>
                Google and Discord authentication
                happens with the provider. UNFILTERED
                LOGS never sees those passwords.
              </span>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );

}


function App() {
  const path =
    window.location.pathname
      .toLowerCase();

  if (
    path === "/login" ||
    path === "/signin"
  ) {
    return <LoginPage />;
  }

  if (
    path === "/account" ||
    path === "/me"
  ) {
    return (
      <Suspense
        fallback={
          <PrototypeLoading />
        }
      >
        <UserAdmin />
      </Suspense>
    );
  }


  if (
    path.startsWith(
      "/u/"
    )
  ) {
    return (
      <Suspense
        fallback={
          <PrototypeLoading />
        }
      >
        <ProfilePage />
      </Suspense>
    );
  }


  if (
    path === "/blog" ||
    path.startsWith(
      "/blog/"
    )
  ) {
    return (
      <Suspense
        fallback={
          <PrototypeLoading />
        }
      >
        <Blog />
      </Suspense>
    );
  }


  if (
    path === "/forum" ||
    path.startsWith(
      "/forum/"
    )
  ) {
    return (
      <Suspense
        fallback={
          <PrototypeLoading />
        }
      >
        <Forum />
      </Suspense>
    );
  }


  if (
    path.startsWith(
      "/posts/"
    )
  ) {
    return (
      <Suspense
        fallback={
          <PrototypeLoading />
        }
      >
        <PostPage />
      </Suspense>
    );
  }


  if (
    path === "/admin" ||
    path.startsWith(
      "/admin/"
    )
  ) {
    return (
      <Suspense
        fallback={
          <PrototypeLoading />
        }
      >
        <Admin />
      </Suspense>
    );
  }

  return (
    <Suspense
      fallback={
        <PrototypeLoading />
      }
    >
      <AppV2 />
    </Suspense>
  );
}

export default App;