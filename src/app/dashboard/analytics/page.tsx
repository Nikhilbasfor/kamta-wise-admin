"use client";

import React, { useState, useEffect } from "react";
import AdminGuard from "@/components/AdminGuard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { BarChart3, Save, Settings, HelpCircle, Loader2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

export default function AnalyticsPage() {
  const [embedUrl, setEmbedUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showGlossary, setShowGlossary] = useState(true);

  useEffect(() => {
    async function fetchAnalyticsSettings() {
      try {
        const docRef = doc(db, "siteSettings", "analytics");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.lookerStudioUrl) {
            setEmbedUrl(data.lookerStudioUrl);
            setInputUrl(data.lookerStudioUrl);
          }
        }
      } catch (err) {
        console.error("Error loading analytics settings:", err);
        toast.error("Failed to load analytics configurations.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalyticsSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      toast.error("Please enter a valid Looker Studio Embed URL.");
      return;
    }

    // Basic validation to check if it's a Looker Studio URL or iframe source
    let cleanUrl = inputUrl.trim();
    
    // Extract src from iframe string if user pasted the full HTML iframe tag
    if (cleanUrl.toLowerCase().includes("<iframe") && cleanUrl.toLowerCase().includes("src=")) {
      const match = cleanUrl.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) {
        cleanUrl = match[1];
      }
    }

    setSaving(true);
    try {
      const docRef = doc(db, "siteSettings", "analytics");
      await setDoc(docRef, { lookerStudioUrl: cleanUrl }, { merge: true });
      setEmbedUrl(cleanUrl);
      setInputUrl(cleanUrl);
      setShowConfig(false);
      toast.success("Analytics Dashboard updated successfully!");
    } catch (err) {
      console.error("Error saving analytics URL:", err);
      toast.error("Failed to save analytics configuration.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="flex flex-col items-center justify-center py-40 gap-3 text-slate-100 font-sans">
          <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
          <span className="text-xs uppercase tracking-widest text-slate-500">Loading Analytics Dashboard...</span>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="space-y-6 font-sans">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-wide text-slate-100 uppercase flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-slate-300" />
              Store Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Monitor active users, visitor metrics, return rates, and e-commerce conversions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowGlossary(!showGlossary)}
              variant="outline"
              className="border-slate-800 hover:bg-slate-900 text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>{showGlossary ? "Hide Metric Guide" : "Show Metric Guide"}</span>
              {showGlossary ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
            </Button>
            {embedUrl && (
              <Button
                onClick={() => setShowConfig(!showConfig)}
                variant="outline"
                className="border-slate-800 hover:bg-slate-900 text-slate-300 text-xs uppercase tracking-wider"
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                {showConfig ? "Hide Config" : "Update Dashboard Link"}
              </Button>
            )}
          </div>
        </div>

        {/* Metric Explanations Glossary */}
        {showGlossary && (
          <div className="bg-slate-900/40 border border-slate-800/85 rounded-2xl p-5 backdrop-blur-sm transition-all duration-300">
            <div className="flex items-start justify-between border-b border-slate-800/60 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-slate-400" />
                  Understanding Your Dashboard Metrics
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5 uppercase tracking-wider">
                  A simple guide explaining the scorecards below so you can easily understand your store's traffic.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Views */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 hover:border-slate-700/60 transition-all duration-300">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">Views</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The total number of times any page on your store was opened/loaded. If a single visitor looks at 3 different pages, it counts as 3 views.
                </p>
              </div>

              {/* Sessions */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 hover:border-slate-700/60 transition-all duration-300">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">Sessions</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The number of individual visits to your site. A session starts when someone arrives, and ends when they close the tab or remain inactive for 30 minutes.
                </p>
              </div>

              {/* Total Users */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 hover:border-slate-700/60 transition-all duration-300">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Total Users</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The total number of unique people who visited your website at least once. If one person visits your site multiple times, they are still counted as 1 user.
                </p>
              </div>

              {/* Bounce Rate */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 hover:border-slate-700/60 transition-all duration-300">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Bounce Rate</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The percentage of visitors who left your website after viewing only 1 page without clicking anything else. A lower percentage means higher visitor engagement.
                </p>
              </div>

              {/* Average Session Duration */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 hover:border-slate-700/60 transition-all duration-300">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">Avg. Session Duration</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The average length of time a visitor spent on your site during a single visit. For example, "03:51" means they stayed for 3 minutes and 51 seconds.
                </p>
              </div>

              {/* New Users */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 hover:border-slate-700/60 transition-all duration-300">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">New Users</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The number of people visiting your website for the first time. This lets you see how many new prospective customers are discovering your business.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Configurations Area */}
        {(showConfig || !embedUrl) && (
          <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-md max-w-3xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-slate-200 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-slate-400" />
                Setup Google Looker Studio Analytics Dashboard
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Follow these simple steps to embed a high-end visual tracking report for your client.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2 text-xs text-slate-400 leading-relaxed border-l-2 border-slate-800 pl-4 py-1">
                <p>1. Go to <a href="https://lookerstudio.google.com" target="_blank" rel="noopener noreferrer" className="text-slate-200 hover:underline inline-flex items-center gap-0.5">Google Looker Studio <ExternalLink size={10} /></a> and log in.</p>
                <p>2. Create a new **Report** and search/select **Google Analytics** as your Data Source.</p>
                <p>3. Select your Google Analytics 4 Property (`kamta-wise`) to connect it.</p>
                <p>4. Design a clean 1-page report (or choose a pre-made Google Analytics template).</p>
                <p>5. Click **Share** (top right) → **Embed report** → Check **"Enable embedding"**.</p>
                <p>6. Choose **Embed URL**, copy the link, and paste it below.</p>
              </div>

              <form onSubmit={handleSave} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="embed-url" className="text-[10px] uppercase tracking-wider text-slate-400">
                    Looker Studio Embed URL
                  </Label>
                  <Input
                    id="embed-url"
                    placeholder="https://lookerstudio.google.com/embed/reporting/..."
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-850"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-semibold uppercase tracking-widest px-6"
                  >
                    {saving ? "Saving..." : "Save Dashboard Link"}
                  </Button>
                  {embedUrl && (
                    <Button
                      type="button"
                      onClick={() => {
                        setInputUrl(embedUrl);
                        setShowConfig(false);
                      }}
                      variant="ghost"
                      className="text-slate-400 hover:text-slate-200 text-xs uppercase tracking-wider"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Embed Frame */}
        {embedUrl ? (
          <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl aspect-[16/10] min-h-[600px] relative">
            <iframe
              src={embedUrl}
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/35 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs uppercase tracking-widest">
            Dashboard URL is not configured. Please use the setup guide above to link your analytics.
          </div>
        )}

      </div>
    </AdminGuard>
  );
}
