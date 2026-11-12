import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "@/components/support/contact-form";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ContactForm", () => {
  it("shows validation errors and does not call the API when fields are empty", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole("button", { name: "Send message" }));

    const alerts = await screen.findAllByRole("alert");
    const text = alerts.map((a) => a.textContent).join(" | ");
    expect(text).toMatch(/Enter your full name/);
    expect(text).toMatch(/Enter your email address/);
    expect(text).toMatch(/Add a short subject/);
    expect(text).toMatch(/at least 10 characters/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("submits valid data with the honeypot empty and elapsedMs, then shows the success state", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: { id: "msg_123" } }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    const user = userEvent.setup();
    render(<ContactForm defaultTopic="smsf" />);

    await user.type(screen.getByLabelText(/Full name/), "Dana Cohen");
    await user.type(screen.getByLabelText(/^Email/), "dana@example.com");
    await user.type(screen.getByLabelText(/Subject/), "Trustee question");
    await user.type(screen.getByLabelText(/^Message/), "Which trustee structure does the form expect?");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/support/contact");
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({ name: "Dana Cohen", email: "dana@example.com", topic: "smsf", subject: "Trustee question" });
    expect(body.company_url).toBe("");
    expect(typeof body.elapsedMs).toBe("number");
    expect(body.elapsedMs).toBeGreaterThanOrEqual(0);

    expect(await screen.findByTestId("contact-success")).toHaveTextContent("msg_123");
  });

  it("maps server field errors back onto the fields", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: { code: "VALIDATION", message: "Check the highlighted fields", fieldErrors: { email: "Email domain not accepted" } } }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.type(screen.getByLabelText(/Full name/), "Dana Cohen");
    await user.type(screen.getByLabelText(/^Email/), "dana@example.com");
    await user.type(screen.getByLabelText(/Subject/), "Hello there");
    await user.type(screen.getByLabelText(/^Message/), "A message that is long enough.");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("Email domain not accepted")).toBeInTheDocument();
    expect(screen.getByText("Check the highlighted fields")).toBeInTheDocument();
  });
});
