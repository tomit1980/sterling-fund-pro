import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Faq, HOME_FAQ } from "@/components/marketing/faq";

afterEach(cleanup);

describe("Faq accordion", () => {
  it("renders every question collapsed and toggles one open at a time", async () => {
    const user = userEvent.setup();
    render(<Faq entries={HOME_FAQ} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(HOME_FAQ.length);
    buttons.forEach((b) => expect(b).toHaveAttribute("aria-expanded", "false"));

    const fees = screen.getByRole("button", { name: /fees and spreads/i });
    await user.click(fees);
    expect(fees).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById(fees.getAttribute("aria-controls")!)!;
    expect(panel).not.toHaveAttribute("hidden");
    expect(panel).toHaveTextContent(/to be published by the business/i);

    // Opening another closes the first (single mode)
    const regulation = screen.getByRole("button", { name: /regulated/i });
    await user.click(regulation);
    expect(regulation).toHaveAttribute("aria-expanded", "true");
    expect(fees).toHaveAttribute("aria-expanded", "false");

    // Clicking the open one again closes it
    await user.click(regulation);
    expect(regulation).toHaveAttribute("aria-expanded", "false");
  });
});
