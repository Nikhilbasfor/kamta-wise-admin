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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { Search, Loader2, RefreshCw } from "lucide-react";

interface OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
    discountedPrice?: number;
    images: string[];
  };
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  total: number;
  address: string;
  phone: string;
  userId: string;
  userName: string;
  userEmail: string;
  items?: OrderItem[];
}

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursorStack, setCursorStack] = useState<(QueryDocumentSnapshot | null)[]>([null]);

  // View Items Modal State
  const [viewItemsOrder, setViewItemsOrder] = useState<Order | null>(null);

  // Edit Status Modal States
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<"Processing" | "Shipped" | "Delivered" | "Cancelled">("Processing");
  const [courierPartner, setCourierPartner] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async (cursor: QueryDocumentSnapshot | null = null, showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);
    try {
      // Query top-level /orders collection, ordered by createdAt descending
      let q = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE + 1)
      );
      if (cursor) {
        q = query(
          collection(db, "orders"),
          orderBy("createdAt", "desc"),
          startAfter(cursor),
          limit(PAGE_SIZE + 1)
        );
      }

      const snap = await getDocs(q);
      const docs = snap.docs;

      // Check if there are more pages
      if (docs.length > PAGE_SIZE) {
        setHasMore(true);
        docs.pop(); // Remove the extra doc used for lookahead
      } else {
        setHasMore(false);
      }

      const fetched = docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Order[];

      if (docs.length > 0) {
        setLastDoc(docs[docs.length - 1]);
      }

      setOrders(fetched);
      if (showRefreshToast) toast.success("Orders refreshed");
    } catch (err) {
      console.error("Error loading orders:", err);
      toast.error("Failed to load orders database");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(null);
  }, []);

  const goToNextPage = () => {
    if (!hasMore || !lastDoc) return;
    setCursorStack((prev) => [...prev, lastDoc]);
    setCurrentPage((p) => p + 1);
    fetchOrders(lastDoc);
  };

  const goToPrevPage = () => {
    if (currentPage <= 1) return;
    const newStack = [...cursorStack];
    newStack.pop();
    setCursorStack(newStack);
    setCurrentPage((p) => p - 1);
    fetchOrders(newStack[newStack.length - 1]);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setCursorStack([null]);
    setLastDoc(null);
    setHasMore(true);
    fetchOrders(null, true);
  };

  const openStatusModal = (order: Order & { courierPartner?: string; trackingNumber?: string }) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setCourierPartner(order.courierPartner || "Delhivery");
    setTrackingNumber(order.trackingNumber || "");
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const updateData = {
        status: newStatus,
        courierPartner: courierPartner || "Delhivery",
        trackingNumber: trackingNumber || "",
      };

      // 1. Update top-level /orders document
      const topLevelRef = doc(db, "orders", selectedOrder.id);
      await updateDoc(topLevelRef, updateData);

      // 2. Update subcollection document
      if (selectedOrder.userId) {
        const orderDocRef = doc(db, "users", selectedOrder.userId, "orders", selectedOrder.id);
        await updateDoc(orderDocRef, updateData).catch((e) => console.warn("Subcollection sync failed:", e));
      }

      // 3. Sync inside parent users profile orders list array
      if (selectedOrder.userId) {
        const userDocRef = doc(db, "users", selectedOrder.userId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (Array.isArray(userData.orders)) {
            const updatedOrders = userData.orders.map((o: any) => {
              if (o.orderNumber === selectedOrder.orderNumber) {
                return { ...o, ...updateData };
              }
              return o;
            });
            await updateDoc(userDocRef, { orders: updatedOrders });
          }
        }
      }

      toast.success(`Order ${selectedOrder.orderNumber} status updated to ${newStatus}`);
      setSelectedOrder(null);
      // Re-fetch current page
      fetchOrders(cursorStack[cursorStack.length - 1]);
    } catch (err) {
      console.error("Error updating order status:", err);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "Processing":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px] uppercase px-2 py-0.5">
            Processing
          </Badge>
        );
      case "Shipped":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] uppercase px-2 py-0.5">
            Shipped
          </Badge>
        );
      case "Delivered":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase px-2 py-0.5">
            Delivered
          </Badge>
        );
      case "Cancelled":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] uppercase px-2 py-0.5">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-400 border-slate-800 text-[10px] uppercase px-2 py-0.5">
            {status}
          </Badge>
        );
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminGuard>
      <div className="space-y-6 font-sans">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-wide text-slate-100 uppercase">
              Orders
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Monitor customer purchases, shipping status, addresses and delivery logs
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="border-slate-800 hover:bg-slate-900 text-slate-300 text-xs uppercase tracking-wider"
          >
            {refreshing ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1.5" />
            )}
            Refresh Grid
          </Button>
        </div>

        {/* Filters control bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl shadow-inner">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by order number, customer name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-650 text-xs rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs w-44 rounded-lg">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Shipped">Shipped</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders Table view */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            <span className="text-xs uppercase tracking-widest text-slate-500">Loading orders database...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-500 text-xs uppercase tracking-widest">
            No customer orders matching selected filters.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <Table>
              <TableHeader className="bg-slate-950/80 border-b border-slate-800">
                <TableRow className="hover:bg-transparent border-slate-800">
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Order Number</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Customer</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 hidden md:table-cell">Items</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Date</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Total</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Shipping Address</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Phone</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 text-center w-28">Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-800/40 border-slate-850 border-b border-slate-800/50">
                    
                    {/* Order Number */}
                    <TableCell className="py-4 text-xs font-mono font-bold text-slate-100">
                      {order.orderNumber}
                    </TableCell>

                    {/* Customer */}
                    <TableCell className="py-4">
                      <div className="text-xs font-medium text-slate-200">{order.userName}</div>
                      <div className="text-[10px] text-slate-500 font-sans tracking-wide truncate max-w-[140px]">{order.userEmail}</div>
                      {/* Mobile-only view items trigger */}
                      <div className="md:hidden mt-2">
                        <Button
                          onClick={() => setViewItemsOrder(order)}
                          variant="outline"
                          className="h-6 border-slate-800 bg-slate-950/60 text-[9px] uppercase tracking-wider px-2 py-0.5 text-slate-300 hover:bg-slate-900 hover:text-slate-100 rounded-md"
                        >
                          Items ({order.items?.length || 0})
                        </Button>
                      </div>
                    </TableCell>

                    {/* Items */}
                    <TableCell 
                      className="py-4 hidden md:table-cell cursor-pointer hover:bg-slate-850/30 transition-colors"
                      onClick={() => setViewItemsOrder(order)}
                      title="Click to view full details"
                    >
                      <div className="space-y-1 max-w-[200px]">
                        {order.items && order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="text-[11px] leading-tight text-slate-300">
                            <span className="font-semibold text-slate-100">{item.quantity}x</span> {item.product?.name || "Product"}
                            <span className="text-[9px] text-slate-500 block">
                              Size: {item.selectedSize} · Color: {item.selectedColor}
                            </span>
                          </div>
                        ))}
                        {order.items && order.items.length > 2 && (
                          <div className="text-[9px] text-slate-400 font-medium mt-1 hover:text-slate-200">
                            + {order.items.length - 2} more items...
                          </div>
                        )}
                        {(!order.items || order.items.length === 0) && (
                          <span className="text-slate-600 italic text-[11px]">No items info</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="py-4 text-xs text-slate-400">
                      {order.date}
                    </TableCell>

                    {/* Total Price */}
                    <TableCell className="py-4 text-xs font-semibold text-slate-200">
                      {formatPrice(order.total)}
                    </TableCell>

                    {/* Shipping Address */}
                    <TableCell className="py-4 text-xs text-slate-400 max-w-[200px] truncate">
                      <span title={order.address}>{order.address}</span>
                    </TableCell>

                    {/* Phone Number */}
                    <TableCell className="py-4 text-xs text-slate-400 font-mono">
                      +91 {order.phone}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-4 text-center">
                      {getStatusBadge(order.status)}
                    </TableCell>

                    {/* Update Status trigger action */}
                    <TableCell className="py-4 text-right">
                      <Button
                        onClick={() => openStatusModal(order)}
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 text-[10px] uppercase tracking-wider px-2 py-1 h-auto"
                      >
                        Update Status
                      </Button>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && orders.length > 0 && (
          <div className="flex items-center justify-between bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
              Page {currentPage} · Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                variant="outline"
                className="border-slate-800 hover:bg-slate-900 text-slate-300 text-xs uppercase tracking-wider disabled:opacity-30"
              >
                ← Previous
              </Button>
              <Button
                onClick={goToNextPage}
                disabled={!hasMore}
                variant="outline"
                className="border-slate-800 hover:bg-slate-900 text-slate-300 text-xs uppercase tracking-wider disabled:opacity-30"
              >
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* Update Status Modal Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-light uppercase tracking-widest text-slate-200">
                Update Order Status
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Modify delivery metrics. System updates users profile dashboard in real-time.
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-4 py-2 text-xs font-sans">
                
                {/* Details summary */}
                <div className="p-4 bg-slate-950/65 border border-slate-800/80 rounded-xl space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Order Number:</span>
                    <span className="font-mono font-bold text-slate-350">{selectedOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Customer:</span>
                    <span className="text-slate-300 font-medium">{selectedOrder.userName} ({selectedOrder.userEmail})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Total Bill:</span>
                    <span className="text-slate-200 font-semibold">{formatPrice(selectedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Current Status:</span>
                    <span>{getStatusBadge(selectedOrder.status)}</span>
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                    Items List
                  </Label>
                  <div className="space-y-2 bg-slate-950/65 border border-slate-800/80 rounded-xl p-3 max-h-40 overflow-y-auto">
                    {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-[11px] border-b border-slate-900 last:border-0 pb-1.5 last:pb-0">
                        <div>
                          <span className="text-slate-200 font-medium">{item.product?.name || "Product"}</span>
                          <span className="text-slate-550 block mt-0.5 text-[9px] uppercase tracking-wide">
                            Size: {item.selectedSize} · Color: {item.selectedColor}
                          </span>
                        </div>
                        <span className="text-slate-350 font-mono text-[10px]">Qty: {item.quantity}</span>
                      </div>
                    ))}
                    {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                      <span className="text-slate-600 italic text-[11px]">No items info</span>
                    )}
                  </div>
                </div>

                {/* Status select input */}
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                    Select New Order Status
                  </Label>
                  <Select 
                    value={newStatus} 
                    onValueChange={(val) => setNewStatus(val as Order["status"])}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-lg">
                      <SelectValue placeholder="Choose Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Courier & Tracking Details */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                      Courier Partner
                    </Label>
                    <Input
                      placeholder="e.g. Delhivery, BlueDart"
                      value={courierPartner}
                      onChange={(e) => setCourierPartner(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-lg placeholder:text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                      Tracking / AWB Number
                    </Label>
                    <Input
                      placeholder="e.g. AWB987654321"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-lg placeholder:text-slate-700"
                    />
                  </div>
                </div>

                {/* Footer Controls */}
                <DialogFooter className="border-t border-slate-800 pt-4 flex items-center justify-end gap-2 mt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedOrder(null)}
                    className="text-slate-400 hover:text-slate-200 text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={updating}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-semibold uppercase tracking-widest px-6"
                  >
                    {updating ? "Saving..." : "Save Status"}
                  </Button>
                </DialogFooter>

              </div>
            )}

          </DialogContent>
        </Dialog>

        {/* View Items Details Modal Dialog */}
        <Dialog open={!!viewItemsOrder} onOpenChange={(open) => { if (!open) setViewItemsOrder(null); }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-light uppercase tracking-widest text-slate-200">
                Order Items & Customer Details
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Full purchase invoice breakdown and customer identity details.
              </DialogDescription>
            </DialogHeader>

            {viewItemsOrder && (
              <div className="space-y-5 py-2 text-xs font-sans">
                {/* Customer / Order Metadata */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950/65 border border-slate-800/80 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-slate-500 uppercase tracking-wider text-[9px] block">Order Number</span>
                    <span className="font-mono font-bold text-slate-200 text-xs">{viewItemsOrder.orderNumber}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 uppercase tracking-wider text-[9px] block">Order Date</span>
                    <span className="text-slate-200 text-xs">{viewItemsOrder.date}</span>
                  </div>
                  <div className="space-y-1 col-span-2 border-t border-slate-900 pt-2">
                    <span className="text-slate-500 uppercase tracking-wider text-[9px] block">Customer Identity</span>
                    <span className="text-slate-250 font-medium text-xs block">{viewItemsOrder.userName}</span>
                    <span className="text-slate-400 block">{viewItemsOrder.userEmail}</span>
                    <span className="text-slate-400 block font-mono">+91 {viewItemsOrder.phone}</span>
                  </div>
                  <div className="space-y-1 col-span-2 border-t border-slate-900 pt-2">
                    <span className="text-slate-500 uppercase tracking-wider text-[9px] block">Shipping Address</span>
                    <span className="text-slate-300 leading-relaxed block">{viewItemsOrder.address}</span>
                  </div>
                </div>

                {/* Items Breakdown list */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-wider text-slate-400 block">
                    Ordered Products ({viewItemsOrder.items?.length || 0})
                  </Label>
                  <div className="space-y-3 bg-slate-950/65 border border-slate-800/80 rounded-xl p-4 max-h-60 overflow-y-auto">
                    {viewItemsOrder.items && viewItemsOrder.items.map((item, idx) => {
                      const itemPrice = item.product?.discountedPrice ?? item.product?.price ?? 0;
                      const itemSubtotal = itemPrice * item.quantity;
                      return (
                        <div key={idx} className="flex gap-3 items-start border-b border-slate-900 last:border-0 pb-3 last:pb-0">
                          {/* Product Image preview */}
                          {item.product?.images && item.product.images.length > 0 ? (
                            <div className="w-12 h-14 bg-slate-900 rounded border border-slate-800 overflow-hidden flex-shrink-0 relative">
                              <img 
                                src={item.product.images[0]} 
                                alt={item.product.name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-14 bg-slate-900 rounded border border-slate-800 flex-shrink-0 flex items-center justify-center text-[9px] text-slate-650">
                              No Pic
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-slate-200 font-medium text-xs block leading-tight truncate" title={item.product?.name}>
                              {item.product?.name || "Product Name"}
                            </span>
                            <span className="text-slate-500 block mt-0.5 text-[9px] uppercase tracking-wide">
                              Size: {item.selectedSize} · Color: {item.selectedColor}
                            </span>
                            <span className="text-slate-400 block mt-1 text-[10px]">
                              {formatPrice(itemPrice)} × {item.quantity}
                            </span>
                          </div>
                          <span className="text-slate-200 font-semibold text-xs font-sans self-center">
                            {formatPrice(itemSubtotal)}
                          </span>
                        </div>
                      );
                    })}
                    {(!viewItemsOrder.items || viewItemsOrder.items.length === 0) && (
                      <span className="text-slate-650 italic text-xs block text-center py-4">No items details found.</span>
                    )}
                  </div>
                </div>

                {/* Bill / Price invoice */}
                <div className="flex justify-between items-center p-4 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                  <span className="text-slate-400 uppercase tracking-widest text-[10px] font-semibold">Total Amount Charged</span>
                  <span className="text-lg font-bold text-slate-100 font-sans">{formatPrice(viewItemsOrder.total)}</span>
                </div>

                {/* Footer Controls */}
                <DialogFooter className="border-t border-slate-800 pt-4 flex items-center justify-end">
                  <Button
                    type="button"
                    onClick={() => setViewItemsOrder(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-semibold uppercase tracking-widest px-8"
                  >
                    Close Invoice
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </AdminGuard>
  );
}
