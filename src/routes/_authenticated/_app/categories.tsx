import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMenuItems, useProductCategories, useRefresh, type ProductCategory } from "@/lib/data";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/categories")({
  head: () => ({ meta: [{ title: "Categories — Business Manager Pro" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: categories = [] } = useProductCategories();
  const { data: items = [] } = useMenuItems();
  const refresh = useRefresh();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<ProductCategory | null>(null);
  const [replacementId, setReplacementId] = useState("");

  const productsIn = (categoryName: string) =>
    items.filter((item) => item.category.trim().toLowerCase() === categoryName.trim().toLowerCase())
      .length;

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

  async function renameCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const categoryName = editName.trim();
    if (!categoryName) return;
    setBusy(true);
    const { error } = await supabase.rpc("rename_product_category", {
      p_id: editing.id,
      p_name: categoryName,
    });
    setBusy(false);
    if (error) {
      toast.error(error.code === "23505" ? "This category already exists" : error.message);
      return;
    }
    setEditing(null);
    toast.success("Category updated");
    refresh();
  }

  async function deleteCategory() {
    if (!deleting) return;
    const inUse = productsIn(deleting.name) > 0;
    if (inUse && !replacementId) {
      toast.error("Choose another category for these products");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("delete_product_category", {
      p_id: deleting.id,
      p_replacement_id: replacementId || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDeleting(null);
    setReplacementId("");
    toast.success(inUse ? "Category deleted and products moved" : "Category deleted");
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
                <Tags className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {productsIn(category.name)} products
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Edit ${category.name}`}
                  onClick={() => {
                    setEditing(category);
                    setEditName(category.name);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${category.name}`}
                  onClick={() => {
                    setDeleting(category);
                    setReplacementId(
                      categories.find((candidate) => candidate.id !== category.id)?.id ?? "",
                    );
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No categories yet. Add one above before creating products.
          </p>
        )}
      </Panel>
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={renameCategory}>
            <div className="space-y-1.5">
              <Label htmlFor="edit-category-name">Category name</Label>
              <Input
                id="edit-category-name"
                required
                maxLength={80}
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Products in this category will be updated too.
            </p>
            <Button className="w-full" type="submit" disabled={busy || !editName.trim()}>
              Save changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
            setReplacementId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category</DialogTitle>
          </DialogHeader>
          {deleting && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {productsIn(deleting.name) > 0
                  ? `${productsIn(deleting.name)} products use "${deleting.name}". Choose where to move them before deleting this category.`
                  : `Delete "${deleting.name}"? This category is not assigned to any products.`}
              </p>
              {productsIn(deleting.name) > 0 && categories.length > 1 && (
                <div className="space-y-1.5">
                  <Label>Move products to</Label>
                  <Select value={replacementId} onValueChange={setReplacementId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((category) => category.id !== deleting.id)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {productsIn(deleting.name) > 0 && categories.length === 1 && (
                <p className="text-sm text-destructive">
                  Add another category first, then move these products to it.
                </p>
              )}
              <Button
                variant="destructive"
                className="w-full"
                disabled={
                  busy ||
                  (productsIn(deleting.name) > 0 && (categories.length === 1 || !replacementId))
                }
                onClick={() => void deleteCategory()}
              >
                Delete category
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
