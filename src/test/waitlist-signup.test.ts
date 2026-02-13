import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "../../functions/api/waitlist-signup";

type TestContext = {
  request: Request;
  env: {
    RESEND_API_KEY: string;
    RESEND_AUDIENCE_ID: string;
    RESEND_FROM_EMAIL: string;
  };
};

const createContext = (
  body: Record<string, unknown>,
  envOverrides: Partial<TestContext["env"]> = {},
): TestContext => {
  return {
    request: new Request("https://example.com/api/waitlist-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    env: {
      RESEND_API_KEY: "test-key",
      RESEND_AUDIENCE_ID: "aud_test",
      RESEND_FROM_EMAIL: "Byeori <onboarding@example.com>",
      ...envOverrides,
    },
  };
};

const readJson = async (response: Response): Promise<Record<string, unknown>> => {
  return (await response.json()) as Record<string, unknown>;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("waitlist-signup API", () => {
  it("returns 200 when audience and welcome email both succeed", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "contact_1" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "email_1" }), { status: 200 }));

    const response = await onRequestPost(createContext({ email: "test@example.com" }) as never);
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.alreadyOnWaitlist).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const emailRequestInit = fetchMock.mock.calls[1]?.[1] as RequestInit | undefined;
    const emailBody = JSON.parse(String(emailRequestInit?.body ?? "{}")) as { from?: string };
    expect(emailBody.from).toBe("Byeori <onboarding@example.com>");
  });

  it("returns 200 for duplicate audience signup only if welcome email succeeds", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Contact already exists" }), { status: 409 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "email_2" }), { status: 200 }));

    const response = await onRequestPost(createContext({ email: "dup@example.com" }) as never);
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.alreadyOnWaitlist).toBe(true);
  });

  it("returns 502 when welcome email sending fails", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "contact_2" }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Email provider unavailable" }), { status: 503 }),
      );

    const response = await onRequestPost(createContext({ email: "mailfail@example.com" }) as never);
    const body = await readJson(response);

    expect(response.status).toBe(502);
    expect(body.error).toBe("Unable to send welcome email. Please try again.");
  });

  it("returns 500 when audience registration fails (non-duplicate)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Internal error" }), { status: 500 }),
    );

    const response = await onRequestPost(createContext({ email: "audfail@example.com" }) as never);
    const body = await readJson(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe("Something went wrong. Please try again.");
  });

  it("handles non-JSON error payloads from Resend safely", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("upstream timeout", { status: 502 }),
    );

    const response = await onRequestPost(createContext({ email: "plain@example.com" }) as never);
    const body = await readJson(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe("Something went wrong. Please try again.");
  });

  it("returns 400 for invalid email before calling Resend", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const response = await onRequestPost(createContext({ email: "invalid-email" }) as never);
    const body = await readJson(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe("Please enter a valid email address.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 500 when required resend config is missing", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const response = await onRequestPost(
      createContext({ email: "test@example.com" }, { RESEND_FROM_EMAIL: "   " }) as never,
    );
    const body = await readJson(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe("Something went wrong. Please try again.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
