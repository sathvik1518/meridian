import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <span
        className="font-display text-[8rem] leading-none font-semibold tracking-tighter text-line-strong select-none"
        aria-hidden="true"
      >
        404
      </span>
      <Compass className="-mt-4 mb-4 size-8 text-accent" aria-hidden="true" />
      <PageHeader
        title="Page not found"
        description="That address doesn't match anything here. It may have moved, or the link is mistyped."
      />
      <div className="-mt-2 flex gap-2">
        <Link to="/">
          <Button>Back to dashboard</Button>
        </Link>
        <Link to="/products">
          <Button variant="secondary">Browse products</Button>
        </Link>
      </div>
    </div>
  );
}
