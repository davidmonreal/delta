import LoginForm from "@/app/login/LoginForm";

type SearchParams = {
  callbackUrl?: string | string[];
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const callbackUrlParam = resolvedSearchParams.callbackUrl;
  const callbackUrl =
    typeof callbackUrlParam === "string" ? callbackUrlParam : "/";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center px-6 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <img src="/logo-busbac.png" alt="Busbac" className="mb-4 h-20 w-auto" />
        <h1 className="text-3xl font-semibold text-slate-900">Acces</h1>
        <p className="mt-2 text-base text-slate-500">
          Introdueix el teu email i password.
        </p>
        <div className="mt-6">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
      </section>
    </div>
  );
}
