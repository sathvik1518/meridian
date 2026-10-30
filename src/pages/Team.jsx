import { useMemo, useState } from "react";
import { Form, Formik } from "formik";
import { Search, UserPlus, UsersRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCreateUser, useUpdateUser } from "../hooks/mutations";
import { useUsers } from "../hooks/queries";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { toast } from "../store/toastStore";
import { formatDate, titleCase } from "../lib/format";
import { userSchema } from "../validation/productSchema";
import WorkspaceDataCard from "../components/admin/WorkspaceDataCard";
import BarList from "../components/charts/BarList";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card, { CardHeader } from "../components/ui/Card";
import Drawer from "../components/ui/Drawer";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import PageHeader from "../components/ui/PageHeader";
import SegmentedControl from "../components/ui/SegmentedControl";
import Skeleton from "../components/ui/Skeleton";
import { PasswordField, SelectField, TextField } from "../components/ui/fields";

function InviteDrawer({ open, onClose }) {
  const create = useCreateUser();
  return (
    <Drawer open={open} onClose={onClose} title="Add a team member" description="They can sign in right away with this email and password.">
      <Formik
        initialValues={{ name: "", email: "", password: "", role: "viewer", title: "" }}
        validationSchema={userSchema}
        onSubmit={async (values, helpers) => {
          try {
            await create.mutateAsync(values);
            toast.success("Team member added", values.name);
            onClose();
          } catch (error) {
            // The server's message (for example "That value is already in use.") is shown right under the form.
            helpers.setStatus(error instanceof Error ? error.message : "Couldn't add this person.");
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, status }) => (
          <Form noValidate className="space-y-5">
            <TextField name="name" label="Full name" placeholder="e.g. Jordan Blake" data-autofocus autoComplete="off" />
            <TextField name="email" type="email" label="Work email" placeholder="jordan@meridian.dev" autoComplete="off" />
            <PasswordField
              name="password"
              label="Starting password"
              hint="At least 8 characters. Ask them to keep it private."
              autoComplete="new-password"
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                name="role"
                label="Role"
                options={[
                  { value: "viewer", label: "Viewer (read only)" },
                  { value: "admin", label: "Admin (can edit)" },
                ]}
                placeholder="Choose a role"
              />
              <TextField name="title" label="Job title" optional placeholder="e.g. Buyer" />
            </div>
            {status && (
              <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad-ink">
                {String(status)}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-line pt-5">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Add member
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Drawer>
  );
}

export default function Team() {
  const { user: me } = useAuth();
  const { data, isPending, isError, error, refetch } = useUsers();
  const update = useUpdateUser();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [inviting, setInviting] = useState(false);
  const roles = useMemo(() => {
    const counts = new Map();
    (data || []).filter((u) => u.active).forEach((u) => counts.set(u.role, (counts.get(u.role) || 0) + 1));
    return [...counts.entries()].map(([label, value], i) => ({ label: titleCase(label), value, color: `var(--c${(i % 6) + 1})` }));
  }, [data]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data || []).filter(
      (u) => (role === "all" || u.role === role) && (!q || `${u.name} ${u.email} ${u.title}`.toLowerCase().includes(q)),
    );
  }, [data, query, role]);
  const setRoleFor = (u, next) =>
    update.mutate({ id: u.id, patch: { role: next } }, { onSuccess: () => toast.success("Role updated", `${u.name} is now ${next}`) });
  const toggleActive = (u) =>
    update.mutate(
      { id: u.id, patch: { active: !u.active } },
      { onSuccess: () => toast.success(u.active ? "Access removed" : "Access restored", u.name) },
    );
  const roleSelect = (u) => (
    <select
      aria-label={`Role for ${u.name}`}
      value={u.role}
      disabled={u.id === me?.id || !u.active || update.isPending}
      onChange={(e) => setRoleFor(u, e.target.value)}
      className="h-8 cursor-pointer rounded-lg border border-line-strong bg-surface px-2 text-xs font-medium outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <option value="admin">Admin</option>
      <option value="viewer">Viewer</option>
    </select>
  );
  const accessButton = (u) =>
    u.id === me?.id ? (
      <Badge tone="accent">You</Badge>
    ) : (
      <Button
        size="sm"
        variant={u.active ? "ghost" : "secondary"}
        disabled={update.isPending}
        onClick={() => toggleActive(u)}
        aria-label={`${u.active ? "Remove access for" : "Restore access for"} ${u.name}`}
        className={u.active ? "text-bad-ink hover:bg-bad-soft dark:text-bad" : ""}
      >
        {u.active ? "Remove access" : "Restore"}
      </Button>
    );
  return (
    <>
      <PageHeader
        eyebrow="Admin only"
        title="Team"
        description="Everyone with access to the store, and what they're allowed to do."
        actions={
          <Button onClick={() => setInviting(true)}>
            <UserPlus className="size-4" /> Add member
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="order-2 lg:order-1">
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                aria-label="Search team"
                placeholder="Search by name, email or job title"
                className="h-10 w-full rounded-xl border border-line-strong bg-surface pr-3 pl-10 text-sm outline-none placeholder:text-ink-3 focus:border-accent focus:ring-4 focus:ring-accent/15"
              />
            </div>
            <SegmentedControl
              label="Role"
              value={role}
              onChange={setRole}
              options={[
                { value: "all", label: "All" },
                { value: "admin", label: "Admin" },
                { value: "viewer", label: "Viewer" },
              ]}
            />
          </div>

          {isPending ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={UsersRound} title="No one found" description="Try another name or role." />
          ) : isDesktop ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <caption className="sr-only">Team members</caption>
                <thead>
                  <tr className="border-b border-line text-xs tracking-wide text-ink-3 uppercase">
                    <th scope="col" className="px-6 py-3 font-semibold">
                      Person
                    </th>
                    <th scope="col" className="px-3 py-3 font-semibold">
                      Role
                    </th>
                    <th scope="col" className="px-3 py-3 font-semibold">
                      Joined
                    </th>
                    <th scope="col" className="px-6 py-3 text-right font-semibold">
                      <span className="sr-only">Access</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((u) => (
                    <tr key={u.id} className={`transition-colors hover:bg-surface-2/70 ${u.active ? "" : "opacity-60"}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium">
                              {u.name} {!u.active && <Badge tone="bad">Removed</Badge>}
                            </p>
                            <p className="truncate text-xs text-ink-3">
                              {u.email} · {u.title || "No title"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">{roleSelect(u)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-ink-2">{formatDate(u.createdAt)}</td>
                      <td className="px-6 py-3 text-right">{accessButton(u)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((u) => (
                <li key={u.id} className={`flex items-start gap-3 p-4 ${u.active ? "" : "opacity-60"}`}>
                  <Avatar name={u.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{u.name}</p>
                    <p className="truncate text-xs text-ink-2">{u.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {roleSelect(u)}
                      {accessButton(u)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="order-1 h-fit lg:order-2">
          <CardHeader title="Access by role" description={data ? `${data.filter((u) => u.active).length} people with access` : undefined} />
          <div className="p-5 pt-5 sm:p-6">
            {isPending ? <Skeleton className="h-28" /> : <BarList items={roles} label="People per role" />}
            <ul className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm text-ink-2">
              <li>
                <Badge tone="accent" dot>
                  Admin
                </Badge>{" "}
                <span className="ml-1">Edit products and orders, place restock orders, manage this team.</span>
              </li>
              <li>
                <Badge tone="info" dot>
                  Viewer
                </Badge>{" "}
                <span className="ml-1">Read-only access everywhere.</span>
              </li>
            </ul>
          </div>
        </Card>
        <WorkspaceDataCard />
      </div>
      <InviteDrawer open={inviting} onClose={() => setInviting(false)} />
    </>
  );
}
