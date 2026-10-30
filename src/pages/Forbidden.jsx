import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";

// Shown when you ARE signed in but your role isn't allowed here (HTTP 403 idea).
export default function Forbidden({ requiredRole = "admin" }) {
  const { user, logout } = useAuth();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-warn-soft text-warn-ink">
        <ShieldAlert className="size-8" aria-hidden="true" />
      </span>
      <PageHeader
        title="Admins only"
        documentTitle="Access denied"
        description={`You're signed in as ${user?.name} (${user?.role}). This page needs the ${requiredRole} role.`}
      />
      <div className="-mt-2 flex flex-wrap justify-center gap-2">
        <Link to="/">
          <Button>Back to dashboard</Button>
        </Link>
        <Button variant="secondary" onClick={() => void logout()}>
          Switch account
        </Button>
      </div>
    </div>
  );
}
