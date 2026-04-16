import { afterEach, describe, expect, it } from "vitest";
import { CURRENT_LEGAL_VERSION } from "../src/lib/legal.js";
import { closeTestApp, createTestApp, extractSessionCookie } from "./setup.js";

describe("auth flow", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = undefined;
    }
  });

  it("supports signup, session retrieval, and logout", async () => {
    const { app, prisma } = await createTestApp();
    cleanup = async () => closeTestApp(app, prisma);

    const signup = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "artist@example.com",
        password: "StrongPass123!",
        acceptedLegal: true
      }
    });

    expect(signup.statusCode).toBe(201);
    const sessionCookie = extractSessionCookie(signup.headers["set-cookie"]);
    const createdUser = await prisma.user.findUnique({
      where: {
        email: "artist@example.com"
      }
    });

    expect(createdUser?.legalAcceptedAt).toBeTruthy();
    expect(createdUser?.legalAcceptedVersion).toBe(CURRENT_LEGAL_VERSION);

    const me = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: {
        cookie: sessionCookie
      }
    });

    expect(me.statusCode).toBe(200);
    const meBody = me.json();
    expect(meBody.user.email).toBe("artist@example.com");

    const logout = await app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: {
        cookie: sessionCookie
      }
    });

    expect(logout.statusCode).toBe(204);

    const rejectedLogin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "artist@example.com",
        password: "StrongPass123!",
        acceptedLegal: false
      }
    });

    expect(rejectedLogin.statusCode).toBe(400);

    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "artist@example.com",
        password: "StrongPass123!",
        acceptedLegal: true
      }
    });

    expect(login.statusCode).toBe(200);

    const meAfterLogout = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: {
        cookie: sessionCookie
      }
    });

    expect(meAfterLogout.statusCode).toBe(401);
  });

  it("supports changing email and deleting the account", async () => {
    const { app, prisma } = await createTestApp();
    cleanup = async () => closeTestApp(app, prisma);

    const signup = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "settings@example.com",
        password: "StrongPass123!",
        acceptedLegal: true
      }
    });
    expect(signup.statusCode).toBe(201);
    const sessionCookie = extractSessionCookie(signup.headers["set-cookie"]);

    const changeEmail = await app.inject({
      method: "PATCH",
      url: "/auth/email",
      headers: {
        cookie: sessionCookie
      },
      payload: {
        email: "updated-settings@example.com",
        currentPassword: "StrongPass123!"
      }
    });
    expect(changeEmail.statusCode).toBe(200);
    expect(changeEmail.json().user.email).toBe("updated-settings@example.com");

    const deleteAccount = await app.inject({
      method: "DELETE",
      url: "/auth/me",
      headers: {
        cookie: sessionCookie
      },
      payload: {
        currentPassword: "StrongPass123!"
      }
    });
    expect(deleteAccount.statusCode).toBe(204);

    const user = await prisma.user.findUnique({
      where: {
        email: "updated-settings@example.com"
      }
    });
    expect(user).toBeNull();
  });
});
