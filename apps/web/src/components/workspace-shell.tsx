"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Inbox,
  Monitor,
  BookOpen,
  GitPullRequest,
  Settings,
  Layers3,
  Menu,
  Search,
  ChevronDown,
  LogOut,
  LifeBuoy,
} from "lucide-react";
import { roleLabels } from "@relaydesk/contracts";
import { useSession } from "@/hooks/use-session";
import { api, keys } from "@/lib/api";
import { initials } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Loading, ErrorState } from "./common";
const nav = [
  { href: "/overview", title: "Genel bakış", icon: LayoutDashboard },
  { href: "/tickets", title: "Talep kuyruğu", icon: Inbox },
  { href: "/catalog", title: "Hizmet kataloğu", icon: Layers3 },
  { href: "/assets", title: "Varlık envanteri", icon: Monitor },
  { href: "/knowledge", title: "Bilgi bankası", icon: BookOpen },
  { href: "/changes", title: "Değişiklikler", icon: GitPullRequest },
  { href: "/settings", title: "Yönetim", icon: Settings },
];
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const session = useSession(),
    path = usePathname(),
    router = useRouter(),
    client = useQueryClient();
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState("");
  const logout = useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      client.clear();
      router.replace("/login");
    },
  });
  useEffect(() => {
    if (session.isError) router.replace("/login");
  }, [session.isError, router]);
  if (session.isPending || !session.data)
    return (
      <main className="standalone-message">
        <Loading />
      </main>
    );
  const user = session.data,
    items = nav.filter(
      (n) =>
        (n.href !== "/settings" || user.role === "ADMIN") &&
        (n.href !== "/changes" || user.role !== "REQUESTER"),
    );
  const links = (
    <>
      <Link href="/tickets" className="brand" onClick={() => setOpen(false)}>
        <span className="brand-symbol">
          <Layers3 size={21} />
        </span>
        <span>
          RelayDesk<small>BT Hizmet Yönetimi</small>
        </span>
      </Link>
      <div className="workspace-label">Çalışma alanı</div>
      <nav aria-label="Ana gezinme">
        {items.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={
              "nav-item " +
              (path === n.href || path.startsWith(n.href + "/")
                ? "is-active"
                : "")
            }
            aria-current={path === n.href ? "page" : undefined}
          >
            <n.icon size={18} />
            {n.title}
          </Link>
        ))}
      </nav>
      <div className="rail-help">
        <LifeBuoy size={19} />
        <strong>Çözüm elinin altında</strong>
        <p>Yaygın sorunlar için bilgi bankasını incele.</p>
        <Link href="/knowledge" onClick={() => setOpen(false)}>
          Makalelere git
        </Link>
      </div>
      <div className="rail-footer">
        RelayDesk <span>Çalışma alanım</span>
      </div>
    </>
  );
  return (
    <div className="workspace-shell">
      <aside className="sidebar">{links}</aside>
      <div className="workspace-content">
        <header className="workspace-header">
          <div className="mobile-nav">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menüyü aç">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 bg-sidebar text-sidebar-foreground"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Gezinme</SheetTitle>
                </SheetHeader>
                <div className="mobile-rail">{links}</div>
              </SheetContent>
            </Sheet>
          </div>
          <span className="header-location">
            Çalışma alanı <span>/</span>
            <strong>
              {items.find((n) => path.startsWith(n.href))?.title || "Talep"}
            </strong>
          </span>
          <form
            className="global-search"
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/tickets?q=" + encodeURIComponent(search));
            }}
          >
            <Search size={16} />
            <Input
              aria-label="Taleplerde genel arama"
              placeholder="Talep numarası veya başlık ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="user-menu">
                <span className="avatar">{initials(user.name)}</span>
                <span className="user-label">
                  <strong>{user.name}</strong>
                  <small>{roleLabels[user.role]}</small>
                </span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={logout.isPending}
                onSelect={() => logout.mutate()}
              >
                <LogOut />
                Oturumu kapat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="workspace-main">
          {logout.error ? <ErrorState error={logout.error} /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
