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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  orderBy, 
  Timestamp,
  where,
  getDocs
} from "firebase/firestore";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  Sparkles, 
  X, 
  Image as ImageIcon 
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  discountedPrice?: number | null;
  shippingCharge?: number | null;
  processingCharge?: number | null;
  packagingCharge?: number | null;
  shippingChargeEnabled?: boolean;
  processingChargeEnabled?: boolean;
  packagingChargeEnabled?: boolean;
  description: string;
  fabric: string;
  fit: string;
  care: string;
  sizes: string[];
  colors: string[];
  stock: number;
  promoCode?: string;
  promoDiscount?: number | null;
  isNewArrival: boolean;
  isBestseller: boolean;
  isActive: boolean;
  isCodAllowed?: boolean;
  isReturnable?: boolean;
  images: string[];
  videoUrl?: string | null;
  colorImages?: { [color: string]: string[] } | null;
  createdAt: Timestamp;
}

interface ProductFormData {
  name: string;
  slug: string;
  category: string;
  price: number;
  discountedPrice: number | "";
  shippingCharge: number | "";
  processingCharge: number | "";
  packagingCharge: number | "";
  shippingChargeEnabled: boolean;
  processingChargeEnabled: boolean;
  packagingChargeEnabled: boolean;
  description: string;
  fabric: string;
  fit: string;
  care: string;
  sizes: string[];
  colors: string[];
  stock: number;
  promoCode: string;
  promoDiscount: number | "";
  isNewArrival: boolean;
  isBestseller: boolean;
  isActive: boolean;
  isCodAllowed: boolean;
  isReturnable: boolean;
  images: string[];
  videoUrl: string;
  colorImages: { [color: string]: string[] };
}

const defaultCategories = ["Full Shirts", "Trousers", "Half Pants", "Sneakers"];
const presetSizesApparel = ["XS", "S", "M", "L", "XL", "XXL"];
const presetSizesShoes = ["6", "7", "8", "9", "10", "11"];
const presetColors = ["Ivory", "Black", "Beige", "Olive", "Brown", "Grey", "Navy"];

const getInitialFormData = (): ProductFormData => ({
  name: "",
  slug: "",
  category: "",
  price: 0,
  discountedPrice: "",
  shippingCharge: "",
  processingCharge: "",
  packagingCharge: "",
  shippingChargeEnabled: false,
  processingChargeEnabled: false,
  packagingChargeEnabled: false,
  description: "",
  fabric: "",
  fit: "",
  care: "",
  sizes: [],
  colors: [],
  stock: 25,
  promoCode: "",
  promoDiscount: "",
  isNewArrival: false,
  isBestseller: false,
  isActive: true,
  isCodAllowed: true,
  isReturnable: true,
  images: [""],
  videoUrl: "",
  colorImages: {},
});

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Add/Edit Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(getInitialFormData());
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete Dialog States
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Helper: Slugify name
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\w\-]+/g, "") // Remove all non-word chars
      .replace(/\-\-+/g, "-"); // Replace multiple - with single -
  };

  // Helper: Format currency
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // 1. Real-time Subscription to Products Collection
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts: Product[] = [];
      snapshot.forEach((docSnap) => {
        fetchedProducts.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProducts(fetchedProducts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products list");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Subscription to Categories Collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
      const list: string[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.name) list.push(data.name);
      });
      const merged = Array.from(new Set([...list, ...defaultCategories]));
      setCategories(merged);
    }, (error) => {
      console.error("Error fetching categories:", error);
    });

    return () => unsubscribe();
  }, []);

  // Handle name change (auto slugify)
  const handleNameChange = (name: string) => {
    setFormData(prev => {
      const nextSlug = isSlugEdited ? prev.slug : slugify(name);
      return { ...prev, name, slug: nextSlug };
    });
  };

  // Handle slug change manually
  const handleSlugChange = (slug: string) => {
    setIsSlugEdited(true);
    setFormData(prev => ({ ...prev, slug: slugify(slug) }));
  };

  // Dialog actions
  const openAddDialog = () => {
    setEditingProduct(null);
    setFormData(getInitialFormData());
    setIsSlugEdited(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    const colorImgs: { [color: string]: string[] } = {};
    if (product.colors && Array.isArray(product.colors)) {
      product.colors.forEach(col => {
        if (product.colorImages && product.colorImages[col]) {
          colorImgs[col] = [...product.colorImages[col]];
        } else {
          colorImgs[col] = [""];
        }
      });
    }

    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      slug: product.slug || "",
      category: product.category || "",
      price: product.price || 0,
      discountedPrice: product.discountedPrice ?? "",
      shippingCharge: product.shippingCharge ?? "",
      processingCharge: product.processingCharge ?? "",
      packagingCharge: product.packagingCharge ?? "",
      shippingChargeEnabled: !!product.shippingChargeEnabled,
      processingChargeEnabled: !!product.processingChargeEnabled,
      packagingChargeEnabled: !!product.packagingChargeEnabled,
      description: product.description || "",
      fabric: product.fabric || "",
      fit: product.fit || "",
      care: product.care || "",
      sizes: product.sizes || [],
      colors: product.colors || [],
      stock: product.stock !== undefined ? product.stock : 25,
      promoCode: product.promoCode || "",
      promoDiscount: product.promoDiscount ?? "",
      isNewArrival: !!product.isNewArrival,
      isBestseller: !!product.isBestseller,
      isActive: product.isActive !== false,
      isCodAllowed: product.isCodAllowed !== false,
      isReturnable: product.isReturnable !== false,
      images: product.images && product.images.length > 0 ? [...product.images] : [""],
      videoUrl: product.videoUrl || "",
      colorImages: colorImgs,
    });
    setIsSlugEdited(true);
    setIsDialogOpen(true);
  };

  // Add/Remove sizes
  const addSize = (size: string) => {
    const cleaned = size.trim();
    if (cleaned && !formData.sizes.includes(cleaned)) {
      setFormData(prev => ({ ...prev, sizes: [...prev.sizes, cleaned] }));
    }
    setSizeInput("");
  };

  const removeSize = (size: string) => {
    setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== size) }));
  };

  // Add/Remove colors
  const addColor = (color: string) => {
    const cleaned = color.trim();
    if (cleaned && !formData.colors.includes(cleaned)) {
      setFormData(prev => {
        const nextColorImages = { ...prev.colorImages };
        if (!nextColorImages[cleaned]) {
          nextColorImages[cleaned] = [""];
        }
        return {
          ...prev,
          colors: [...prev.colors, cleaned],
          colorImages: nextColorImages
        };
      });
    }
    setColorInput("");
  };

  const removeColor = (color: string) => {
    setFormData(prev => {
      const nextColorImages = { ...prev.colorImages };
      delete nextColorImages[color];
      return {
        ...prev,
        colors: prev.colors.filter(c => c !== color),
        colorImages: nextColorImages
      };
    });
  };

  // Save changes
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim() || !formData.category) {
      toast.error("Please fill name, slug and category");
      return;
    }

    setSaving(true);
    try {
      const cleanImages = formData.images.map(url => url.trim()).filter(url => url !== "");
      
      const cleanColorImages: { [color: string]: string[] } = {};
      if (formData.colorImages) {
        Object.keys(formData.colorImages).forEach(col => {
          if (formData.colors.includes(col)) {
            const urls = formData.colorImages[col]
              .map(u => u.trim())
              .filter(u => u !== "");
            if (urls.length > 0) {
              cleanColorImages[col] = urls;
            }
          }
        });
      }

      const payload: any = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        category: formData.category,
        price: Number(formData.price) || 0,
        description: formData.description.trim(),
        fabric: formData.fabric.trim(),
        fit: formData.fit.trim(),
        care: formData.care.trim(),
        sizes: formData.sizes,
        colors: formData.colors,
        stock: Number(formData.stock) || 0,
        promoCode: formData.promoCode.trim().toUpperCase(),
        isNewArrival: formData.isNewArrival,
        isBestseller: formData.isBestseller,
        isActive: formData.isActive,
        isCodAllowed: formData.isCodAllowed,
        isReturnable: formData.isReturnable,
        images: cleanImages,
        videoUrl: formData.videoUrl.trim() || null,
        colorImages: Object.keys(cleanColorImages).length > 0 ? cleanColorImages : null,
        shippingChargeEnabled: formData.shippingChargeEnabled,
        processingChargeEnabled: formData.processingChargeEnabled,
        packagingChargeEnabled: formData.packagingChargeEnabled,
      };

      if (formData.shippingCharge !== "" && formData.shippingCharge !== null && formData.shippingCharge !== undefined) {
        payload.shippingCharge = Number(formData.shippingCharge);
      } else {
        payload.shippingCharge = null;
      }

      if (formData.processingCharge !== "" && formData.processingCharge !== null && formData.processingCharge !== undefined) {
        payload.processingCharge = Number(formData.processingCharge);
      } else {
        payload.processingCharge = null;
      }

      if (formData.packagingCharge !== "" && formData.packagingCharge !== null && formData.packagingCharge !== undefined) {
        payload.packagingCharge = Number(formData.packagingCharge);
      } else {
        payload.packagingCharge = null;
      }

      if (formData.promoDiscount !== "" && formData.promoDiscount !== null && formData.promoDiscount !== undefined) {
        payload.promoDiscount = Number(formData.promoDiscount);
      } else {
        payload.promoDiscount = null;
      }

      if (formData.discountedPrice !== "" && formData.discountedPrice !== null && formData.discountedPrice !== undefined) {
        payload.discountedPrice = Number(formData.discountedPrice);
      } else {
        payload.discountedPrice = null;
      }

      // Enforce unique slug
      let uniqueSlug = payload.slug;
      let isUnique = false;
      let counter = 0;
      
      while (!isUnique) {
        const qSlug = query(
          collection(db, "products"),
          where("slug", "==", uniqueSlug)
        );
        const slugSnap = await getDocs(qSlug);
        const conflict = slugSnap.docs.some(docSnap => docSnap.id !== (editingProduct?.id || ""));
        if (conflict) {
          counter++;
          uniqueSlug = `${payload.slug}-${counter}`;
        } else {
          isUnique = true;
        }
      }
      payload.slug = uniqueSlug;

      if (editingProduct) {
        // Update Product
        const docRef = doc(db, "products", editingProduct.id);
        await updateDoc(docRef, payload);
        toast.success("Product updated successfully");
      } else {
        // Create Product (Add createdAt field only here)
        payload.createdAt = Timestamp.now();
        await addDoc(collection(db, "products"), payload);
        toast.success("Product created successfully");
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error saving product:", err);
      toast.error("Failed to save product details");
    } finally {
      setSaving(false);
    }
  };

  // Toggle boolean fields instantly from table
  const handleToggleField = async (productId: string, field: "isActive" | "isNewArrival" | "isBestseller", currentValue: boolean) => {
    try {
      const docRef = doc(db, "products", productId);
      await updateDoc(docRef, { [field]: !currentValue });
      toast.success(`Product ${field} updated`);
    } catch (err) {
      console.error("Error toggling field:", err);
      toast.error("Failed to toggle field in database");
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "products", productToDelete.id));
      toast.success("Product deleted successfully");
      setProductToDelete(null);
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  // Filter products list
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminGuard>
      <div className="space-y-6 font-sans">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-wide text-slate-100 uppercase">
              Products
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Manage product listings, pricing details, stocks, and filters
            </p>
          </div>
          <Button
            onClick={openAddDialog}
            className="bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-semibold uppercase tracking-widest px-5 py-3 h-auto"
          >
            <Plus size={14} className="mr-1.5" />
            Add Product
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl shadow-inner">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search products by name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Category:</span>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs w-48 rounded-lg">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Products Grid/Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            <span className="text-xs uppercase tracking-widest text-slate-500">Loading catalog...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-500 text-xs uppercase tracking-widest">
            No products found matching filters.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <Table>
              <TableHeader className="bg-slate-950/80 border-b border-slate-800">
                <TableRow className="hover:bg-transparent border-slate-800">
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 w-16">Image</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Name</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Category</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Price</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Discounted</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Promo Code</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 text-center w-20">Stock</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 text-center w-24">New Arrival</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 text-center w-24">Bestseller</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 text-center w-24">Active</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const hasDiscount = product.discountedPrice !== null && 
                                      product.discountedPrice !== undefined;
                  return (
                    <TableRow key={product.id} className="hover:bg-slate-800/40 border-slate-850 border-b border-slate-800/50">
                      
                      {/* Image Thumbnail */}
                      <TableCell className="py-3">
                        <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-md overflow-hidden flex items-center justify-center">
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={14} className="text-slate-700" />
                          )}
                        </div>
                      </TableCell>

                      {/* Name & Slug */}
                      <TableCell className="py-3 font-medium">
                        <div className="text-slate-100 text-xs">{product.name}</div>
                        <div className="text-[10px] text-slate-500 font-sans tracking-wide truncate max-w-[150px]">{product.slug}</div>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="py-3">
                        <Badge variant="outline" className="bg-slate-950 text-slate-400 border-slate-800 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                          {product.category}
                        </Badge>
                      </TableCell>

                      {/* Regular Price */}
                      <TableCell className="py-3 text-slate-200 text-xs">
                        <div>{formatPrice(product.price)}</div>
                        {((product.shippingChargeEnabled && product.shippingCharge) || 
                          (product.processingChargeEnabled && product.processingCharge) || 
                          (product.packagingChargeEnabled && product.packagingCharge)) ? (
                          <div className="text-[9px] text-slate-500 mt-1 font-sans space-y-0.5 leading-none">
                            {product.shippingChargeEnabled && product.shippingCharge ? <div>Ship: +₹{product.shippingCharge}</div> : null}
                            {product.processingChargeEnabled && product.processingCharge ? <div>Proc: +₹{product.processingCharge}</div> : null}
                            {product.packagingChargeEnabled && product.packagingCharge ? <div>Pkg: +₹{product.packagingCharge}</div> : null}
                          </div>
                        ) : null}
                      </TableCell>

                      {/* Discount Price */}
                      <TableCell className="py-3 text-slate-400 text-xs">
                        {hasDiscount ? (
                          <span className="text-emerald-400 font-semibold">
                            {formatPrice(Number(product.discountedPrice))}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </TableCell>

                      {/* Promo Code */}
                      <TableCell className="py-3 text-xs">
                        {product.promoCode ? (
                          <span className="inline-flex items-center gap-1 bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[10px] font-mono uppercase px-2 py-0.5 rounded">
                            {product.promoCode} {product.promoDiscount ? `(-₹${product.promoDiscount})` : ""}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px]">—</span>
                        )}
                      </TableCell>

                      {/* Stock Level */}
                      <TableCell className="py-3 text-center text-xs">
                        <span className={`font-semibold ${product.stock <= 5 ? "text-amber-500" : "text-slate-300"}`}>
                          {product.stock}
                        </span>
                      </TableCell>

                      {/* isNewArrival toggle */}
                      <TableCell className="py-3 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={!!product.isNewArrival}
                            onCheckedChange={() => handleToggleField(product.id, "isNewArrival", !!product.isNewArrival)}
                          />
                        </div>
                      </TableCell>

                      {/* isBestseller toggle */}
                      <TableCell className="py-3 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={!!product.isBestseller}
                            onCheckedChange={() => handleToggleField(product.id, "isBestseller", !!product.isBestseller)}
                          />
                        </div>
                      </TableCell>

                      {/* isActive toggle */}
                      <TableCell className="py-3 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={product.isActive !== false}
                            onCheckedChange={() => handleToggleField(product.id, "isActive", product.isActive !== false)}
                          />
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => openEditDialog(product)}
                            variant="ghost"
                            size="icon-sm"
                            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 p-1.5 rounded"
                          >
                            <Edit size={13} />
                          </Button>
                          <Button
                            onClick={() => setProductToDelete(product)}
                            variant="ghost"
                            size="icon-sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/20 p-1.5 rounded"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Modal (Dialog) */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-light uppercase tracking-widest text-slate-200">
                {editingProduct ? "Edit Product Details" : "Add New Product"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Maintain strict format guidelines. Product values sync to user storefront catalog immediately.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveProduct} className="space-y-6 mt-4">
              
              {/* Form Grid Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Column Left: Basics */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">
                    Basic Info
                  </h3>

                  {/* Name */}
                  <div className="space-y-1">
                    <Label htmlFor="prod-name" className="text-[10px] uppercase tracking-wider text-slate-400">
                      Product Name
                    </Label>
                    <Input
                      id="prod-name"
                      placeholder="e.g. Atelier Heavyweight Tee"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                      required
                    />
                  </div>

                  {/* Slug */}
                  <div className="space-y-1">
                    <Label htmlFor="prod-slug" className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Slug URL Path</span>
                      {!isSlugEdited && formData.name && (
                        <span className="text-[9px] text-emerald-400 font-sans tracking-wide flex items-center gap-0.5">
                          <Sparkles size={8} /> Auto-generating
                        </span>
                      )}
                    </Label>
                    <Input
                      id="prod-slug"
                      placeholder="e.g. atelier-heavyweight-tee"
                      value={formData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-slate-400">
                      Category Type
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
                        <SelectValue placeholder="Choose Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price & Discount */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="prod-price" className="text-[10px] uppercase tracking-wider text-slate-400">
                        Price (INR)
                      </Label>
                      <Input
                        id="prod-price"
                        type="number"
                        placeholder="1999"
                        value={formData.price || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) || 0 }))}
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                        min="0"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="prod-discount" className="text-[10px] uppercase tracking-wider text-slate-400">
                        Discount Price (Opt)
                      </Label>
                      <Input
                        id="prod-discount"
                        type="number"
                        placeholder="1599"
                        value={formData.discountedPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountedPrice: e.target.value === "" ? "" : Number(e.target.value) }))}
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Shipping, Processing & Packaging Charges */}
                  <div className="space-y-2 p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg">
                    <Label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                      Additional Fees (Optional)
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      
                      {/* Shipping */}
                      <div className="space-y-2 p-2 bg-slate-950/60 border border-slate-800/60 rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Shipping</span>
                          <Switch
                            checked={formData.shippingChargeEnabled}
                            onCheckedChange={(val) => setFormData(prev => ({ ...prev, shippingChargeEnabled: val }))}
                            className="scale-75 origin-right"
                          />
                        </div>
                        <Input
                          type="number"
                          placeholder="₹0"
                          disabled={!formData.shippingChargeEnabled}
                          value={formData.shippingCharge}
                          onChange={(e) => setFormData(prev => ({ ...prev, shippingCharge: e.target.value === "" ? "" : Number(e.target.value) }))}
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800 h-7"
                          min="0"
                        />
                      </div>

                      {/* Processing */}
                      <div className="space-y-2 p-2 bg-slate-950/60 border border-slate-800/60 rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Processing</span>
                          <Switch
                            checked={formData.processingChargeEnabled}
                            onCheckedChange={(val) => setFormData(prev => ({ ...prev, processingChargeEnabled: val }))}
                            className="scale-75 origin-right"
                          />
                        </div>
                        <Input
                          type="number"
                          placeholder="₹0"
                          disabled={!formData.processingChargeEnabled}
                          value={formData.processingCharge}
                          onChange={(e) => setFormData(prev => ({ ...prev, processingCharge: e.target.value === "" ? "" : Number(e.target.value) }))}
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800 h-7"
                          min="0"
                        />
                      </div>

                      {/* Packaging */}
                      <div className="space-y-2 p-2 bg-slate-950/60 border border-slate-800/60 rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Packaging</span>
                          <Switch
                            checked={formData.packagingChargeEnabled}
                            onCheckedChange={(val) => setFormData(prev => ({ ...prev, packagingChargeEnabled: val }))}
                            className="scale-75 origin-right"
                          />
                        </div>
                        <Input
                          type="number"
                          placeholder="₹0"
                          disabled={!formData.packagingChargeEnabled}
                          value={formData.packagingCharge}
                          onChange={(e) => setFormData(prev => ({ ...prev, packagingCharge: e.target.value === "" ? "" : Number(e.target.value) }))}
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800 h-7"
                          min="0"
                        />
                      </div>

                    </div>
                  </div>

                  {/* Stock Level */}
                  <div className="space-y-1">
                    <Label htmlFor="prod-stock" className="text-[10px] uppercase tracking-wider text-slate-400">
                      Stock Inventory Count
                    </Label>
                    <Input
                      id="prod-stock"
                      type="number"
                      placeholder="50"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value === "" ? 0 : Number(e.target.value) }))}
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                      min="0"
                      required
                    />
                  </div>

                  {/* Promo Code & Promo Discount */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="prod-promocode" className="text-[10px] uppercase tracking-wider text-amber-400/90 font-medium">
                        Product Promo Code (Opt)
                      </Label>
                      <Input
                        id="prod-promocode"
                        placeholder="e.g. SUMMER20"
                        value={formData.promoCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, promoCode: e.target.value.toUpperCase() }))}
                        className="bg-slate-950 border-amber-500/30 text-amber-300 text-xs placeholder:text-slate-800 uppercase"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="prod-promodiscount" className="text-[10px] uppercase tracking-wider text-amber-400/90 font-medium">
                        Promo Discount (₹)
                      </Label>
                      <Input
                        id="prod-promodiscount"
                        type="number"
                        placeholder="300"
                        value={formData.promoDiscount}
                        onChange={(e) => setFormData(prev => ({ ...prev, promoDiscount: e.target.value === "" ? "" : Number(e.target.value) }))}
                        className="bg-slate-950 border-amber-500/30 text-amber-300 text-xs placeholder:text-slate-800"
                        min="0"
                      />
                    </div>
                  </div>

                </div>

                {/* Column Right: Material/Sizing Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">
                    Material & Fit Details
                  </h3>

                  {/* Description */}
                  <div className="space-y-1">
                    <Label htmlFor="prod-desc" className="text-[10px] uppercase tracking-wider text-slate-400">
                      Product Narrative/Description
                    </Label>
                    <Textarea
                      id="prod-desc"
                      placeholder="Narrate details and aesthetics..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                      rows={3}
                    />
                  </div>

                  {/* Fabric details */}
                  <div className="space-y-1">
                    <Label htmlFor="prod-fabric" className="text-[10px] uppercase tracking-wider text-slate-400">
                      Fabric / Composition
                    </Label>
                    <Input
                      id="prod-fabric"
                      placeholder="e.g. 100% Organic Combed Cotton"
                      value={formData.fabric}
                      onChange={(e) => setFormData(prev => ({ ...prev, fabric: e.target.value }))}
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-850"
                    />
                  </div>

                  {/* Fit details */}
                  <div className="space-y-1">
                    <Label htmlFor="prod-fit" className="text-[10px] uppercase tracking-wider text-slate-400">
                      Silhouette / Fit instructions
                    </Label>
                    <Input
                      id="prod-fit"
                      placeholder="e.g. Relaxed boxy fit. Take normal size."
                      value={formData.fit}
                      onChange={(e) => setFormData(prev => ({ ...prev, fit: e.target.value }))}
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-850"
                    />
                  </div>

                  {/* Care details */}
                  <div className="space-y-1">
                    <Label htmlFor="prod-care" className="text-[10px] uppercase tracking-wider text-slate-400">
                      Wash & Care Guidelines
                    </Label>
                    <Input
                      id="prod-care"
                      placeholder="e.g. Machine wash cold, dry flat."
                      value={formData.care}
                      onChange={(e) => setFormData(prev => ({ ...prev, care: e.target.value }))}
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-850"
                    />
                  </div>

                </div>

              </div>

              {/* Sizes Tag Input & Presets */}
              <div className="space-y-2 p-4 bg-slate-950/30 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-wider text-slate-400">
                    Sizes List (Apparel or Footwear UK)
                  </Label>
                  
                  {/* Preset helpers */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 uppercase">Presets:</span>
                    <Button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, sizes: Array.from(new Set([...prev.sizes, ...presetSizesApparel])) }))}
                      variant="ghost" 
                      className="text-[9px] text-slate-400 hover:text-slate-100 hover:bg-slate-800 px-2 py-0.5 h-auto rounded"
                    >
                      Apparel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, sizes: Array.from(new Set([...prev.sizes, ...presetSizesShoes])) }))}
                      variant="ghost" 
                      className="text-[9px] text-slate-400 hover:text-slate-100 hover:bg-slate-800 px-2 py-0.5 h-auto rounded"
                    >
                      Footwear
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 border border-slate-800 rounded-lg min-h-[42px] items-center">
                  {formData.sizes.map(size => (
                    <span key={size} className="flex items-center gap-1 bg-slate-900 text-slate-200 text-xs px-2.5 py-1 rounded-md border border-slate-800">
                      {size}
                      <button type="button" onClick={() => removeSize(size)} className="text-slate-500 hover:text-red-400 font-bold ml-1 text-sm leading-none focus:outline-none">
                        &times;
                      </button>
                    </span>
                  ))}
                  <input
                    value={sizeInput}
                    onChange={e => setSizeInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSize(sizeInput);
                      }
                    }}
                    placeholder="Type size and press Enter..."
                    className="bg-transparent border-0 outline-none focus:ring-0 text-xs flex-1 min-w-[120px] text-slate-200"
                  />
                </div>
              </div>

              {/* Colors Tag Input & Presets */}
              <div className="space-y-2 p-4 bg-slate-950/30 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-wider text-slate-400">
                    Colors List
                  </Label>
                  
                  {/* Preset helpers */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 uppercase">Presets:</span>
                    <Button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, colors: Array.from(new Set([...prev.colors, ...presetColors])) }))}
                      variant="ghost" 
                      className="text-[9px] text-slate-400 hover:text-slate-100 hover:bg-slate-800 px-2 py-0.5 h-auto rounded"
                    >
                      Neutrals
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 border border-slate-800 rounded-lg min-h-[42px] items-center">
                  {formData.colors.map(color => (
                    <span key={color} className="flex items-center gap-1 bg-slate-900 text-slate-200 text-xs px-2.5 py-1 rounded-md border border-slate-800">
                      {color}
                      <button type="button" onClick={() => removeColor(color)} className="text-slate-500 hover:text-red-400 font-bold ml-1 text-sm leading-none focus:outline-none">
                        &times;
                      </button>
                    </span>
                  ))}
                  <input
                    value={colorInput}
                    onChange={e => setColorInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addColor(colorInput);
                      }
                    }}
                    placeholder="Type color and press Enter..."
                    className="bg-transparent border-0 outline-none focus:ring-0 text-xs flex-1 min-w-[120px] text-slate-200"
                  />
                </div>
              </div>

              {/* Images list URL */}
              <div className="space-y-2 p-4 bg-slate-950/30 border border-slate-800 rounded-xl">
                <Label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                  Product Image URLs (Limit 1 - 5)
                </Label>
                
                <div className="space-y-2">
                  {formData.images.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="text-[10px] font-sans font-medium text-slate-500 w-5">#{idx + 1}</div>
                      <Input
                        value={url}
                        onChange={e => {
                          const val = e.target.value;
                          const newImages = [...formData.images];
                          newImages[idx] = val;
                          setFormData({ ...formData, images: newImages });

                          if (val.includes("ibb.co") && !val.includes("i.ibb.co")) {
                            fetch(`/api/resolve-image?url=${encodeURIComponent(val.trim())}`)
                              .then(r => r.json())
                              .then(data => {
                                if (data.resolvedUrl) {
                                  setFormData(prev => {
                                    const updated = [...prev.images];
                                    if (updated.length > idx) {
                                      updated[idx] = data.resolvedUrl;
                                    }
                                    return { ...prev, images: updated };
                                  });
                                }
                              })
                              .catch(err => console.error("Error resolving url", err));
                          }
                        }}
                        placeholder={`e.g. https://images.unsplash.com/photo-...`}
                        className="bg-slate-950 border-slate-800 text-xs flex-1"
                        required={idx === 0}
                      />
                      {formData.images.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              images: formData.images.filter((_, i) => i !== idx)
                            });
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/20 p-2 h-auto"
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {formData.images.length < 5 && (
                  <div className="pt-1">
                    <Button
                      type="button"
                      onClick={() => setFormData({ ...formData, images: [...formData.images, ""] })}
                      variant="outline"
                      className="border-slate-800 hover:bg-slate-950 text-slate-300 text-[10px] uppercase tracking-wider py-1 px-3 h-auto"
                    >
                      <Plus size={11} className="mr-1" /> Add Image row
                    </Button>
                  </div>
                )}
              </div>

              {/* Product Video URL (Optional) */}
              <div className="space-y-2 p-4 bg-slate-950/30 border border-slate-800 rounded-xl">
                <Label htmlFor="prod-video" className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                  Product Video URL (Optional)
                </Label>
                <Input
                  id="prod-video"
                  value={formData.videoUrl}
                  onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="e.g. https://www.w3schools.com/html/mov_bbb.mp4 or YouTube embed/file link"
                  className="bg-slate-950 border-slate-800 text-xs text-slate-200 placeholder:text-slate-850"
                />
                <p className="text-[9px] text-slate-500 uppercase tracking-wide">
                  Paste direct MP4 link, YouTube URL, or cloud hosted video path for storefront media gallery.
                </p>
              </div>

              {/* Color Specific Images Section */}
              {formData.colors.length > 0 && (
                <div className="space-y-4 p-4 bg-slate-950/30 border border-slate-800 rounded-xl">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                      Color Specific Images (Optional)
                    </Label>
                    <p className="text-[9px] text-slate-500 uppercase font-sans tracking-wide">
                      Add custom image links for each color to display them first on the storefront buy now page
                    </p>
                  </div>
                  
                  <div className="space-y-3 mt-2">
                    {formData.colors.map(color => {
                      const colorSpecificUrls = formData.colorImages[color] || [""];
                      return (
                        <div key={color} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                            <span className="text-xs font-semibold text-slate-350 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-600 border border-slate-800" />
                              Color Variant: {color}
                            </span>
                            <span className="text-[9px] text-slate-500 uppercase">
                              {colorSpecificUrls.filter(u => u.trim() !== "").length} images added
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {colorSpecificUrls.map((url, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-[9px] font-sans text-slate-650 w-4 font-mono">#{idx+1}</span>
                                <Input
                                  value={url}
                                  onChange={e => {
                                    const val = e.target.value;
                                    const updatedUrls = [...colorSpecificUrls];
                                    updatedUrls[idx] = val;
                                    
                                    // Auto resolve ImgBB links
                                    if (val.includes("ibb.co") && !val.includes("i.ibb.co")) {
                                      fetch(`/api/resolve-image?url=${encodeURIComponent(val.trim())}`)
                                        .then(r => r.json())
                                        .then(data => {
                                          if (data.resolvedUrl) {
                                            setFormData(prev => {
                                              const prevUrls = [...(prev.colorImages[color] || [""])];
                                              if (prevUrls.length > idx) {
                                                prevUrls[idx] = data.resolvedUrl;
                                              }
                                              return {
                                                ...prev,
                                                colorImages: {
                                                  ...prev.colorImages,
                                                  [color]: prevUrls
                                                }
                                              };
                                            });
                                          }
                                        })
                                        .catch(err => console.error("Error resolving url", err));
                                    }
                                    
                                    setFormData(prev => ({
                                      ...prev,
                                      colorImages: {
                                        ...prev.colorImages,
                                        [color]: updatedUrls
                                      }
                                    }));
                                  }}
                                  placeholder={`Image link for ${color}...`}
                                  className="bg-slate-950 border-slate-800 text-[11px] h-8 flex-1 text-slate-300"
                                />
                                {colorSpecificUrls.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                      const updated = colorSpecificUrls.filter((_, i) => i !== idx);
                                      setFormData(prev => ({
                                        ...prev,
                                        colorImages: {
                                          ...prev.colorImages,
                                          [color]: updated
                                        }
                                      }));
                                    }}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-950/20 p-2 h-8"
                                  >
                                    <Trash2 size={13} />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <Button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                colorImages: {
                                  ...prev.colorImages,
                                  [color]: [...colorSpecificUrls, ""]
                                }
                              }));
                            }}
                            variant="ghost"
                            className="text-[9px] uppercase tracking-wider text-slate-400 hover:text-slate-200 h-7 px-3 border border-slate-800/80 hover:bg-slate-900/50"
                          >
                            + Add {color} Image Row
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Switches Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4 p-4 bg-slate-950/30 border border-slate-800 rounded-xl">
                
                <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/80 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="switch-new" className="text-xs font-medium text-slate-300">New Arrival</Label>
                    <p className="text-[9px] text-slate-500 uppercase font-sans tracking-wide">Featured first on store</p>
                  </div>
                  <Switch
                    id="switch-new"
                    checked={formData.isNewArrival}
                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, isNewArrival: val }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/80 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="switch-best" className="text-xs font-medium text-slate-300">Bestseller</Label>
                    <p className="text-[9px] text-slate-500 uppercase font-sans tracking-wide">Popular drops tag</p>
                  </div>
                  <Switch
                    id="switch-best"
                    checked={formData.isBestseller}
                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, isBestseller: val }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/80 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="switch-active" className="text-xs font-medium text-slate-300">Active Listing</Label>
                    <p className="text-[9px] text-slate-500 uppercase font-sans tracking-wide">Visible to clients</p>
                  </div>
                  <Switch
                    id="switch-active"
                    checked={formData.isActive}
                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, isActive: val }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/80 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="switch-cod" className="text-xs font-medium text-slate-300">Allow COD</Label>
                    <p className="text-[9px] text-slate-500 uppercase font-sans tracking-wide">Cash on Delivery option</p>
                  </div>
                  <Switch
                    id="switch-cod"
                    checked={formData.isCodAllowed}
                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, isCodAllowed: val }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/80 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="switch-returnable" className="text-xs font-medium text-slate-300">Allow Returns</Label>
                    <p className="text-[9px] text-slate-500 uppercase font-sans tracking-wide">Can return or exchange</p>
                  </div>
                  <Switch
                    id="switch-returnable"
                    checked={formData.isReturnable}
                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, isReturnable: val }))}
                  />
                </div>

              </div>

              {/* Dialog Footer Actions */}
              <DialogFooter className="border-t border-slate-800 pt-4 flex flex-row items-center justify-end gap-2">
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
                  {saving ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                    </span>
                  ) : (
                    "Save Product"
                  )}
                </Button>
              </DialogFooter>

            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal (Dialog) */}
        <Dialog open={!!productToDelete} onOpenChange={(open) => { if (!open) setProductToDelete(null); }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg font-light uppercase tracking-widest text-slate-200">
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Are you sure you want to delete <span className="font-semibold text-slate-300">{productToDelete?.name}</span>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex items-center justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                onClick={() => setProductToDelete(null)}
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
