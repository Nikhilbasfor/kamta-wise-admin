"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/data/products";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

interface StoreContextType {
  cart: CartItem[];
  wishlist: Product[];
  quickViewProduct: Product | null;
  isCartOpen: boolean;
  isQuickViewOpen: boolean;
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (isOpen: boolean) => void;
  checkoutMessage: string | null;
  triggerCheckout: () => void;
  clearCheckoutMessage: () => void;
  checkoutStep: "cart" | "address" | "success";
  setCheckoutStep: (step: "cart" | "address" | "success") => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  promoApplied: boolean;
  setPromoApplied: (applied: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "address" | "success">("cart");
  const [isMounted, setIsMounted] = useState(false);
  const [prevUserId, setPrevUserId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  // Initialize mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load user-specific cart and wishlist from localStorage/Firestore when user changes
  useEffect(() => {
    if (!isMounted) return;
    if (!user) {
      setCart([]);
      setWishlist([]);
      setPrevUserId(null);
      return;
    }

    const currentUid = user.uid;
    const isDifferentUser = prevUserId !== null && prevUserId !== currentUid;

    if (isDifferentUser) {
      // Reset state for the different user account
      setCart([]);
      setWishlist([]);
    }

    const savedCart = localStorage.getItem(`kamta_wise_cart_${currentUid}`);
    const savedWishlist = localStorage.getItem(`kamta_wise_wishlist_${currentUid}`);

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing user cart from localStorage", e);
        setCart([]);
      }
    } else {
      getDoc(doc(db, "users", currentUid, "storeData", "cart")).then((cartDoc) => {
        if (cartDoc.exists()) {
          const items = cartDoc.data().items || [];
          setCart(items);
          localStorage.setItem(`kamta_wise_cart_${currentUid}`, JSON.stringify(items));
        } else if (isDifferentUser) {
          setCart([]);
        }
      }).catch((err) => {
        console.error("Error loading cart from firestore:", err);
      });
    }

    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error("Error parsing user wishlist from localStorage", e);
        setWishlist([]);
      }
    } else {
      getDoc(doc(db, "users", currentUid, "storeData", "wishlist")).then((wishlistDoc) => {
        if (wishlistDoc.exists()) {
          const items = wishlistDoc.data().items || [];
          setWishlist(items);
          localStorage.setItem(`kamta_wise_wishlist_${currentUid}`, JSON.stringify(items));
        } else if (isDifferentUser) {
          setWishlist([]);
        }
      }).catch((err) => {
        console.error("Error loading wishlist from firestore:", err);
      });
    }

    setPrevUserId(currentUid);
  }, [user, isMounted]);

  // Save cart to localStorage and Firestore when it changes
  useEffect(() => {
    if (!isMounted) return;
    if (user) {
      localStorage.setItem(`kamta_wise_cart_${user.uid}`, JSON.stringify(cart));
      setDoc(doc(db, "users", user.uid, "storeData", "cart"), { items: cart }).catch((err) => {
        console.error("Error saving cart to Firestore:", err);
      });
    }
  }, [cart, user, isMounted]);

  // Save wishlist to localStorage and Firestore when it changes
  useEffect(() => {
    if (!isMounted) return;
    if (user) {
      localStorage.setItem(`kamta_wise_wishlist_${user.uid}`, JSON.stringify(wishlist));
      setDoc(doc(db, "users", user.uid, "storeData", "wishlist"), { items: wishlist }).catch((err) => {
        console.error("Error saving wishlist to Firestore:", err);
      });
    }
  }, [wishlist, user, isMounted]);

  const addToCart = (product: Product, size: string, color: string, quantity = 1) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
      );

      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      }

      return [...prevCart, { product, quantity, selectedSize: size, selectedColor: color }];
    });
    setCheckoutMessage(null); // Clear checkout message on cart update
    setIsCartDrawerOpen(true); // Auto-open drawer when adding item
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedSize === size &&
            item.selectedColor === color
          )
      )
    );
    setCheckoutMessage(null);
  };

  const updateCartQuantity = (productId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId &&
        item.selectedSize === size &&
        item.selectedColor === color
          ? { ...item, quantity }
          : item
      )
    );
    setCheckoutMessage(null);
  };

  const clearCart = () => {
    setCart([]);
    setCheckoutMessage(null);
  };

  const toggleWishlist = (product: Product) => {
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.some((item) => item.id === product.id);
      if (exists) {
        return prevWishlist.filter((item) => item.id !== product.id);
      } else {
        return [...prevWishlist, product];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  const openQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const closeQuickView = () => {
    setIsQuickViewOpen(false);
    // Let animation finish before removing product
    setTimeout(() => {
      setQuickViewProduct(null);
    }, 300);
  };

  const triggerCheckout = () => {
    setIsCartDrawerOpen(true);
    setCheckoutMessage(null);
  };

  const clearCheckoutMessage = () => {
    setCheckoutMessage(null);
  };

  return (
    <StoreContext.Provider
      value={{
        cart,
        wishlist,
        quickViewProduct,
        isCartOpen: isCartDrawerOpen,
        isQuickViewOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        openQuickView,
        closeQuickView,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        checkoutMessage,
        triggerCheckout,
        clearCheckoutMessage,
        checkoutStep,
        setCheckoutStep,
        promoCode,
        setPromoCode,
        promoApplied,
        setPromoApplied,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
