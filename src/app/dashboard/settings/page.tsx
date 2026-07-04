"use client";

import React, { useState, useEffect } from "react";
import AdminGuard from "@/components/AdminGuard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface Slide {
  id: string;
  src: string;
  alt: string;
  objectFit: "object-cover" | "object-contain bg-white";
}

interface FaqItem {
  question: string;
  answer: string;
}

interface LookbookStory {
  tag: string;
  title: string;
  description: string;
  image: string;
}

interface LookbookSettings {
  title: string;
  subtitle: string;
  stories: LookbookStory[];
}

interface SiteSettings {
  announcementBar: {
    text: string;
    isActive: boolean;
  };
  heroBanner: {
    slides: Slide[];
  };
  shippingPolicy: {
    freeShippingThreshold: number;
    standardDeliveryDays: string;
    expressDeliveryDays: string;
    shippingTimelineText?: string;
    returnPolicyText?: string;
    customerCareText?: string;
  };
  privacyTerms: {
    privacyPolicyText: string;
    termsOfUseText: string;
    dataCollectionText: string;
    customerSupportText: string;
  };
  contactInfo: {
    whatsapp: string;
    email: string;
    instagram: string;
  };
  brandStory: {
    headline: string;
    body: string;
  };
  influencerProgram: {
    headline: string;
    body: string;
    benefitsText?: string;
    eligibilityText?: string;
  };
  returnPolicy: {
    body: string;
  };
  sizeGuide: {
    body: string;
    apparelNotes?: string;
    shoeNotes?: string;
  };
  faq: {
    items: FaqItem[];
  };
  lookbook: LookbookSettings;
}

const defaultSettings: SiteSettings = {
  announcementBar: {
    text: "FREE DELIVERY ON ORDERS ABOVE ₹2999",
    isActive: true,
  },
  heroBanner: {
    slides: [
      {
        id: "slide_1",
        src: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1600&q=80",
        alt: "Apex Sneakers Collection",
        objectFit: "object-cover",
      }
    ],
  },
  shippingPolicy: {
    freeShippingThreshold: 2999,
    standardDeliveryDays: "5-7",
    expressDeliveryDays: "2-3",
    shippingTimelineText: "Orders are processed within 1-2 business days. Domestic standard orders generally deliver in 5-7 business days. Express shipping (2-3 business days) options are available. Free standard shipping applies to all orders above ₹2999.",
    returnPolicyText: "We offer a size exchange or store credit return within 7 days of delivery, provided items are unworn and tags remain intact.",
    customerCareText: "Our care channel is reachable at care@kamtawise.com or by WhatsApp at +919864879505 from Monday through Saturday, between 10:00 AM and 7:00 PM IST.",
  },
  privacyTerms: {
    privacyPolicyText: "Kamta Wise respects your personal data. We will never sell or disclose your information to third-party brokers. Data collected is solely used to process shipments and personalize your wardrobe recommendations.",
    termsOfUseText: "By navigating this site, you agree to respect design copywrites and trade marks. Kamta Wise reserves the right to cancel transactions that violate fair retail policies or show signs of commercial resale fraud.",
    dataCollectionText: "We collect browser cookie tokens to remember your shopping cart items, wishlist saves, and active profile sessions. These are securely cleared when you log out or delete local browser history.",
    customerSupportText: "If you have questions regarding legal compliance or wish to request complete erasure of your guest history, please reach out to privacy@kamtawise.com.",
  },
  contactInfo: {
    whatsapp: "919864879505",
    email: "nikhilbasfor3@gmail.com",
    instagram: "@kamtawise",
  },
  brandStory: {
    headline: "ROOTS. RAW. REAL.",
    body: "Born out of a desire for quiet elegance and daily comfort, Kamta Wise redefines luxury through premium natural textiles, relaxed silhouettes, and sustainable local sourcing.",
  },
  influencerProgram: {
    headline: "INFLUENCER PROGRAM",
    body: "We appreciate and collaborate with content creators who resonate with our minimal, quiet-luxury philosophy. Join the Kamta Wise Circle to co-create beautiful visual stories.",
    benefitsText: "• Complimentary seasonal drops and curated collections.\n• 10% affiliate commission for your audience referral sales.\n• First-look access to limited edition product launches.\n• Opportunities for official website and brand social media features.",
    eligibilityText: "We welcome creators with 5k+ followers on Instagram, Pinterest, or YouTube who focus on high-quality, raw aesthetic, minimal lifestyle, or sustainable fashion content.",
  },
  returnPolicy: {
    body: "We support a hassle-free 10-day return policy. Garments must be unworn, undamaged, with original tags intact. Sizing adjustments can also be requested via WhatsApp.",
  },
  sizeGuide: {
    body: "Most of our pieces are designed in relaxed, contemporary fits. Please use this guide to choose your perfect fit. All measurements are in inches.",
    apparelNotes: "T-Shirts & Shirts: Designed with an intentional relaxed shoulder drop. Order your standard size for a modern silhouette or one size down for a classic tailored fit.",
    shoeNotes: "Shoes Size Guide (UK Standard Fits):\nUK 6 = 25.0 cm | UK 7 = 25.8 cm | UK 8 = 26.7 cm | UK 9 = 27.5 cm | UK 10 = 28.3 cm | UK 11 = 29.2 cm.\nNote: For half sizes, we recommend sizing up to the nearest full size.",
  },
  faq: {
    items: [
      {
        question: "When will my order ship?",
        answer: "Orders are processed within 24-48 business hours and delivered standard between 5-7 business days."
      },
      {
        question: "How do I process a return?",
        answer: "Simply shoot us an email at care@kamtawise.com or directly send a WhatsApp message to our line."
      }
    ],
  },
  lookbook: {
    title: "Summer Lookbook 2026",
    subtitle: "A visual inquiry into lightweight shapes, sunlit rooms, and natural materials.",
    stories: [
      {
        tag: "Story 01 // Breezy Linen",
        title: "The Art of Rest",
        description: "Understated textures and organic fibres that echo the ease of summer middays.",
        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80",
      },
      {
        tag: "Story 02 // Clean Cuts",
        title: "Structured Ease",
        description: "Perfecting the balance between tailoring and movement, designed to breathe.",
        image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&q=80",
      },
      {
        tag: "Story 03 // Natural Palette",
        title: "Sun-Dappled Hues",
        description: "Shades of raw ivory, washed sand, and stone that settle into the environment.",
        image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
      },
      {
        tag: "Story 04 // Fluid Forms",
        title: "Summer Solitude",
        description: "Weightless coordinates that flow with the wind, moving with quiet grace.",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
      }
    ],
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, "siteSettings", "main");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            ...defaultSettings,
            ...data,
            announcementBar: { ...defaultSettings.announcementBar, ...data.announcementBar },
            heroBanner: { ...defaultSettings.heroBanner, ...data.heroBanner },
            shippingPolicy: { ...defaultSettings.shippingPolicy, ...data.shippingPolicy },
            privacyTerms: { ...defaultSettings.privacyTerms, ...data.privacyTerms },
            contactInfo: { ...defaultSettings.contactInfo, ...data.contactInfo },
            brandStory: { ...defaultSettings.brandStory, ...data.brandStory },
            influencerProgram: { ...defaultSettings.influencerProgram, ...data.influencerProgram },
            returnPolicy: { ...defaultSettings.returnPolicy, ...data.returnPolicy },
            sizeGuide: { ...defaultSettings.sizeGuide, ...data.sizeGuide },
            faq: { ...defaultSettings.faq, ...data.faq },
            lookbook: { ...defaultSettings.lookbook, ...data.lookbook },
          } as SiteSettings);
        } else {
          // If no doc, start with default local state
          setSettings(defaultSettings);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        toast.error("Failed to load settings from Firestore.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const saveSettingsToFirestore = async (updatedSettings: SiteSettings) => {
    setSaving(true);
    try {
      const docRef = doc(db, "siteSettings", "main");
      await setDoc(docRef, updatedSettings);
      setSettings(updatedSettings);
      toast.success("Settings saved successfully");
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  // Tab 1 Save
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await saveSettingsToFirestore(settings);
  };

  // Tab 2 Slide Add / Remove / Edit
  const handleAddSlide = () => {
    if (!settings) return;
    if (settings.heroBanner.slides.length >= 5) {
      toast.error("Maximum limit of 5 slides reached");
      return;
    }
    const newSlide: Slide = {
      id: `slide_${Date.now()}`,
      src: "",
      alt: "",
      objectFit: "object-cover",
    };
    setSettings({
      ...settings,
      heroBanner: {
        slides: [...settings.heroBanner.slides, newSlide],
      },
    });
  };

  const handleRemoveSlide = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      heroBanner: {
        slides: settings.heroBanner.slides.filter((slide) => slide.id !== id),
      },
    });
  };

  const handleEditSlide = (id: string, field: keyof Slide, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      heroBanner: {
        slides: settings.heroBanner.slides.map((slide) =>
          slide.id === id ? { ...slide, [field]: value } : slide
        ),
      },
    });

    if (field === "src" && value.includes("ibb.co") && !value.includes("i.ibb.co")) {
      fetch(`/api/resolve-image?url=${encodeURIComponent(value.trim())}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.resolvedUrl) {
            setSettings((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                heroBanner: {
                  slides: prev.heroBanner.slides.map((slide) =>
                    slide.id === id ? { ...slide, src: data.resolvedUrl } : slide
                  ),
                },
              };
            });
          }
        })
        .catch((err) => console.error("Error resolving url", err));
    }
  };

  // Tab 3 Shipping & Contact Save
  const handleSaveShippingContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await saveSettingsToFirestore(settings);
  };

  // Tab 4 Brand Story Save
  const handleSaveBrandStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await saveSettingsToFirestore(settings);
  };

  // Tab 5 Policies & Info save & modifications
  const handleAddFaq = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      faq: {
        items: [...settings.faq.items, { question: "", answer: "" }],
      },
    });
  };

  const handleRemoveFaq = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      faq: {
        items: settings.faq.items.filter((_, idx) => idx !== index),
      },
    });
  };

  const handleEditFaq = (index: number, field: keyof FaqItem, value: string) => {
    if (!settings) return;
    const newItems = [...settings.faq.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setSettings({
      ...settings,
      faq: { items: newItems },
    });
  };

  const handleSavePoliciesInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await saveSettingsToFirestore(settings);
  };

  // Tab 6 Lookbook Save & edit helper
  const handleSaveLookbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await saveSettingsToFirestore(settings);
  };

  const handleEditLookbookStory = (index: number, field: keyof LookbookStory, value: string) => {
    if (!settings) return;
    const updatedStories = [...settings.lookbook.stories];
    updatedStories[index] = { ...updatedStories[index], [field]: value };

    setSettings({
      ...settings,
      lookbook: {
        ...settings.lookbook,
        stories: updatedStories,
      },
    });

    if (field === "image" && value.includes("ibb.co") && !value.includes("i.ibb.co")) {
      fetch(`/api/resolve-image?url=${encodeURIComponent(value.trim())}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.resolvedUrl) {
            setSettings((prev) => {
              if (!prev) return prev;
              const nextStories = [...prev.lookbook.stories];
              nextStories[index] = { ...nextStories[index], image: data.resolvedUrl };
              return {
                ...prev,
                lookbook: {
                  ...prev.lookbook,
                  stories: nextStories,
                },
              };
            });
          }
        })
        .catch((err) => console.error("Error resolving url", err));
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="space-y-6 font-sans">
          <div className="h-10 w-48 bg-slate-800 animate-pulse rounded-md" />
          <div className="h-4 w-96 bg-slate-800 animate-pulse rounded-md" />
          <div className="grid grid-cols-6 gap-4 mt-8">
            <div className="h-10 bg-slate-800 animate-pulse rounded-md" />
            <div className="h-10 bg-slate-800 animate-pulse rounded-md" />
            <div className="h-10 bg-slate-800 animate-pulse rounded-md" />
            <div className="h-10 bg-slate-800 animate-pulse rounded-md" />
            <div className="h-10 bg-slate-800 animate-pulse rounded-md" />
            <div className="h-10 bg-slate-800 animate-pulse rounded-md" />
          </div>
          <Card className="bg-slate-900 border-slate-800 animate-pulse h-96 mt-6" />
        </div>
      </AdminGuard>
    );
  }

  if (!settings) return null;

  return (
    <AdminGuard>
      <div className="space-y-6 font-sans">
        
        {/* Header Block */}
        <div>
          <h1 className="text-3xl font-light tracking-wide text-slate-100 uppercase">
            Site Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
            Configure dynamic contents, banners, policies, and contacts on storefront
          </p>
        </div>

        {/* Tabs System */}
        <Tabs defaultValue="announcement" className="w-full">
          <TabsList className="grid grid-cols-1 md:grid-cols-6 bg-slate-900 border border-slate-800 text-slate-400 p-1 rounded-xl">
            <TabsTrigger value="announcement" className="text-xs uppercase tracking-wider py-2">
              Announcement
            </TabsTrigger>
            <TabsTrigger value="hero" className="text-xs uppercase tracking-wider py-2">
              Hero Banner
            </TabsTrigger>
            <TabsTrigger value="shipping" className="text-xs uppercase tracking-wider py-2">
              Shipping & Contacts
            </TabsTrigger>
            <TabsTrigger value="story" className="text-xs uppercase tracking-wider py-2">
              Brand Story
            </TabsTrigger>
            <TabsTrigger value="policies" className="text-xs uppercase tracking-wider py-2">
              Policies & FAQs
            </TabsTrigger>
            <TabsTrigger value="lookbook" className="text-xs uppercase tracking-wider py-2">
              Lookbook
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Announcement Bar */}
          <TabsContent value="announcement" className="mt-6">
            <form onSubmit={handleSaveAnnouncement}>
              <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-light uppercase tracking-widest text-slate-200">
                    Announcement Bar Settings
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Toggles visibility and contents of the top header announcement alert banner
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Active Toggle Switch */}
                  <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
                    <div className="space-y-0.5">
                      <Label htmlFor="announcement-status" className="text-sm font-medium text-slate-300">
                        Display Announcement
                      </Label>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Toggle to show or hide the announcement bar in the user site
                      </p>
                    </div>
                    <Switch
                      id="announcement-status"
                      checked={settings.announcementBar.isActive}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          announcementBar: { ...settings.announcementBar, isActive: checked },
                        })
                      }
                    />
                  </div>

                  {/* Announcement Text Input */}
                  <div className="space-y-2">
                    <Label htmlFor="announcement-text" className="text-xs uppercase tracking-wider text-slate-400">
                      Announcement Text
                    </Label>
                    <Input
                      id="announcement-text"
                      placeholder="e.g. Free shipping on orders above ₹2999"
                      value={settings.announcementBar.text}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          announcementBar: { ...settings.announcementBar, text: e.target.value },
                        })
                      }
                      className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-700"
                    />
                  </div>

                  {/* Save Option */}
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-semibold uppercase tracking-widest px-6"
                  >
                    {saving ? "Saving..." : "Save Announcement"}
                  </Button>
                  
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* TAB 2: Hero Banner slides */}
          <TabsContent value="hero" className="mt-6">
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-light uppercase tracking-widest text-slate-200">
                    Homepage Hero Banner slides
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Configure image slides showing in homepage main gallery slider (Max 5 slides)
                  </CardDescription>
                </div>
                <Button
                  onClick={handleAddSlide}
                  disabled={settings.heroBanner.slides.length >= 5}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs uppercase tracking-wider py-2"
                >
                  <Plus size={14} className="mr-1" />
                  Add Slide
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {settings.heroBanner.slides.length === 0 ? (
                  <div className="text-center py-10 bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs uppercase tracking-wider">
                    No slides defined. Add a slide to begin.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {settings.heroBanner.slides.map((slide, index) => (
                      <div 
                        key={slide.id} 
                        className="p-5 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-4 relative"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            Slide #{index + 1}
                          </span>
                          <Button
                            onClick={() => handleRemoveSlide(slide.id)}
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/20 p-2 h-auto"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          
                          {/* Image preview (if URL exists) */}
                          <div className="md:col-span-3 aspect-[4/3] bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative">
                            {slide.src ? (
                              <img
                                src={slide.src}
                                alt="Slide preview"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                                }}
                              />
                            ) : null}
                            <div className={`flex flex-col items-center justify-center h-full p-2 text-center text-[10px] text-amber-400/80 bg-slate-950 ${slide.src ? "hidden" : ""}`}>
                              <span>{slide.src ? "Unable to load image (Ensure link is a direct image URL ending in .jpg/.png)" : "No Image URL"}</span>
                            </div>
                          </div>

                          <div className="md:col-span-9 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              
                              {/* Src input */}
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase tracking-wider text-slate-500">
                                  Image Source URL
                                </Label>
                                <Input
                                  placeholder="https://images.unsplash.com/..."
                                  value={slide.src}
                                  onChange={(e) => handleEditSlide(slide.id, "src", e.target.value)}
                                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                                />
                              </div>

                              {/* Alt text */}
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase tracking-wider text-slate-500">
                                  Alternative/Title Text
                                </Label>
                                <Input
                                  placeholder="e.g. Luxury Linen wear"
                                  value={slide.alt}
                                  onChange={(e) => handleEditSlide(slide.id, "alt", e.target.value)}
                                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                                />
                              </div>

                            </div>

                            {/* Object Fit select */}
                            <div className="space-y-1 max-w-sm">
                              <Label className="text-[10px] uppercase tracking-wider text-slate-500">
                                Image Scaling Fit
                              </Label>
                              <Select
                                value={slide.objectFit}
                                onValueChange={(value) => handleEditSlide(slide.id, "objectFit", value)}
                              >
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
                                  <SelectValue placeholder="Select Scaling Style" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                                  <SelectItem value="object-cover">Cover (Fills entire banner)</SelectItem>
                                  <SelectItem value="object-contain bg-white">Contain (Letterbox fit with white BG)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800/80">
                  <Button
                    onClick={() => saveSettingsToFirestore(settings)}
                    disabled={saving}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-semibold uppercase tracking-widest px-6"
                  >
                    {saving ? "Saving..." : "Save Slides Order"}
                  </Button>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Shipping & Contact */}
          <TabsContent value="shipping" className="mt-6">
            <form onSubmit={handleSaveShippingContact}>
              <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-light uppercase tracking-widest text-slate-200">
                    Shipping Policy & Contacts Config
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Set delivery terms thresholds, standard customer channels, WhatsApp and support logs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Shipping Policy Block */}
                    <div className="space-y-4 p-5 bg-slate-950/20 border border-slate-800 rounded-xl">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-1.5">
                        Shipping Conditions
                      </h3>
                      
                      {/* Free shipping threshold */}
                      <div className="space-y-1.5">
                        <Label htmlFor="free-shipping-threshold" className="text-[10px] uppercase tracking-wider text-slate-400">
                          Free Shipping Threshold (INR)
                        </Label>
                        <Input
                          id="free-shipping-threshold"
                          type="number"
                          value={settings.shippingPolicy.freeShippingThreshold}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              shippingPolicy: {
                                ...settings.shippingPolicy,
                                freeShippingThreshold: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100"
                        />
                      </div>

                      {/* Standard Delivery Days */}
                      <div className="space-y-1.5">
                        <Label htmlFor="standard-days" className="text-[10px] uppercase tracking-wider text-slate-400">
                          Standard Delivery duration (Days)
                        </Label>
                        <Input
                          id="standard-days"
                          placeholder="e.g. 5-7"
                          value={settings.shippingPolicy.standardDeliveryDays}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              shippingPolicy: {
                                ...settings.shippingPolicy,
                                standardDeliveryDays: e.target.value,
                              },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100"
                        />
                      </div>

                      {/* Express Delivery Days */}
                      <div className="space-y-1.5">
                        <Label htmlFor="express-days" className="text-[10px] uppercase tracking-wider text-slate-400">
                          Express Delivery duration (Days)
                        </Label>
                        <Input
                          id="express-days"
                          placeholder="e.g. 2-3"
                          value={settings.shippingPolicy.expressDeliveryDays}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              shippingPolicy: {
                                ...settings.shippingPolicy,
                                expressDeliveryDays: e.target.value,
                              },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100"
                        />
                      </div>

                    </div>

                    {/* Contact Info Block */}
                    <div className="space-y-4 p-5 bg-slate-950/20 border border-slate-800 rounded-xl">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-1.5">
                        Support Contact Info
                      </h3>

                      {/* WhatsApp */}
                      <div className="space-y-1.5">
                        <Label htmlFor="contact-whatsapp" className="text-[10px] uppercase tracking-wider text-slate-400">
                          WhatsApp Line Number (No spaces)
                        </Label>
                        <Input
                          id="contact-whatsapp"
                          placeholder="e.g. 919864879505"
                          value={settings.contactInfo.whatsapp}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              contactInfo: {
                                ...settings.contactInfo,
                                whatsapp: e.target.value,
                              },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100"
                        />
                      </div>

                      {/* Support email */}
                      <div className="space-y-1.5">
                        <Label htmlFor="contact-email" className="text-[10px] uppercase tracking-wider text-slate-400">
                          Official support Email
                        </Label>
                        <Input
                          id="contact-email"
                          type="email"
                          placeholder="e.g. care@kamtawise.com"
                          value={settings.contactInfo.email}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              contactInfo: {
                                ...settings.contactInfo,
                                email: e.target.value,
                              },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100"
                        />
                      </div>

                      {/* Instagram */}
                      <div className="space-y-1.5">
                        <Label htmlFor="contact-instagram" className="text-[10px] uppercase tracking-wider text-slate-400">
                          Instagram handle
                        </Label>
                        <Input
                          id="contact-instagram"
                          placeholder="e.g. @kamta.wise"
                          value={settings.contactInfo.instagram}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              contactInfo: {
                                ...settings.contactInfo,
                                instagram: e.target.value,
                              },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100"
                        />
                      </div>

                    </div>

                  </div>

                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-semibold uppercase tracking-widest px-6"
                  >
                    {saving ? "Saving..." : "Save Shipping & Contact"}
                  </Button>

                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* TAB 4: Brand Story */}
          <TabsContent value="story" className="mt-6">
            <form onSubmit={handleSaveBrandStory}>
              <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-light uppercase tracking-widest text-slate-200">
                    Homepage Brand Story Narrative
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Configure the main storytelling narrative shown under about section on homepage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Headline */}
                  <div className="space-y-2">
                    <Label htmlFor="story-headline" className="text-xs uppercase tracking-wider text-slate-400">
                      Narrative Headline
                    </Label>
                    <Input
                      id="story-headline"
                      placeholder="e.g. ROOTS. RAW. REAL."
                      value={settings.brandStory.headline}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          brandStory: { ...settings.brandStory, headline: e.target.value },
                        })
                      }
                      className="bg-slate-950 border-slate-800 text-slate-100"
                    />
                  </div>

                  {/* Body Text */}
                  <div className="space-y-2">
                    <Label htmlFor="story-body" className="text-xs uppercase tracking-wider text-slate-400">
                      Story description
                    </Label>
                    <Textarea
                      id="story-body"
                      rows={6}
                      placeholder="Explain details of the brand..."
                      value={settings.brandStory.body}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          brandStory: { ...settings.brandStory, body: e.target.value },
                        })
                      }
                      className="bg-slate-950 border-slate-800 text-slate-100 min-h-[150px] leading-relaxed"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-semibold uppercase tracking-widest px-6"
                  >
                    {saving ? "Saving..." : "Save Brand Story"}
                  </Button>

                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* TAB 5: Policies & Info */}
          <TabsContent value="policies" className="mt-6">
            <form onSubmit={handleSavePoliciesInfo}>
              <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-light uppercase tracking-widest text-slate-200">
                    Sizing, FAQs, Returns & Influencer Policy
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Manage terms information blocks shown in the sizing charts and sidebar sections
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Influencer program details */}
                  <div className="space-y-4 p-5 bg-slate-950/20 border border-slate-800 rounded-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-1.5">
                      Influencer Program Details & Partnership Benefits
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="inf-headline" className="text-[10px] uppercase tracking-wider text-slate-400">
                          Influencer Headline
                        </Label>
                        <Input
                          id="inf-headline"
                          value={settings.influencerProgram.headline}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              influencerProgram: { ...settings.influencerProgram, headline: e.target.value },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="inf-body" className="text-[10px] uppercase tracking-wider text-slate-400">
                          Influencer Program Overview
                        </Label>
                        <Textarea
                          id="inf-body"
                          rows={2}
                          value={settings.influencerProgram.body}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              influencerProgram: { ...settings.influencerProgram, body: e.target.value },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inf-benefits" className="text-[10px] uppercase tracking-wider text-slate-400">
                          Partnership Benefits (One per line)
                        </Label>
                        <Textarea
                          id="inf-benefits"
                          rows={4}
                          value={settings.influencerProgram.benefitsText || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              influencerProgram: { ...settings.influencerProgram, benefitsText: e.target.value },
                            })
                          }
                          placeholder="• Free seasonal drops&#10;• 10% affiliate commission..."
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inf-eligibility" className="text-[10px] uppercase tracking-wider text-slate-400">
                          Eligibility Guidelines
                        </Label>
                        <Textarea
                          id="inf-eligibility"
                          rows={4}
                          value={settings.influencerProgram.eligibilityText || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              influencerProgram: { ...settings.influencerProgram, eligibilityText: e.target.value },
                            })
                          }
                          placeholder="e.g. 5k+ followers on Instagram focus on minimal aesthetic..."
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping & Returns Details */}
                  <div className="space-y-4 p-5 bg-slate-950/20 border border-slate-800 rounded-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-1.5">
                      Shipping Timeline, Returns & Customer Care
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="shipping-timeline" className="text-[10px] uppercase tracking-wider text-slate-400">
                          Shipping Timeline Details
                        </Label>
                        <Textarea
                          id="shipping-timeline"
                          rows={3}
                          value={settings.shippingPolicy.shippingTimelineText || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              shippingPolicy: { ...settings.shippingPolicy, shippingTimelineText: e.target.value },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="return-policy-text" className="text-[10px] uppercase tracking-wider text-slate-400">
                          Return & Exchange Policy Details
                        </Label>
                        <Textarea
                          id="return-policy-text"
                          rows={3}
                          value={settings.shippingPolicy.returnPolicyText || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              shippingPolicy: { ...settings.shippingPolicy, returnPolicyText: e.target.value },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="customer-care-contact" className="text-[10px] uppercase tracking-wider text-slate-400">
                          Customer Care Contact Info & Support Hours
                        </Label>
                        <Textarea
                          id="customer-care-contact"
                          rows={2}
                          value={settings.shippingPolicy.customerCareText || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              shippingPolicy: { ...settings.shippingPolicy, customerCareText: e.target.value },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Privacy & Terms details */}
                  <div className="space-y-4 p-5 bg-slate-950/20 border border-slate-800 rounded-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-1.5">
                      Privacy Policy & Terms of Use
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider text-slate-400">Privacy Policy Text</Label>
                        <Textarea
                          rows={3}
                          value={settings.privacyTerms?.privacyPolicyText || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              privacyTerms: {
                                ...(settings.privacyTerms || { termsOfUseText: "", dataCollectionText: "", customerSupportText: "" }),
                                privacyPolicyText: e.target.value,
                              },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider text-slate-400">Terms of Use Text</Label>
                        <Textarea
                          rows={3}
                          value={settings.privacyTerms?.termsOfUseText || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              privacyTerms: {
                                ...(settings.privacyTerms || { privacyPolicyText: "", dataCollectionText: "", customerSupportText: "" }),
                                termsOfUseText: e.target.value,
                              },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider text-slate-400">Data Collection Policy</Label>
                        <Textarea
                          rows={3}
                          value={settings.privacyTerms?.dataCollectionText || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              privacyTerms: {
                                ...(settings.privacyTerms || { privacyPolicyText: "", termsOfUseText: "", customerSupportText: "" }),
                                dataCollectionText: e.target.value,
                              },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider text-slate-400">Legal Customer Support</Label>
                        <Textarea
                          rows={3}
                          value={settings.privacyTerms?.customerSupportText || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              privacyTerms: {
                                ...(settings.privacyTerms || { privacyPolicyText: "", termsOfUseText: "", dataCollectionText: "" }),
                                customerSupportText: e.target.value,
                              },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Size Guide & Shoe Size Guide details */}
                  <div className="space-y-4 p-5 bg-slate-950/20 border border-slate-800 rounded-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-1.5">
                      Size Guide & Shoe Size Chart
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="policy-size" className="text-[10px] uppercase tracking-wider text-slate-400">
                          General Sizing Overview Body
                        </Label>
                        <Textarea
                          id="policy-size"
                          rows={2}
                          value={settings.sizeGuide.body}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              sizeGuide: { ...settings.sizeGuide, body: e.target.value },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="apparel-notes" className="text-[10px] uppercase tracking-wider text-slate-400">
                          Apparel Size Guide Notes (T-Shirts & Shirts)
                        </Label>
                        <Textarea
                          id="apparel-notes"
                          rows={2}
                          value={settings.sizeGuide.apparelNotes || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              sizeGuide: { ...settings.sizeGuide, apparelNotes: e.target.value },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="shoe-notes" className="text-[10px] uppercase tracking-wider text-slate-400">
                          Shoe Size Guide & Conversion Notes (UK 6-11)
                        </Label>
                        <Textarea
                          id="shoe-notes"
                          rows={3}
                          value={settings.sizeGuide.shoeNotes || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              sizeGuide: { ...settings.sizeGuide, shoeNotes: e.target.value },
                            })
                          }
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* FAQ Configuration list */}
                  <div className="space-y-4 p-5 bg-slate-950/20 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Frequently Asked Questions (FAQs)
                      </h3>
                      <Button
                        type="button"
                        onClick={handleAddFaq}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-100 text-[10px] uppercase tracking-wider py-1 px-3 h-auto"
                      >
                        <Plus size={10} className="mr-1" />
                        Add FAQ
                      </Button>
                    </div>

                    {settings.faq.items.length === 0 ? (
                      <div className="text-center py-6 text-slate-600 text-[10px] uppercase tracking-wider">
                        No FAQ items configured.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {settings.faq.items.map((faq, index) => (
                          <div 
                            key={index} 
                            className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-lg space-y-3 relative"
                          >
                            <div className="flex items-center justify-between border-b border-slate-800/40 pb-1.5">
                              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                FAQ #{index + 1}
                              </span>
                              <Button
                                type="button"
                                onClick={() => handleRemoveFaq(index)}
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-red-950/20 p-1 h-auto"
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase tracking-wider text-slate-500">Question</Label>
                                <Input
                                  value={faq.question}
                                  onChange={(e) => handleEditFaq(index, "question", e.target.value)}
                                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase tracking-wider text-slate-500">Answer</Label>
                                <Textarea
                                  value={faq.answer}
                                  onChange={(e) => handleEditFaq(index, "answer", e.target.value)}
                                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-800"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-semibold uppercase tracking-widest px-6"
                  >
                    {saving ? "Saving..." : "Save Policies & FAQs"}
                  </Button>

                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* TAB 6: Lookbook */}
          <TabsContent value="lookbook" className="mt-6">
            <form onSubmit={handleSaveLookbook}>
              <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-light uppercase tracking-widest text-slate-200">
                    Lookbook Settings
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Manage lookbook header details and the stories featured on the homepage.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* General settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-slate-950/20 border border-slate-800 rounded-xl">
                    <div className="space-y-1">
                      <Label htmlFor="lookbook-title" className="text-[10px] uppercase tracking-wider text-slate-400">
                        Lookbook Section Title
                      </Label>
                      <Input
                        id="lookbook-title"
                        value={settings.lookbook.title}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            lookbook: { ...settings.lookbook, title: e.target.value },
                          })
                        }
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lookbook-subtitle" className="text-[10px] uppercase tracking-wider text-slate-400">
                        Lookbook Subtitle
                      </Label>
                      <Input
                        id="lookbook-subtitle"
                        value={settings.lookbook.subtitle}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            lookbook: { ...settings.lookbook, subtitle: e.target.value },
                          })
                        }
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        required
                      />
                    </div>
                  </div>

                  {/* Stories list */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-805 pb-2">
                      Lookbook Stories (4 Featured Items)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {settings.lookbook.stories.map((story, index) => (
                        <div key={index} className="p-5 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4 relative">
                          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                            <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-widest">
                              Story #{index + 1}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {/* Tag */}
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase tracking-wider text-slate-500">Story Tag / Identifier</Label>
                              <Input
                                value={story.tag}
                                onChange={(e) => handleEditLookbookStory(index, "tag", e.target.value)}
                                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                                required
                              />
                            </div>

                            {/* Title */}
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase tracking-wider text-slate-500">Headline</Label>
                              <Input
                                value={story.title}
                                onChange={(e) => handleEditLookbookStory(index, "title", e.target.value)}
                                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                                required
                              />
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase tracking-wider text-slate-500">Short Description</Label>
                              <Textarea
                                value={story.description}
                                onChange={(e) => handleEditLookbookStory(index, "description", e.target.value)}
                                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                                rows={2}
                                required
                              />
                            </div>

                            {/* Image URL with resolver */}
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase tracking-wider text-slate-500">Image URL</Label>
                              <Input
                                value={story.image}
                                onChange={(e) => handleEditLookbookStory(index, "image", e.target.value)}
                                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                                placeholder="https://i.ibb.co/..."
                                required
                              />
                            </div>

                            {/* Image preview (img tag) */}
                            <div className="w-full aspect-[16/10] bg-slate-950 border border-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center">
                              {story.image ? (
                                <img
                                  src={story.image}
                                  alt="Lookbook story preview"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                                  }}
                                />
                              ) : null}
                              <div className={`flex flex-col items-center justify-center p-2 text-center text-[10px] text-amber-400/80 bg-slate-950 absolute inset-0 ${story.image ? "hidden" : ""}`}>
                                <span>No Image / Invalid URL</span>
                              </div>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-semibold uppercase tracking-widest px-6 mt-4"
                  >
                    {saving ? "Saving..." : "Save Lookbook Settings"}
                  </Button>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

        </Tabs>

      </div>
    </AdminGuard>
  );
}
