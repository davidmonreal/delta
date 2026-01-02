import { withAuth } from "next-auth/middleware";

const proxy = withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => Boolean(token),
  },
});

export default proxy;

export const config = {
  matcher: ["/((?!api/auth|login|_next|favicon.ico).*)"],
};
