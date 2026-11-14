import { NextRequest } from "next/server";
import { config, proxy } from "@/proxy";

test("redirects signed-out requests to /sign-in with returnTo", () => {
  const res = proxy(new NextRequest("http://localhost:3000/resumes/1?x=2"));
  expect(res.status).toBe(307);
  expect(res.headers.get("location")).toBe(
    "http://localhost:3000/sign-in?returnTo=%2Fresumes%2F1%3Fx%3D2",
  );
});

test("passes requests that carry a session cookie", () => {
  const req = new NextRequest("http://localhost:3000/dashboard", {
    headers: { cookie: "better-auth.session_token=abc.def" },
  });
  const res = proxy(req);
  expect(res.headers.get("location")).toBeNull();
  expect(res.headers.get("x-middleware-next")).toBe("1");
});

test("passes requests with the secure cookie name used on HTTPS", () => {
  const req = new NextRequest("https://example.com/dashboard", {
    headers: { cookie: "__Secure-better-auth.session_token=abc.def" },
  });
  expect(proxy(req).headers.get("location")).toBeNull();
});

test("covers dashboard, resumes and settings", () => {
  expect(config.matcher).toEqual(["/dashboard/:path*", "/resumes/:path*", "/settings/:path*"]);
});
