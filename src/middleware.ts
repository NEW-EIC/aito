import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all routes except API/_next/_vercel/static files
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
