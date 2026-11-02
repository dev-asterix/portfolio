import Link from "next/link";
import { Github, Linkedin, Mail, FileText, Monitor } from "lucide-react";
import { PROFILE } from "@/lib/profile";

/** Top bar for the classic (non-OS) pages. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-glass-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/projects" className="font-mono text-sm font-bold tracking-tight">
          <span className="text-cyan-glowing">*</span> asterix.dev
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href="/projects#work" className="hidden rounded-md px-3 py-1.5 text-foreground/70 hover:text-foreground sm:block">
            Projects
          </Link>
          <Link href="/projects#contact" className="hidden rounded-md px-3 py-1.5 text-foreground/70 hover:text-foreground sm:block">
            Contact
          </Link>
          <Link
            href="/os"
            className="inline-flex items-center gap-2 rounded-md border border-cyan-glowing/40 bg-cyan-glowing/10 px-3 py-1.5 font-medium text-cyan-glowing transition-colors hover:bg-cyan-glowing/20"
          >
            <Monitor size={15} aria-hidden />
            <span>
              Launch <span className="hidden sm:inline">desktop </span>OS
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function ContactLinks() {
  const item =
    "inline-flex items-center gap-2 rounded-md border border-glass-border px-3 py-2 text-sm transition-colors hover:border-cyan-glowing/50 hover:text-cyan-glowing";
  return (
    <div className="flex flex-wrap gap-2">
      <a href={`mailto:${PROFILE.email}`} className={`${item} border-cyan-glowing/40 bg-cyan-glowing/10 text-cyan-glowing`}>
        <Mail size={16} aria-hidden /> {PROFILE.email}
      </a>
      <a href={PROFILE.links.github} target="_blank" rel="noopener noreferrer" className={item}>
        <Github size={16} aria-hidden /> GitHub
      </a>
      <a href={PROFILE.links.linkedin} target="_blank" rel="noopener noreferrer" className={item}>
        <Linkedin size={16} aria-hidden /> LinkedIn
      </a>
      <a href={PROFILE.links.resume} target="_blank" rel="noopener noreferrer" className={item}>
        <FileText size={16} aria-hidden /> Résumé
      </a>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-glass-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-xs text-foreground/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>
          © {new Date().getFullYear()} {PROFILE.name}
        </span>
        <span>
          Built with Next.js ·{" "}
          <Link href="/os" className="underline-offset-2 hover:text-cyan-glowing hover:underline">
            try the desktop-OS version
          </Link>
        </span>
      </div>
    </footer>
  );
}
