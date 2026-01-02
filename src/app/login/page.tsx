import LoginForm from "@/app/login/LoginForm";

type SearchParams = {
  callbackUrl?: string | string[];
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const callbackUrlParam = searchParams?.callbackUrl;
  const callbackUrl =
    typeof callbackUrlParam === "string" ? callbackUrlParam : "/";

  return (
    <div className="page">
      <section className="card">
        <h1>Acces</h1>
        <p className="subtitle">Introdueix el teu email i password.</p>
        <LoginForm callbackUrl={callbackUrl} />
      </section>
    </div>
  );
}
