import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#28313a] bg-[#11161b] py-9">
      <div className="mx-auto w-full max-w-296 px-5 sm:px-6 md:px-8">
        <div className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-center sm:gap-6.25">
          <a
            href={"https://euphoriadevelopment.uk"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.25 text-[13px] font-medium text-[#e9edf0]"
          >
            <img
              src="/brand/euphoria.png"
              alt=""
              className="h-5.5 w-5.5 object-contain"
            />
            Euphoria Development
          </a>
          <nav
            className="flex items-center gap-5.5 text-xs text-[#a0abb6] sm:gap-6"
            aria-label="Footer navigation"
          >
            <Link
              href="/docs"
              className="transition-colors hover:text-[#e9edf0]"
            >
              Documentation
            </Link>
            <a
              href={"https://github.com/Aquadactyl/aquadactyl"}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[#e9edf0]"
            >
              GitHub
            </a>
            <a
              href={"https://discord.euphoriadevelopment.uk"}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[#e9edf0]"
            >
              Discord
            </a>
          </nav>
        </div>
        <p className="text-[11px] leading-[1.9] text-[#8c9aa7]">
          © {new Date().getFullYear()} Euphoria Development ·{" "}
          <a
            href={`https://github.com/Aquadactyl/aquadactyl/blob/main/LICENSE.md`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-[3px] hover:text-[#e9edf0]"
          >
            MIT licensed
          </a>
        </p>
        <p className="mt-1.5 text-[11px] leading-[1.9] text-[#8c9aa7]">
          Aquadactyl is an independent fork of{" "}
          <a
            href="https://pterodactyl.io"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-[3px] hover:text-[#e9edf0]"
          >
            Pterodactyl
          </a>
          , with{" "}
          <a
            href="https://blueprint.zip"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-[3px] hover:text-[#e9edf0]"
          >
            Blueprint
          </a>{" "}
          included. Credit to their authors and contributors.
        </p>
      </div>
    </footer>
  );
}
