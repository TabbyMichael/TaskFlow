import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "../../setup/test-utils";
import { AvatarStack, UserAvatar } from "@/shared/components/user-avatar";
import { makeUser } from "../../fixtures/factories";

describe("UserAvatar", () => {
  it("renders the user's initials", async () => {
    renderWithProviders(<UserAvatar user={makeUser({ initials: "AM", name: "Alex Morgan" })} />);
    expect(await screen.findByText("AM")).toBeInTheDocument();
  });

  it("renders a placeholder when no user is given", async () => {
    renderWithProviders(<UserAvatar user={null} />);
    expect(await screen.findByText("?")).toBeInTheDocument();
  });
});

describe("AvatarStack", () => {
  const ids = ["u1", "u2", "u3", "u4", "u5"];
  const users = ids.map((id) => makeUser({ id }));

  it("renders an overflow indicator past the max", async () => {
    // 5 real users, max 4 visible => "+1" overflow.
    renderWithProviders(<AvatarStack ids={ids} users={users} max={4} />);
    expect(await screen.findByText("+1")).toBeInTheDocument();
  });

  it("does not show overflow when ids fit within max", () => {
    renderWithProviders(
      <AvatarStack ids={ids.slice(0, 2)} users={users} max={4} />,
    );
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });
});
