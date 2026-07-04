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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  updateDoc, 
  orderBy, 
  Timestamp 
} from "firebase/firestore";
import { Mail, MailOpen, Loader2, ExternalLink } from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  submittedAt: Timestamp | null;
  status: "unread" | "read";
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");

  // View modal state
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Subscribe to contact messages
  useEffect(() => {
    const q = query(collection(db, "contact_messages"), orderBy("submittedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: ContactMessage[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as ContactMessage);
      });
      setMessages(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching contact messages:", error);
      toast.error("Failed to load messages inbox");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update status to read
  const handleMarkAsRead = async (message: ContactMessage) => {
    try {
      const docRef = doc(db, "contact_messages", message.id);
      await updateDoc(docRef, { status: "read" });
      toast.success("Message marked as read");
      
      // Update selected message state locally if modal is open
      if (selectedMessage && selectedMessage.id === message.id) {
        setSelectedMessage(prev => prev ? { ...prev, status: "read" } : null);
      }
    } catch (err) {
      console.error("Error marking message as read:", err);
      toast.error("Failed to update status");
    }
  };

  const getFormattedDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "—";
    if (typeof timestamp.seconds === "number") {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    return new Date(timestamp as any).toLocaleString();
  };

  const getStatusBadge = (status: ContactMessage["status"]) => {
    if (status === "unread") {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px] uppercase px-2 py-0.5">
          Unread
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase px-2 py-0.5">
        Read
      </Badge>
    );
  };

  // Filter list
  const filteredMessages = messages.filter(msg => {
    if (statusFilter === "All") return true;
    return msg.status === statusFilter.toLowerCase();
  });

  return (
    <AdminGuard>
      <div className="space-y-6 font-sans">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-wide text-slate-100 uppercase">
              Contact Messages
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Review visitor inquiries, questions, brand requests, and support messages
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Filter inbox:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs w-44 rounded-lg">
                <SelectValue placeholder="All Messages" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                <SelectItem value="All">All Messages</SelectItem>
                <SelectItem value="Unread">Unread</SelectItem>
                <SelectItem value="Read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Unread count:</span>
            <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold px-2 py-0.5">
              {messages.filter(m => m.status === "unread").length}
            </Badge>
          </div>
        </div>

        {/* Messages Table view */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            <span className="text-xs uppercase tracking-widest text-slate-500">Loading mailbox...</span>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-500 text-xs uppercase tracking-widest">
            No contact messages found in this folder.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <Table>
              <TableHeader className="bg-slate-950/80 border-b border-slate-800">
                <TableRow className="hover:bg-transparent border-slate-800">
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Sender</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Contact / Email</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Message Snippet</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 w-44">Submitted At</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 text-center w-28">Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-slate-400 text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((msg) => (
                  <TableRow key={msg.id} className={`hover:bg-slate-800/40 border-slate-850 border-b border-slate-800/50 ${msg.status === "unread" ? "bg-slate-900/50 font-medium text-slate-100" : "text-slate-400"}`}>
                    
                    {/* Sender Name */}
                    <TableCell className="py-4 text-xs">
                      {msg.name}
                    </TableCell>

                    {/* Email/Contact info */}
                    <TableCell className="py-4 text-xs font-mono">
                      {msg.email}
                    </TableCell>

                    {/* Message Snippet */}
                    <TableCell className="py-4 text-xs max-w-[240px] truncate">
                      {msg.message}
                    </TableCell>

                    {/* Submitted At */}
                    <TableCell className="py-4 text-xs">
                      {getFormattedDate(msg.submittedAt)}
                    </TableCell>

                    {/* Status badge */}
                    <TableCell className="py-4 text-center">
                      {getStatusBadge(msg.status)}
                    </TableCell>

                    {/* View trigger button */}
                    <TableCell className="py-4 text-right">
                      <Button
                        onClick={() => setSelectedMessage(msg)}
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 text-[10px] uppercase tracking-wider px-2 py-1 h-auto"
                      >
                        View
                      </Button>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* View Message Detail Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={(open) => { if (!open) setSelectedMessage(null); }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-light uppercase tracking-widest text-slate-200 flex items-center gap-2">
                {selectedMessage?.status === "unread" ? <Mail className="text-yellow-500 h-5 w-5" /> : <MailOpen className="text-emerald-500 h-5 w-5" />}
                <span>Message Details</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Submitted by {selectedMessage?.name} on {selectedMessage ? getFormattedDate(selectedMessage.submittedAt) : ""}
              </DialogDescription>
            </DialogHeader>

            {selectedMessage && (
              <div className="space-y-4 py-2 text-xs font-sans">
                
                {/* Meta details box */}
                <div className="p-4 bg-slate-950/65 border border-slate-800/80 rounded-xl space-y-1">
                  <div>
                    <span className="text-slate-500 uppercase tracking-wider text-[9px] block">Sender Name</span>
                    <span className="text-slate-200 text-xs font-semibold">{selectedMessage.name}</span>
                  </div>
                  <div className="pt-1.5">
                    <span className="text-slate-500 uppercase tracking-wider text-[9px] block">Contact/Email Address</span>
                    <span className="text-slate-200 text-xs font-mono">{selectedMessage.email}</span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="space-y-1">
                  <span className="text-slate-500 uppercase tracking-wider text-[9px] block">Full Message Body</span>
                  <div className="p-4 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl max-h-[220px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </div>
                </div>

                {/* Footer Controls */}
                <DialogFooter className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
                  <div>
                    {selectedMessage.status === "unread" ? (
                      <Button
                        type="button"
                        onClick={() => handleMarkAsRead(selectedMessage)}
                        className="bg-yellow-600 hover:bg-yellow-750 text-white text-xs font-semibold uppercase tracking-widest px-4 py-2"
                      >
                        Mark as Read
                      </Button>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider flex items-center gap-1">
                        ✓ Read Message
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSelectedMessage(null)}
                      className="text-slate-400 hover:text-slate-200 text-xs uppercase tracking-wider"
                    >
                      Close
                    </Button>
                    <a
                      href={`mailto:${selectedMessage.email}?subject=Reply from Kamta Wise&body=Dear ${selectedMessage.name},%0D%0A%0D%0AThank you for reaching out.%0D%0A%0D%0ABest regards,%0D%0AKamta Wise Client Services`}
                      className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-md transition-colors"
                    >
                      Reply via Email
                      <ExternalLink size={11} className="ml-1.5" />
                    </a>
                  </div>
                </DialogFooter>

              </div>
            )}

          </DialogContent>
        </Dialog>

      </div>
    </AdminGuard>
  );
}
