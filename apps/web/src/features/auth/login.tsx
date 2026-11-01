"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { loginSchema, type User } from "@relaydesk/contracts";
import { EntityForm } from "@/components/entity-form";
import { send, keys } from "@/lib/api";
import {
  Layers3,
  ArrowRight,
  Clock3,
  ShieldCheck,
  GitPullRequest,
} from "lucide-react";
export function Login() {
  const router = useRouter(),
    client = useQueryClient();
  const login = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      send<User>("/auth/login", "POST", data),
    onSuccess: (user) => {
      client.clear();
      client.setQueryData(keys.session, user);
      router.replace("/tickets");
    },
  });
  return (
    <main className="login-layout">
      <section className="login-story">
        <div className="brand">
          <span className="brand-symbol">
            <Layers3 />
          </span>
          <span>
            RelayDesk<small>BT Hizmet Yönetimi</small>
          </span>
        </div>
        <div className="login-message">
          <h1>
            Her talep için
            <br />
            net bir sonraki adım
          </h1>
          <p>
            Destek taleplerini, varlıkları ve değişiklikleri ekibinle aynı
            çalışma alanında yönet.
          </p>
          <div className="login-features">
            <span>
              <Clock3 />
              Görünür SLA hedefleri
            </span>
            <span>
              <ShieldCheck />
              Rolüne uygun erişim
            </span>
            <span>
              <GitPullRequest />
              Kontrollü değişiklikler
            </span>
          </div>
        </div>
        <span className="login-footer">Talep. Sorumluluk. Çözüm.</span>
      </section>
      <section className="login-form-side">
        <div className="login-form">
          <span className="login-icon">
            <ArrowRight />
          </span>
          <h2>Çalışma alanına giriş yap</h2>
          <p>Kurum hesabınla devam et.</p>
          <EntityForm
            schema={loginSchema}
            initial={{ email: "", password: "" }}
            fields={[
              {
                name: "email",
                label: "E-posta",
                type: "email",
                autoComplete: "username",
                wide: true,
                required: true,
              },
              {
                name: "password",
                label: "Parola",
                type: "password",
                autoComplete: "current-password",
                wide: true,
                required: true,
              },
            ]}
            onSubmit={(data) => login.mutate(data)}
            pending={login.isPending}
            error={login.error}
            submitLabel="Giriş yap"
          />
          <small className="login-note">
            Erişim sorunu yaşıyorsan BT yöneticinle iletişime geç.
          </small>
        </div>
      </section>
    </main>
  );
}
