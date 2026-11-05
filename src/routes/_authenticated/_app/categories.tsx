import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useProductCategories, useRefresh } from "@/lib/data";
import { Plus, Tags } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/categories")({
  head: () => ({ meta: [{ title: "Categories — Business Manager Pro" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: categories = [] } = useProductCategories();
  const refresh = useRefresh();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const categoryName = name.trim();
    if (!categoryName) return;
    setBusy(true);
    const { error } = await supabase.from("product_categories").insert({ name: categoryName });
    setBusy(false);
    if (error) {
      toast.error(error.code === "23505" ? "This category already exists" : error.message);
      return;
    }
    setName("");
    toast.success("Category added");
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Add product categories here, then select one when creating a product."
      />
      <Panel title="Add category">
        <form className="flex max-w-xl items-end gap-3" onSubmit={addCategory}>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="category-name">Category name</Label>
            <Input
              id="category-name"
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Bags, Electronics"
            />
          </div>
          <Button type="submit" disabled={busy || !name.trim()}>
            <Plus /> Add category
          </Button>
        </form>
      </Panel>
      <Panel title={`Your categories (${categories.length})`}>
        {categories.length ? (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Tags className="size-4 text-muted-foreground" />
                <span className="font-medium">{category.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No categories yet. Add one above before creating products.
          </p>
        )}
      </Panel>
    </div>
  );
}
