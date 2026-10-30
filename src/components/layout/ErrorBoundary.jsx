import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import Button from "../ui/Button";

// If a component crashes while rendering, show a friendly screen instead of a blank page.
// (Error boundaries must be class components: React has no hook for this yet.)
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("UI crashed:", error, info.componentStack);
  }
  reset = () => this.setState({ error: null });
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.variant === "card") {
      return (
        <div
          role="alert"
          className="flex h-full min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-bad/30 bg-bad-soft p-6 text-center"
        >
          <AlertTriangle className="size-6 text-bad" aria-hidden="true" />
          <p className="text-sm font-medium">{this.props.label ?? "This section"} couldn't load</p>
          <Button size="sm" variant="secondary" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }
    return (
      <div role="alert" className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <p className="font-display text-6xl font-semibold text-accent">Oops</p>
        <h1 className="mt-4 font-display text-2xl font-semibold">This page hit a snag</h1>
        <p className="mt-2 text-sm text-ink-2">{error.message || "An unexpected error happened."}</p>
        <div className="mt-6 flex gap-2">
          <Button onClick={this.reset}>Try again</Button>
          <Link to="/" onClick={this.reset}>
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }
}
