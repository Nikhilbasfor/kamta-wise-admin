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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp 
} from "firebase/firestore";
import { 
  Search, 
  Check, 
  X, 
  Trash2, 
  Loader2, 
  Sparkles, 
  ExternalLink
} from "lucide-react";

interface InfluencerApplication {
  id: string;
  handle: string;
  followers: string;
  location: string;
  whyCollab: string;
  name?: string;
  email?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt?: Timestamp;
}

export default function InfluencersPage() {
  const [applications, setApplications] = useState<InfluencerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const q = query(collection(db, "influencerApplications"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const list: InfluencerApplication[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as InfluencerApplication);
        });
        setApplications(list);
        setLoading(false);
      }, 
      (error) => {
        console.error("Error fetching influencer applications:", error);
        toast.error("Failed to load influencer applications");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "accepted" | "rejected") => {
    try {
      await updateDoc(doc(db, "influencerApplications", id), { status: newStatus });
      toast.success(`Application marked as ${newStatus}`);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    try {
      await deleteDoc(doc(db, "influencerApplications", id));
      toast.success("Application deleted");
    } catch (err) {
      console.error("Error deleting application:", err);
      toast.error("Failed to delete application");
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch = 
      (app.handle && app.handle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.name && app.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.email && app.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.whyCollab && app.whyCollab.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp || !timestamp.toDate) return "Recent";
    return timestamp.toDate().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getCleanInstaLink = (handle: string) => {
    const clean = handle.replace("@", "").trim();
    return `https://instagram.com/${clean}`;
  };

  return (
    <AdminGuard>
      <div className="space-y-6 font-sans">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-wide text-slate-100 uppercase flex items-center gap-2">
              <Sparkles className="text-amber-400" size={28} />
              Influencer Collaborations
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Review and manage partnership applications from content creators
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-slate-900 border-slate-800 text-slate-300 px-3 py-1 text-xs">
              Total: {applications.length}
            </Badge>
            <Badge variant="outline" className="bg-amber-950/40 border-amber-500/30 text-amber-300 px-3 py-1 text-xs">
              Pending: {applications.filter(a => a.status === "pending" || !a.status).length}
            </Badge>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl shadow-inner">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search handle, name, email or pitch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Status:</span>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {(["all", "pending", "accepted", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-md uppercase tracking-wider text-[10px] font-semibold transition-colors ${
                    statusFilter === s
                      ? "bg-slate-800 text-slate-100"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Applications Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            <span className="text-xs uppercase tracking-widest text-slate-500">Loading collaboration applications...</span>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-500 text-xs uppercase tracking-widest">
            No influencer applications found matching criteria.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <Table>
              <TableHeader className="bg-slate-950/80 border-b border-slate-800">
                <TableRow className="hover:bg-transparent border-slate-800">
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Handle / Creator</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Followers</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Location</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 max-w-xs">Why Collaborate? (Pitch)</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Applied On</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApps.map((app) => (
                  <TableRow key={app.id} className="hover:bg-slate-800/40 border-b border-slate-800/50">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={getCleanInstaLink(app.handle)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-slate-100 hover:text-amber-400 text-xs flex items-center gap-1 transition-colors"
                        >
                          {app.handle}
                          <ExternalLink size={12} className="text-slate-500" />
                        </a>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{app.name || "N/A"}</div>
                      <div className="text-[10px] text-slate-500">{app.email || ""}</div>
                    </TableCell>

                    <TableCell className="py-4">
                      <span className="font-semibold text-slate-200 text-xs">{app.followers}</span>
                    </TableCell>

                    <TableCell className="py-4 text-xs text-slate-400">
                      {app.location || "Global"}
                    </TableCell>

                    <TableCell className="py-4 max-w-xs">
                      <div className="text-xs text-slate-300 font-light leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 whitespace-pre-line">
                        {app.whyCollab || <span className="text-slate-600 italic">No pitch provided</span>}
                      </div>
                    </TableCell>

                    <TableCell className="py-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(app.createdAt)}
                    </TableCell>

                    <TableCell className="py-4">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 font-semibold ${
                          app.status === "accepted"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                            : app.status === "rejected"
                            ? "bg-red-950/40 text-red-400 border-red-500/30"
                            : "bg-amber-950/40 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {app.status || "pending"}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {app.status !== "accepted" && (
                          <Button
                            onClick={() => handleUpdateStatus(app.id, "accepted")}
                            variant="ghost"
                            size="icon-sm"
                            title="Accept Application"
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20 p-1.5 rounded"
                          >
                            <Check size={14} />
                          </Button>
                        )}
                        {app.status !== "rejected" && (
                          <Button
                            onClick={() => handleUpdateStatus(app.id, "rejected")}
                            variant="ghost"
                            size="icon-sm"
                            title="Reject Application"
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/20 p-1.5 rounded"
                          >
                            <X size={14} />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDelete(app.id)}
                          variant="ghost"
                          size="icon-sm"
                          title="Delete Application"
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/20 p-1.5 rounded"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
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
