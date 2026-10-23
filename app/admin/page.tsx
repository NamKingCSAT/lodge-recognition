import { auth, signIn, signOut } from "@/auth";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

async function AdminContent() {
  await connection();

  const session = await auth();

  if (!session?.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Lodge Administration
          </h1>

          <p className="mt-3 text-slate-600">
            Sign in with your authorized GitHub account to manage the lodge
            roster.
          </p>

          <form
            action={async () => {
              "use server";
              await signIn("github", {
                redirectTo: "/admin",
              });
            }}
          >
            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white"
            >
              Sign in with GitHub
            </button>
          </form>

          <Link href="/" className="mt-5 inline-block text-sm text-blue-700">
            Return to Public Directory
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Roster Administration
          </h1>

          <p className="mt-3 text-slate-600">
            Signed in as {session.user.name ?? "Administrator"}
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="font-semibold text-slate-900">Manage Brethren</h2>

            <p className="mt-2 text-sm text-slate-600">
              View and maintain Past Masters and District Officers.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/admin/members"
                className="rounded-xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white"
              >
                Manage Roster
              </Link>

              <Link
                href="/admin/members/new"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
              >
                + Add Brother
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800"
            >
              Public Directory
            </Link>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin" });
              }}
            >
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-slate-600">Loading Lodge Administration...</p>
        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
