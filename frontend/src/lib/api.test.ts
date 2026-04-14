import { afterEach, describe, expect, it, vi } from "vitest";
import { login, logout, publishTenant } from "./api";

describe("api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("omits the JSON content type for body-less logout requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 204
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await logout();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: undefined,
        headers: {}
      })
    );
  });

  it("still sends JSON headers and a serialized body when a payload is present", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: "user_123",
            email: "artist@example.com",
            createdAt: "2026-04-01T00:00:00.000Z"
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    await login("artist@example.com", "StrongPass123!", true);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          email: "artist@example.com",
          password: "StrongPass123!",
          acceptedLegal: true
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
    );
  });

  it("omits the JSON content type for other empty POST requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          published: true,
          publishedUrl: "https://artist.getrivo.net"
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    await publishTenant("tenant_123");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tenants/tenant_123/publish",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: undefined,
        headers: {}
      })
    );
  });
});
