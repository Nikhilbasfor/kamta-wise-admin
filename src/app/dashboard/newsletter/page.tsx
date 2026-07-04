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
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp 
} from "firebase/firestore";
import { Mail, Send, Loader2 } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: Timestamp | null;
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Email campaign form states
  const [subject, setSubject] = useState("New Arrivals just dropped — Kamta Wise");
  const [body, setBody] = useState(
    "Hello,\n\nWe are excited to share that our new collection has just dropped online! Discover the latest styles now.\n\nShop the collection: https://kamta-wise.firebaseapp.com/shop\n\nWarm regards,\nKamta Wise Team"
  );

  // Subscribe to subscribers collection real-time
  useEffect(() => {
    const q = query(collection(db, "newsletter_subscribers"), orderBy("subscribedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Subscriber[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as Subscriber);
      });
      setSubscribers(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching newsletter subscribers:", error);
      toast.error("Failed to load newsletter subscriber list");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Format subscribed date
  const getFormattedDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "—";
    if (typeof timestamp.seconds === "number") {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    return new Date(timestamp as any).toLocaleString();
  };

  // Real Automated Email Send handler using Resend API
  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribers.length === 0) {
      toast.error("No subscribers to email");
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast.error("Please fill in the Subject and Email Body text");
      return;
    }

    setSending(true);
    const toastId = toast.loading(`Sending newsletter email to ${subscribers.length} subscribers...`);

    try {
      const res = await fetch("/api/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          bodyText: body.trim(),
          subscribers: subscribers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send emails");
      }

      toast.success(`Newsletter email dispatched to ${data.count || subscribers.length} subscribers!`, { id: toastId });
    } catch (err: any) {
      console.error("Newsletter send error:", err);
      toast.error(err.message || "Failed to send newsletter emails", { id: toastId });
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminGuard>
      <div className="space-y-6 font-sans">
        
        {/* Section 1: Subscribers List */}
        <div className="space-y-4">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-light tracking-wide text-slate-100 uppercase">
                Newsletter
              </h1>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
                Monitor subscriber counts, email directories, and dispatch marketing campaigns
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Subscribers:</span>
              <Badge className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono font-bold px-3 py-1 rounded">
                {subscribers.length}
              </Badge>
            </div>
          </div>

          {/* Subscribers Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
              <span className="text-xs uppercase tracking-widest text-slate-500">Loading subscribers...</span>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-500 text-xs uppercase tracking-widest">
              No newsletter subscribers yet.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <Table>
                <TableHeader className="bg-slate-950/80 border-b border-slate-800">
                  <TableRow className="hover:bg-transparent border-slate-800">
                    <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Subscriber Email Address</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Subscribed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-slate-800/40 border-slate-850 border-b border-slate-800/50">
                      <TableCell className="py-3 text-xs font-mono text-slate-200">
                        {sub.email}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-slate-500">
                        {getFormattedDate(sub.subscribedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

        </div>

        {/* Section 2: Send Email Campaign */}
        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-lg">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="text-lg font-light uppercase tracking-widest text-slate-200 flex items-center gap-2">
              <Mail className="h-5 w-5 text-slate-400" />
              Send New Arrival Email
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 uppercase tracking-wider">
              Draft messages to push campaign updates to all subscribers via BCC selection
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSendCampaign} className="space-y-4">
              
              {/* Campaign Subject */}
              <div className="space-y-1">
                <label htmlFor="camp-subject" className="text-[10px] uppercase tracking-wider text-slate-400">
                  Campaign Email Subject
                </label>
                <Input
                  id="camp-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Autumn Lookbook 2026 Live — Kamta Wise"
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                  required
                />
              </div>

              {/* Campaign Body */}
              <div className="space-y-1">
                <label htmlFor="camp-body" className="text-[10px] uppercase tracking-wider text-slate-400">
                  Campaign Message Body Text (Plain Text)
                </label>
                <Textarea
                  id="camp-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Compose your newsletter campaign message here..."
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                  rows={6}
                  required
                />
              </div>

              {/* Submit Dispatch CTA */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={subscribers.length === 0 || sending}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-semibold uppercase tracking-widest px-6 py-3.5 h-auto flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sending Campaign Email...
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      Send to all subscribers ({subscribers.length})
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-slate-500 mt-2">
                  Emails will be dispatched directly to all subscribers using your configured Resend API engine.
                </p>
              </div>

            </form>
          </CardContent>
        </Card>

      </div>
    </AdminGuard>
  );
}
