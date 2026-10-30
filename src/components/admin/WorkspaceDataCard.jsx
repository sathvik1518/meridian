import { useState } from "react";
import { Database, Eraser } from "lucide-react";
import { useClearData, useLoadDemo } from "../../hooks/mutations";
import { toast } from "../../store/toastStore";
import Button from "../ui/Button";
import Card, { CardHeader } from "../ui/Card";
import ConfirmDialog from "../ui/ConfirmDialog";

// Admin tool: wipe the sample data to start with your own, or bring the samples back.
export default function WorkspaceDataCard() {
  const clear = useClearData();
  const load = useLoadDemo();
  const [confirming, setConfirming] = useState(false);

  async function handleClear() {
    setConfirming(false);
    try {
      await clear.mutateAsync();
      toast.success("Workspace cleared", "Add your own products and orders now.");
    } catch (error) {
      toast.error("Couldn't clear the data", error instanceof Error ? error.message : undefined);
    }
  }
  async function handleLoad() {
    try {
      await load.mutateAsync();
      toast.success("Sample data loaded", "120 products, 40 customers and 180 orders.");
    } catch (error) {
      toast.error("Couldn't load sample data", error instanceof Error ? error.message : undefined);
    }
  }

  return (
    <Card className="order-3 h-fit">
      <CardHeader title="Workspace data" description="Use the sample data, or start empty and type in your own." />
      <div className="space-y-3 p-5 pt-5 sm:p-6">
        <Button variant="secondary" className="w-full" onClick={() => setConfirming(true)} loading={clear.isPending}>
          <Eraser className="size-4" /> Clear all data
        </Button>
        <Button variant="secondary" className="w-full" onClick={handleLoad} loading={load.isPending}>
          <Database className="size-4" /> Load sample data
        </Button>
        <p className="text-[13px] text-ink-3">
          Clearing removes products, orders, customers and activity. Logins stay. Sample data loads only into an empty workspace.
        </p>
      </div>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleClear}
        title="Clear all data?"
        description="Every product, order, customer and activity entry will be deleted. This can't be undone (you can load the sample data again afterwards)."
        confirmLabel="Clear everything"
      />
    </Card>
  );
}
