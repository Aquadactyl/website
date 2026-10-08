import Link from "next/link";
import { BRANCH, COMMUNITY, EUPHORIA, REPOSITORY } from "../config";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner container">
        <div className="footer-main">
          <a
            href={EUPHORIA}
            target="_blank"
            rel="noreferrer"
            className="footer-brand"
          >
            <img src="/brand/euphoria.png" alt="" />
            Euphoria Development
          </a>
          <nav aria-label="Footer navigation">
            <Link href="/docs">Documentation</Link>
            <a href={REPOSITORY} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={COMMUNITY} target="_blank" rel="noreferrer">
              Discord
            </a>
          </nav>
        </div>
        <p>
          © {new Date().getFullYear()} Euphoria Development ·{" "}
          <a
            href={`${REPOSITORY}/blob/${BRANCH}/LICENSE.md`}
            target="_blank"
            rel="noreferrer"
          >
            MIT licensed
          </a>
        </p>
        <p className="fork-credit">
          Aquadactyl is an independent fork of{" "}
          <a href="https://pterodactyl.io" target="_blank" rel="noreferrer">
            Pterodactyl
          </a>
          , with{" "}
          <a href="https://blueprint.zip" target="_blank" rel="noreferrer">
            Blueprint
          </a>{" "}
          included. Credit to their authors and contributors.
        </p>
      </div>
    </footer>
  );
}
