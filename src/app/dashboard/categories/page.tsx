"use client";

import React, { useState, useEffect } from "react";
import AdminGuard from "@/components/AdminGuard";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  getDocs, 
  where, 
  orderBy, 
  Timestamp 
} from "firebase/firestore";
import { Plus, Edit, Trash2, Loader2, Sparkles } from "lucide-react";

interface Category {
  id: string;
  name: string; // URL-friendly name (e.g. "Tshirts")
  displayName: string; // Human-friendly display name (e.g. "T-Shirts")
  image?: string;
  createdAt: Timestamp;
}

interface CategoryFormData {
  name: string;
  displayName: string;
  image: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({ name: "", displayName: "", image: "" });
  const [isNameEdited, setIsNameEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete States
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Helper: Auto-generate URL-friendly Name from Display Name
  const generateName = (text: string) => {
    return text
      .toString()
      .replace(/[^a-zA-Z0-9]/g, ""); // strips spaces, hyphens, and symbols
  };

  // 1. Subscribe to Categories List Real-time
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Category[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as Category);
      });
      setCategories(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Form handler
  const handleDisplayNameChange = (displayName: string) => {
    setFormData(prev => {
      const nextName = isNameEdited ? prev.name : generateName(displayName);
      return { ...prev, displayName, name: nextName };
    });
  };

  const handleNameChange = (name: string) => {
    setIsNameEdited(true);
    setFormData(prev => ({ ...prev, name: name.replace(/\s+/g, "") })); // no spaces allowed in url-friendly name
  };

  // Open Actions
  const openAddDialog = () => {
    setEditingCategory(null);
    setFormData({ name: "", displayName: "", image: "" });
    setIsNameEdited(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      displayName: category.displayName || "",
      image: category.image || "",
    });
    setIsNameEdited(true);
    setIsDialogOpen(true);
  };

  // Save category Doc
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.displayName.trim()) {
      toast.error("Please fill Name and Display Name");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        displayName: formData.displayName.trim(),
        image: formData.image.trim(),
      };

      if (editingCategory) {
        const docRef = doc(db, "categories", editingCategory.id);
        await updateDoc(docRef, payload);
        toast.success("Category updated successfully");
      } else {
        payload.createdAt = Timestamp.now();
        await addDoc(collection(db, "categories"), payload);
        toast.success("Category created successfully");
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error saving category:", err);
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  // Delete Safety verification
  const handleDeleteClick = async (category: Category) => {
    try {
      // Query if any product lists this category name
      const q = query(collection(db, "products"), where("category", "==", category.name));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        toast.error(`Cannot delete — ${snap.size} product(s) use this category`);
        return;
      }

      // No products use it -> safe to confirm delete
      setCategoryToDelete(category);
    } catch (err) {
      console.error("Error checking product dependencies:", err);
      toast.error("Error verifying product dependencies");
    }
  };

  // Final confirmation delete
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "categories", categoryToDelete.id));
      toast.success("Category deleted successfully");
      setCategoryToDelete(null);
    } catch (err) {
      console.error("Error deleting category:", err);
      toast.error("Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminGuard>
      <div className="space-y-6 font-sans">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-wide text-slate-100 uppercase">
              Categories
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Manage product classification tags and storefront search filters
            </p>
          </div>
          <Button
            onClick={openAddDialog}
            className="bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-semibold uppercase tracking-widest px-5 py-3 h-auto"
          >
            <Plus size={14} className="mr-1.5" />
            Add Category
          </Button>
        </div>

        {/* Categories Listing Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            <span className="text-xs uppercase tracking-widest text-slate-500">Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-500 text-xs uppercase tracking-widest">
            No custom categories created yet. Click Add Category to begin.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <Table>
              <TableHeader className="bg-slate-950/80 border-b border-slate-800">
                <TableRow className="hover:bg-transparent border-slate-800">
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 w-16">Image</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Display Name</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">URL-Friendly Name</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Created At</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-slate-800/40 border-slate-850 border-b border-slate-800/50">
                    <TableCell className="py-2">
                      <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-md overflow-hidden flex items-center justify-center">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.displayName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-[9px] text-slate-700 font-medium">No Img</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-xs font-medium text-slate-100">
                      {category.displayName}
                    </TableCell>
                    <TableCell className="py-4 text-xs text-slate-400 font-mono">
                      {category.name}
                    </TableCell>
                    <TableCell className="py-4 text-xs text-slate-500">
                      {category.createdAt ? new Date(category.createdAt.seconds * 1000).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          onClick={() => openEditDialog(category)}
                          variant="ghost"
                          size="icon-sm"
                          className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 p-1.5 rounded"
                        >
                          <Edit size={13} />
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(category)}
                          variant="ghost"
                          size="icon-sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/20 p-1.5 rounded"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Modal (Dialog) */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-light uppercase tracking-widest text-slate-200">
                {editingCategory ? "Edit Category Details" : "Add New Category"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                URL friendly identifier name must match database classification parameters.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveCategory} className="space-y-4 mt-2">
              
              {/* Display Name */}
              <div className="space-y-1">
                <Label htmlFor="cat-display-name" className="text-[10px] uppercase tracking-wider text-slate-400">
                  Display Name
                </Label>
                <Input
                  id="cat-display-name"
                  placeholder="e.g. Long-Sleeve Shirts"
                  value={formData.displayName}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                  required
                />
              </div>

              {/* Name (URL-friendly) */}
              <div className="space-y-1">
                <Label htmlFor="cat-name" className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>URL-Friendly ID Name</span>
                  {!isNameEdited && formData.displayName && (
                    <span className="text-[9px] text-emerald-400 font-sans tracking-wide flex items-center gap-0.5">
                      <Sparkles size={8} /> Auto-generating
                    </span>
                  )}
                </Label>
                <Input
                  id="cat-name"
                  placeholder="e.g. LongSleeveShirts"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                  required
                />
                <p className="text-[9px] text-slate-500 font-sans uppercase">Strictly alphanumeric. No spaces or special symbols.</p>
              </div>

              {/* Category Image URL */}
              <div className="space-y-1">
                <Label htmlFor="cat-image" className="text-[10px] uppercase tracking-wider text-slate-400">
                  Category Image URL (e.g. from ImgBB)
                </Label>
                <Input
                  id="cat-image"
                  placeholder="e.g. https://i.ibb.co/..."
                  value={formData.image}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, image: val }));

                    if (val.includes("ibb.co") && !val.includes("i.ibb.co")) {
                      fetch(`/api/resolve-image?url=${encodeURIComponent(val.trim())}`)
                        .then(r => r.json())
                        .then(data => {
                          if (data.resolvedUrl) {
                            setFormData(prev => ({ ...prev, image: data.resolvedUrl }));
                          }
                        })
                        .catch(err => console.error("Error resolving url", err));
                    }
                  }}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                />
              </div>

              {/* Footer Actions */}
              <DialogFooter className="border-t border-slate-800 pt-4 flex items-center justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs uppercase tracking-wider"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-semibold uppercase tracking-widest px-6"
                >
                  {saving ? "Saving..." : "Save Category"}
                </Button>
              </DialogFooter>

            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal (Dialog) */}
        <Dialog open={!!categoryToDelete} onOpenChange={(open) => { if (!open) setCategoryToDelete(null); }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg font-light uppercase tracking-widest text-slate-200">
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Are you sure you want to delete category <span className="font-semibold text-slate-300">{categoryToDelete?.displayName}</span>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex items-center justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                onClick={() => setCategoryToDelete(null)}
                className="text-slate-400 hover:text-slate-200 text-xs uppercase tracking-wider"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white text-xs uppercase tracking-wider font-semibold"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminGuard>
  );
}
