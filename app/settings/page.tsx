import { BrainCircuit, Database, KeyRound, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const settings = [
    { label: "AI provider", value: process.env.OPENAI_API_KEY ? `Configured · ${process.env.OPENAI_MODEL || "gpt-4o-mini"}` : "Not configured · heuristic text extraction", icon: BrainCircuit },
    { label: "Data layer", value: process.env.DATABASE_URL ? "PostgreSQL + Prisma configured" : "Demo mode · PostgreSQL not configured", icon: Database },
    { label: "Secrets & storage", value: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.CLOUDINARY_CLOUD_NAME ? "Supabase and Cloudinary configured" : "Optional integrations not configured", icon: KeyRound },
    { label: "Governance", value: process.env.SENTRY_DSN ? "Sentry configured · audit events not implemented" : "Sentry and audit events not configured", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-3">Workspace settings</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Platform configuration
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settings.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
