import Link from "next/link";
import { Github, Linkedin, Mail, FileText, Monitor } from "lucide-react";
import { PROFILE } from "@/lib/profile";
import ThemeSwitcher from "./ThemeSwitcher";

/** Top-left lit backdrop shared by the website pages. */
export function SiteBackdrop() {
  return <div aria-hidden className="site-backdrop" />;
}

/** Top bar for the website pages. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-glass-border bg-background/70 backdrop-blur-xl shadow-[inset_0_1px_0_var(--depth-edge)]">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/projects" className="group flex items-center gap-1.5 font-mono text-sm font-bold tracking-tight">
          <span
            aria-hidden
            className="inline-block text-lg leading-none text-cyan-glowing transition-transform duration-500 ease-out group-hover:rotate-[135deg]"
          >
            *
          </span>
          <span>
            asterix<span className="text-foreground/45">.dev</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href="/projects#work" className="link-draw hidden px-2 py-1 text-foreground/70 hover:text-foreground md:block">
            Projects
          </Link>
          <Link href="/projects#contact" className="link-draw hidden px-2 py-1 text-foreground/70 hover:text-foreground md:block">
            Contact
          </Link>
          <ThemeSwitcher />
          <Link
            href="/os"
            className="press depth inline-flex items-center gap-2 rounded-full border border-cyan-glowing/40 bg-cyan-glowing/10 px-3 py-1.5 font-medium text-cyan-glowing hover:bg-cyan-glowing/20"
          >
            <Monitor size={15} aria-hidden />
            <span>
              <span className="hidden sm:inline">Launch </span>OS
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function ContactLinks() {
  const item =
    "press depth inline-flex items-center gap-2 rounded-lg border border-glass-border bg-background/60 px-3 py-2 text-sm hover:border-cyan-glowing/50 hover:text-cyan-glowing";
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`mailto:${PROFILE.email}`}
        className={`${item} border-cyan-glowing/40 bg-cyan-glowing/10 text-cyan-glowing`}
      >
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

/** Mono "01 — Title" section heading. */
export function SectionHeading({ index, id, title, sub }: { index: string; id: string; title: string; sub?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p aria-hidden className="font-mono text-xs tracking-widest text-cyan-glowing">
        {index} <span className="text-foreground/30">/</span>
      </p>
      <h2 id={id} className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {sub && <p className="text-sm text-foreground/60">{sub}</p>}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-glass-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-10 text-xs text-foreground/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="font-mono">
          <span className="text-cyan-glowing">*</span> © {new Date().getFullYear()} {PROFILE.name} · {PROFILE.signoff}
        </span>
        <Link href="/os" className="link-draw self-start hover:text-cyan-glowing sm:self-auto">
          Boot the desktop-OS version →
        </Link>
      </div>
    </footer>
  );
}
