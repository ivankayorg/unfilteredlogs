import {
  UnfilteredLogsLogo,
} from "./SiteHeader";

import "./SiteFooter.css";


/* ==========================================================
   FOOTER 001
   SHARED PUBLIC SITE FOOTER
   ========================================================== */


export default function SiteFooter() {
  return (
    <footer className="unfiltered-site-footer">
      <div className="site-width unfiltered-site-footer-inner">
        <div className="unfiltered-site-footer-brand">
          <UnfilteredLogsLogo />

          <span className="unfiltered-site-footer-tagline">
            Built like the old web. Behaves like the new one.
          </span>
        </div>

        <nav aria-label="Footer navigation">
          <a href="/">
            Posts
          </a>

          <a href="/blog">
            Editorial
          </a>

          <a href="/forum">
            Forum
          </a>

          <a href="/login">
            Account
          </a>
        </nav>
      </div>
    </footer>
  );
}
