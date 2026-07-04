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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Search, Loader2, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  joined: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const userRowsPromises = usersSnap.docs.map(async (userDoc) => {
        const data = userDoc.data();
        const userId = userDoc.id;
        
        // Fetch count of orders subcollection per user
        let ordersCount = 0;
        try {
          const ordersSnap = await getDocs(collection(db, "users", userId, "orders"));
          ordersCount = ordersSnap.size;
        } catch (e) {
          console.error(`Error loading orders for user ${userId}:`, e);
        }

        // Handle joined date fallback
        let joinedDateStr = "—";
        if (data.createdAt) {
          if (typeof data.createdAt.seconds === "number") {
            joinedDateStr = new Date(data.createdAt.seconds * 1000).toLocaleDateString();
          } else {
            joinedDateStr = new Date(data.createdAt).toLocaleDateString();
          }
        }

        return {
          id: userId,
          name: data.name || "Guest Customer",
          email: data.email || "No Email Address",
          phone: data.phone || "—",
          address: data.address || "—",
          totalOrders: ordersCount,
          joined: joinedDateStr,
        };
      });

      const resolvedUsers = await Promise.all(userRowsPromises);
      setUsers(resolvedUsers);
    } catch (err) {
      console.error("Error fetching users list:", err);
      toast.error("Failed to load users directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <AdminGuard>
      <div className="space-y-6 font-sans">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-wide text-slate-100 uppercase">
              Users
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Directory of registered customer profiles, contact credentials, and purchase frequency
            </p>
          </div>
        </div>

        {/* Filters control bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl shadow-inner">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search users by name or email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-650 text-xs rounded-lg"
            />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-medium bg-slate-950 px-3 py-2 border border-slate-800 rounded-lg">
            Total Accounts: <span className="font-bold text-slate-100">{users.length}</span>
          </div>
        </div>

        {/* Users Table view */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            <span className="text-xs uppercase tracking-widest text-slate-500">Loading user catalog...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-500 text-xs uppercase tracking-widest">
            No registered users found matching selected filters.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <Table>
              <TableHeader className="bg-slate-950/80 border-b border-slate-800">
                <TableRow className="hover:bg-transparent border-slate-800">
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Customer Name</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Email Address</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Phone</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Default Address</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 text-center w-28">Total Orders</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 w-28">Joined Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-slate-800/40 border-slate-850 border-b border-slate-800/50">
                    
                    {/* Customer Name */}
                    <TableCell className="py-4 text-xs font-semibold text-slate-200">
                      {u.name}
                    </TableCell>

                    {/* Email */}
                    <TableCell className="py-4 text-xs text-slate-400 font-mono">
                      {u.email}
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="py-4 text-xs text-slate-400 font-mono">
                      {u.phone}
                    </TableCell>

                    {/* Address */}
                    <TableCell className="py-4 text-xs text-slate-500 max-w-[200px] truncate">
                      <span title={u.address}>{u.address}</span>
                    </TableCell>

                    {/* Total Orders count badge */}
                    <TableCell className="py-4 text-center">
                      <Badge variant="outline" className={`text-[10px] font-bold px-2.5 py-0.5 rounded border-slate-800 font-mono ${u.totalOrders > 0 ? "bg-slate-950 text-slate-200" : "bg-transparent text-slate-600"}`}>
                        {u.totalOrders}
                      </Badge>
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell className="py-4 text-xs text-slate-500">
                      {u.joined}
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

      </div>
    </AdminGuard>
  );
}
