import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { RequireAuth, RequireRole } from "../components/layout/RouteGuards";
import SegmentedControl from "../components/ui/SegmentedControl";

const auth = vi.hoisted(() => ({ value: {} }));
vi.mock("../context/AuthContext", () => ({ useAuth: () => auth.value }));

function renderAt(path, ui) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/secret" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}
describe("route guards", () => {
  it("sends anonymous visitors to /login", () => {
    auth.value = { status: "anonymous", user: null };
    renderAt(
      "/secret",
      <RequireAuth>
        <p>Secret</p>
      </RequireAuth>,
    );
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });
  it("shows a spinner while the session is being checked", () => {
    auth.value = { status: "loading", user: null };
    renderAt(
      "/secret",
      <RequireAuth>
        <p>Secret</p>
      </RequireAuth>,
    );
    expect(screen.getByRole("status", { name: /checking your session/i })).toBeInTheDocument();
  });
  it("renders children for signed-in users", () => {
    auth.value = { status: "authenticated", user: { role: "viewer" } };
    renderAt(
      "/secret",
      <RequireAuth>
        <p>Secret</p>
      </RequireAuth>,
    );
    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
  it("shows the 403 page when the role is wrong", () => {
    auth.value = { status: "authenticated", user: { name: "Val", role: "viewer" }, logout: vi.fn() };
    renderAt(
      "/secret",
      <RequireRole roles={["admin"]}>
        <p>Admin zone</p>
      </RequireRole>,
    );
    expect(screen.queryByText("Admin zone")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /admins only/i })).toBeInTheDocument();
  });
});
describe("SegmentedControl", () => {
  it("reports the clicked value and marks the active one", async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        label="View"
        value="a"
        onChange={onChange}
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "A" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "B" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });
});
