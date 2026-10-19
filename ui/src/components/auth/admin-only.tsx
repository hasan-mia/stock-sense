"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { EmptyDescription } from "@/components/ui/empty";
import { EmptyMedia } from "@/components/ui/empty";

/**
 * Rendered when a non-admin user reaches an admin-only page: redirects back
 * to the inventory dashboard and shows a short message in the meantime.
 */
export function AdminOnly() {
  const router = useRouter();
  const name = useAuthStore((s) => s.user?.name);

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldAlert className="size-6" />
        </EmptyMedia>
        <EmptyTitle>Admins only</EmptyTitle>
        <EmptyDescription>
          {name ? `${name}, you` : "You"} do not have access to this page.
          Redirecting to the dashboard…
        </EmptyDescription>
      </EmptyHeader>
      <Button variant="outline" onClick={() => router.replace("/dashboard")}>
        Go to dashboard
      </Button>
    </Empty>
  );
}
