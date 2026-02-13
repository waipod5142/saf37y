import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";

export async function middleware(request: NextRequest) {
  console.log("MIDDLEWARE: ", request.url);
  if (request.method === "POST") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Redirect Machine pages to legacy system
  if (pathname.startsWith("/Machine/")) {
    const segments = pathname.split("/");
    const id = segments[segments.length - 1];
    const decodedId = decodeURIComponent(id);
    return NextResponse.redirect(
      new URL(`https://sccc-inseesafety-prod.web.app/Machine/${decodedId}`),
      { status: 307 }
    );
  }

  // Redirect Man pages to legacy system
  if (pathname.startsWith("/Man/")) {
    const segments = pathname.split("/");
    const type = segments[3]; // /Man/{bu}/{type}/{id}
    const id = segments[segments.length - 1];
    const decodedType = decodeURIComponent(type).toLowerCase();
    const decodedId = decodeURIComponent(id);

    if (decodedType === "toolbox") {
      return NextResponse.redirect(
        new URL(`https://sccc-inseesafety-prod.web.app/Man/toolbox/${decodedId}`),
        { status: 307 }
      );
    } else if (decodedType === "boot") {
      return NextResponse.redirect(
        new URL(`https://sccc-inseesafety-prod.web.app/Man/bootform/${decodedId}`),
        { status: 307 }
      );
    } else {
      return NextResponse.redirect(
        new URL(`https://sccc-inseesafety-prod.web.app/Man/${decodedType}/${decodedId}`),
        { status: 307 }
      );
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;

  if (
    !token &&
    (pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/property-search") ||
      pathname.startsWith("/forgot-password"))
  ) {
    return NextResponse.next();
  }

  if (
    token &&
    (pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/forgot-password"))
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const decodedToken = decodeJwt(token);

  if (decodedToken.exp && (decodedToken.exp - 300) * 1000 < Date.now()) {
    return NextResponse.redirect(
      new URL(
        `/api/refresh-token?redirect=${encodeURIComponent(pathname)}`,
        request.url
      )
    );
  }

  if (!decodedToken.admin && pathname.startsWith("/admin-dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (decodedToken.admin && pathname.startsWith("/account/my-favourites")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin-dashboard",
    "/admin-dashboard/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/account",
    "/account/:path*",
    "/property-search",
    "/Machine/:path*",
    "/Man/:path*",
  ],
};
