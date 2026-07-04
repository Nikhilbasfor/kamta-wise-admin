"use client";

import React, { useState, useEffect } from "react";
import AdminGuard from "@/components/AdminGuard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ShoppingBag, Receipt, Users, Mail, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    users: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // 1. Fetch products count
        let productsCount = 0;
        try {
          const productsSnap = await getDocs(collection(db, "products"));
          productsCount = productsSnap.size;
        } catch (e) {
          console.error("Error fetching products:", e);
        }

        // 2. Fetch users and sum orders
        let usersCount = 0;
        let ordersCount = 0;
        try {
          const usersSnap = await getDocs(collection(db, "users"));
          usersCount = usersSnap.size;
          usersSnap.forEach((doc) => {
            const data = doc.data();
            if (Array.isArray(data.orders)) {
              ordersCount += data.orders.length;
            }
          });
        } catch (e) {
          console.error("Error fetching users:", e);
        }

        // 3. Fetch unread messages
        let unreadCount = 0;
        try {
          const messagesQuery = query(
            collection(db, "contact_messages"),
            where("status", "==", "unread")
          );
          const messagesSnap = await getDocs(messagesQuery);
          unreadCount = messagesSnap.size;
        } catch (e) {
          console.error("Error fetching messages:", e);
        }

        setStats({
          products: productsCount,
          orders: ordersCount,
          users: usersCount,
          unreadMessages: unreadCount,
        });
      } catch (err) {
        console.error("General error loading stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const cardItems = [
    {
      title: "Total Products",
      value: stats.products,
      description: "Items in active database",
      icon: ShoppingBag,
      href: "/dashboard/products",
      color: "text-blue-400",
    },
    {
      title: "Total Orders",
      value: stats.orders,
      description: "Purchases completed",
      icon: Receipt,
      href: "/dashboard/orders",
      color: "text-emerald-400",
    },
    {
      title: "Total Users",
      value: stats.users,
      description: "Registered accounts",
      icon: Users,
      href: "/dashboard/users",
      color: "text-purple-400",
    },
    {
      title: "Unread Messages",
      value: stats.unreadMessages,
      description: "Awaiting response",
      icon: Mail,
      href: "/dashboard/messages",
      color: stats.unreadMessages > 0 ? "text-amber-400 animate-pulse" : "text-slate-400",
    },
  ];

  return (
    <AdminGuard>
      <div className="space-y-8 font-sans">
        
        {/* Title and stats badge */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-wide text-slate-100 uppercase">
              Dashboard Overview
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Real-time store metrics and control center
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs text-slate-400">
            <Activity size={14} className="text-emerald-500" />
            <span>Database Synchronized</span>
          </div>
        </div>

        {loading ? (
          /* Skeleton Loader */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-slate-900 border-slate-800 animate-pulse h-36" />
            ))}
          </div>
        ) : (
          /* Metric Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cardItems.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="bg-slate-900 border-slate-800 hover:border-slate-700/80 transition-all duration-300 group shadow-md flex flex-col justify-between">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <span className="text-xs uppercase tracking-widest text-slate-400">
                      {card.title}
                    </span>
                    <Icon size={18} className={card.color} />
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-3xl font-light text-slate-100 font-sans tracking-tight">
                      {card.value}
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                      {card.description}
                    </p>
                  </CardContent>
                  
                  {/* Bottom Link Area */}
                  <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/50 rounded-b-lg flex items-center justify-between">
                    <Link 
                      href={card.href} 
                      className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-100 flex items-center gap-1 transition-colors"
                    >
                      Manage
                      <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-0 group-hover:translate-x-0.5 duration-300" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Quick welcome panel */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-2 mt-8 shadow-inner">
          <h2 className="text-sm font-semibold tracking-wider text-slate-200 uppercase">
            Operational Protocol
          </h2>
          <p className="text-xs text-slate-500 font-light leading-relaxed max-w-xl">
            Welcome to the Kamta Wise administration grid. Use the left navigation panel to view orders, add/edit items in the catalog, verify client submissions, and monitor active user metrics. Keep this portal confidential.
          </p>
        </div>

      </div>
    </AdminGuard>
  );
}
