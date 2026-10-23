import { auth } from "@/auth";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

// This component performs the authentication check
// at request time.
async function ProtectedContent({ children }: { children: ReactNode }) {
  await connection();

  const session = await auth();

  if (!session?.user) {
    redirect("/admin");
  }

  return <>{children}</>;
}

// The layout provides a Suspense boundary
// around the authentication-dependent component.
export default function NewMemberLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-slate-600">Checking administrator access...</p>
        </main>
      }
    >
      <ProtectedContent>{children}</ProtectedContent>
    </Suspense>
  );
}
