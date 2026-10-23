"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">
          Unable to Load Roster
        </h1>

        <p className="mt-3 text-sm text-slate-600">
          We could not retrieve the lodge roster. Your saved attendance
          selections have not been cleared.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 w-full rounded-xl bg-blue-800 px-4 py-3 font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
