import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import {
  Send,
  Plus,
  Camera,
  MapPin,
  Phone,
  User,
  MessageCircle,
  ShoppingCart,
  HandHelping,
  Tractor,
  Image as ImageIcon,
  X,
  CheckCircle2,
} from "lucide-react";

/** ---------- Types ---------- */
type ChatMessage = {
  id: string;
  type: "sent" | "received";
  sender?: string;
  avatarColor?: string;
  message: string;
  time: string;
  location?: string;
  dmWith?: string; // farmerId if this is in a DM thread
};

type OfferCard = {
  id: string;
  title: string;
  pricePerDay: number; // ₹/day
  mrp?: number;
  sellerId: string;
  sellerName: string;
  location: string;
  phone: string;
  photoUrl: string;
};

type Farmer = {
  id: string;
  name: string;
  location: string;
  phone: string;
  avatarColor: string;
};

/** Util */
const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** ---------- Component ---------- */
const Community: React.FC = () => {
  /** Seed farmers (DM list) */
  const farmers: Farmer[] = useMemo(
    () => [
      {
        id: "f1",
        name: "Ramesh Patil",
        location: "Pune, Maharashtra",
        phone: "+91 98765 43210",
        avatarColor: "bg-green-600",
      },
      {
        id: "f2",
        name: "Suresh Kumar",
        location: "Nagpur, Maharashtra",
        phone: "+91 98765 43213",
        avatarColor: "bg-emerald-600",
      },
      {
        id: "f3",
        name: "Priya Sharma",
        location: "Indore, MP",
        phone: "+91 98765 43212",
        avatarColor: "bg-lime-600",
      },
      {
        id: "f4",
        name: "Gurpreet Singh",
        location: "Amritsar, Punjab",
        phone: "+91 98765 43211",
        avatarColor: "bg-teal-600",
      },
    ],
    []
  );

  /** Marketplace offers */
  const [offers, setOffers] = useState<OfferCard[]>([
    {
      id: "o1",
      title: "Tractor - Mahindra 575, 50 HP",
      pricePerDay: 800,
      mrp: 850000,
      sellerId: "f1",
      sellerName: "Ramesh Patil",
      location: "Pune, Maharashtra",
      phone: "+91 98765 43210",
      photoUrl:
        "https://images.unsplash.com/photo-1565069271028-cd5a7f2c2b0a?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "o2",
      title: "Premium Basmati Rice Seeds (disease-resistant)",
      pricePerDay: 0,
      mrp: 150, // per kg
      sellerId: "f4",
      sellerName: "Gurpreet Singh",
      location: "Amritsar, Punjab",
      phone: "+91 98765 43211",
      photoUrl:
        "https://images.unsplash.com/photo-1604335399105-0d4f1be8472c?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "o3",
      title: "Water Pump (7.5 HP) with hose",
      pricePerDay: 450,
      mrp: 38000,
      sellerId: "f2",
      sellerName: "Suresh Kumar",
      location: "Nagpur, Maharashtra",
      phone: "+91 98765 43213",
      photoUrl:
        "https://images.unsplash.com/photo-1621784563234-3ea7d9c410d4?q=80&w=1200&auto=format&fit=crop",
    },
  ]);

  /** Community feed (public channel) */
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      type: "received",
      sender: "Ramesh Patil",
      avatarColor: "bg-green-600",
      message:
        "Tractor available for rent – Mahindra 575, 50 HP. ₹800/day with all attachments.",
      time: "10:30 AM",
      location: "Pune, Maharashtra",
    },
    {
      id: "m2",
      type: "received",
      sender: "Suresh Kumar",
      avatarColor: "bg-emerald-600",
      message:
        "Anyone facing pest issues in cotton? Found some effective organic solutions.",
      time: "10:25 AM",
      location: "Nagpur, Maharashtra",
    },
  ]);

  /** DM threads: farmerId -> list of messages */
  const [dm, setDm] = useState<Record<string, ChatMessage[]>>({
    f1: [
      {
        id: "d1",
        type: "received",
        sender: "Ramesh Patil",
        avatarColor: "bg-green-600",
        message: "Namaste! How can I help you?",
        time: "09:15 AM",
        dmWith: "f1",
      },
    ],
  });

  const [activeDM, setActiveDM] = useState<string | null>(null);

  /** Composer state */
  const [input, setInput] = useState("");
  const [composeTarget, setComposeTarget] = useState<"community" | "dm">(
    "community"
  );

  /** Offer Modal state */
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerForm, setOfferForm] = useState<{
    title: string;
    pricePerDay: string;
    mrp: string;
    sellerId: string;
    location: string;
    phone: string;
    photoFile?: File;
    photoPreview?: string;
  }>({
    title: "",
    pricePerDay: "",
    mrp: "",
    sellerId: "f1",
    location: farmers[0].location,
    phone: farmers[0].phone,
  });
  const [offerError, setOfferError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const dmBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeDM) dmBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dm, activeDM]);

  /** ---- Handlers ---- */
  const appendCommunityMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "sent",
        message: text,
        time: nowTime(),
      },
    ]);
  };

  const appendDmMessage = (farmerId: string, text: string, sent = true) => {
    setDm((prev) => {
      const thread = prev[farmerId] || [];
      const me: ChatMessage = {
        id: crypto.randomUUID(),
        type: sent ? "sent" : "received",
        sender: sent ? undefined : farmers.find((f) => f.id === farmerId)?.name,
        message: text,
        time: nowTime(),
        dmWith: farmerId,
      };
      return { ...prev, [farmerId]: [...thread, me] };
    });
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    if (composeTarget === "community") {
      appendCommunityMessage(text);
    } else if (activeDM) {
      appendDmMessage(activeDM, text, true);
    }
    setInput("");
  };

  /** Quick Action buttons */
  const quickRequest = () =>
    setInput("REQUEST: Looking to borrow a rotavator for 2 days. ₹? per day.");
  const quickRent = () =>
    setInput(
      "RENT: Water tanker available (3000L). ₹600/day. DM for details."
    );
  const quickOffer = () => setOfferOpen(true);

  /** Offer form logic */
  const updateOfferField = (k: string, v: string | File) => {
    setOfferForm((p) => {
      if (k === "sellerId") {
        const farmer = farmers.find((f) => f.id === v)!;
        return { ...p, sellerId: farmer.id, phone: farmer.phone, location: farmer.location };
      }
      if (k === "photoFile" && v instanceof File) {
        const preview = URL.createObjectURL(v);
        return { ...p, photoFile: v, photoPreview: preview };
      }
      return { ...p, [k]: v as string };
    });
  };

  const submitOffer = () => {
    setOfferError(null);
    const { title, pricePerDay, mrp, sellerId, phone, location, photoPreview } =
      offerForm;
    if (!title || !sellerId || !phone || !location) {
      setOfferError("Please fill all required fields.");
      return;
    }
    if (!photoPreview) {
      setOfferError("Please upload a clear photo of the resource.");
      return;
    }
    const perDay = Number(pricePerDay || 0);
    const mrpNum = mrp ? Number(mrp) : undefined;

    const seller = farmers.find((f) => f.id === sellerId)!;

    const newOffer: OfferCard = {
      id: crypto.randomUUID(),
      title,
      pricePerDay: perDay,
      mrp: mrpNum,
      sellerId: seller.id,
      sellerName: seller.name,
      phone,
      location,
      photoUrl: photoPreview,
    };
    setOffers((prev) => [newOffer, ...prev]);
    setOfferOpen(false);

    // announce to community feed
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "received",
        sender: seller.name,
        avatarColor: seller.avatarColor,
        message: `OFFER: ${title} — ${
          perDay ? `₹${perDay}/day` : mrpNum ? `₹${mrpNum}` : "price on call"
        }. Call ${phone}.`,
        time: nowTime(),
        location,
      },
    ]);
    // reset minimal
    setOfferForm((p) => ({
      title: "",
      pricePerDay: "",
      mrp: "",
      sellerId: p.sellerId,
      location: farmers.find((f) => f.id === p.sellerId)?.location || "",
      phone: farmers.find((f) => f.id === p.sellerId)?.phone || "",
      photoFile: undefined,
      photoPreview: undefined,
    }));
  };

  /** Contact seller from a card -> open DM with stub */
  const contactSeller = (sellerId: string, title: string) => {
    setActiveDM(sellerId);
    setComposeTarget("dm");
    const seller = farmers.find((f) => f.id === sellerId)!;
    if (!dm[sellerId]) {
      setDm((prev) => ({
        ...prev,
        [sellerId]: [
          {
            id: crypto.randomUUID(),
            type: "received",
            sender: seller.name,
            avatarColor: seller.avatarColor,
            message: "Hi! Thanks for reaching out.",
            time: nowTime(),
            dmWith: sellerId,
          },
        ],
      }));
    }
    setInput(`Interested in your offer: "${title}". Is it available?`);
  };

  /** ---------- UI ---------- */
  return (
    <Layout>
      <div className="h-[calc(100vh-120px)] max-h-[1600px] grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-4 lg:gap-6 p-4 lg:p-6 bg-green-50/40">
        {/* Left: DM list */}
        <aside className="bg-white rounded-2xl border border-green-100 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-green-100">
            <h2 className="text-lg font-semibold text-green-800 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Farmers
            </h2>
          </div>
          <div className="p-3 space-y-2 overflow-y-auto">
            {farmers.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setActiveDM(f.id);
                  setComposeTarget("dm");
                }}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 border transition ${
                  activeDM === f.id
                    ? "bg-green-50 border-green-200"
                    : "border-gray-100 hover:bg-green-50/60"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full ${f.avatarColor} text-white grid place-content-center font-semibold`}
                >
                  {f.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {f.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {f.location}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-auto p-3 text-xs text-gray-500 border-t border-green-100">
            Tip: Click a farmer to start a private chat.
          </div>
        </aside>

        {/* Middle: Chat area */}
        <section className="bg-white rounded-2xl border border-green-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-green-100 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-green-800">
                {composeTarget === "community"
                  ? "Community Chat"
                  : `Direct Message • ${
                      farmers.find((f) => f.id === activeDM)?.name || "Select a farmer"
                    }`}
              </h1>
              <p className="text-gray-600 text-sm">
                {composeTarget === "community"
                  ? "Connect and collaborate with farmers in your area"
                  : farmers.find((f) => f.id === activeDM)?.location}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Safe & Verified
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 bg-green-50/40 p-4 lg:p-6 overflow-y-auto">
            {composeTarget === "community" ? (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.type === "sent" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl ${
                        msg.type === "sent"
                          ? "bg-green-600 text-white rounded-br-md"
                          : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100"
                      }`}
                    >
                      {msg.type === "received" && msg.sender && (
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`h-5 w-5 rounded-full ${msg.avatarColor} text-white grid place-content-center text-[10px]`}
                          >
                            {msg.sender.charAt(0)}
                          </div>
                          <span className="font-semibold text-green-700 text-sm">
                            {msg.sender}
                          </span>
                        </div>
                      )}
                      <p className="text-sm md:text-[15px] leading-relaxed">
                        {msg.message}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span
                          className={`text-[11px] ${
                            msg.type === "sent" ? "text-green-100" : "text-gray-500"
                          }`}
                        >
                          {msg.time}
                        </span>
                        {msg.location && msg.type === "received" && (
                          <span className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {msg.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
            ) : activeDM ? (
              <div className="space-y-4">
                {(dm[activeDM] || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.type === "sent" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl ${
                        msg.type === "sent"
                          ? "bg-emerald-600 text-white rounded-br-md"
                          : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100"
                      }`}
                    >
                      {msg.type === "received" && msg.sender && (
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`h-5 w-5 rounded-full ${
                              farmers.find((f) => f.id === activeDM)?.avatarColor
                            } text-white grid place-content-center text-[10px]`}
                          >
                            {msg.sender.charAt(0)}
                          </div>
                          <span className="font-semibold text-green-700 text-sm">
                            {msg.sender}
                          </span>
                        </div>
                      )}
                      <p className="text-sm md:text-[15px] leading-relaxed">
                        {msg.message}
                      </p>
                      <div className="flex items-center justify-end mt-1">
                        <span
                          className={`text-[11px] ${
                            msg.type === "sent" ? "text-emerald-100" : "text-gray-500"
                          }`}
                        >
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={dmBottomRef} />
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                Select a farmer from the left to start chatting directly.
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="bg-white border-t border-green-100 p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="hidden md:flex rounded-full border border-green-200 overflow-hidden">
                <button
                  onClick={() => setComposeTarget("community")}
                  className={`px-3 py-2 text-sm ${
                    composeTarget === "community"
                      ? "bg-green-600 text-white"
                      : "bg-white text-green-700"
                  }`}
                >
                  Community
                </button>
                <button
                  onClick={() => activeDM && setComposeTarget("dm")}
                  className={`px-3 py-2 text-sm ${
                    composeTarget === "dm"
                      ? "bg-green-600 text-white"
                      : "bg-white text-green-700"
                  }`}
                >
                  DM
                </button>
              </div>

              <div className="flex-1 flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={
                    composeTarget === "community"
                      ? "Type a community message…"
                      : "Message privately…"
                  }
                  className="flex-1 px-4 py-3 border border-green-200 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 bg-green-50/30"
                />
                <button
                  onClick={handleSend}
                  className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full"
                  aria-label="Send"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick actions row */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                onClick={quickRequest}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 text-sm"
              >
                <HandHelping className="h-4 w-4" />
                Request
              </button>
              <button
                onClick={quickRent}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 text-sm"
              >
                <Tractor className="h-4 w-4" />
                Rent
              </button>
              <button
                onClick={quickOffer}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 text-sm"
              >
                <ShoppingCart className="h-4 w-4" />
                Offer
              </button>
            </div>
          </div>
        </section>

        {/* Right: Marketplace */}
        <aside className="bg-white rounded-2xl border border-green-100 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-green-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-800 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Nearby Listings
            </h2>
            <button
              onClick={() => setOfferOpen(true)}
              className="text-green-700 text-sm inline-flex items-center gap-1 px-3 py-1 rounded-full border border-green-200 hover:bg-green-50"
            >
              <Plus className="h-4 w-4" /> Post
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto">
            {offers.map((o) => (
              <div
                key={o.id}
                className="border border-green-100 rounded-xl overflow-hidden hover:shadow-md transition"
              >
                <div className="h-36 w-full bg-gray-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={o.photoUrl}
                    alt={o.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <div className="font-semibold text-gray-900">{o.title}</div>
                  <div className="text-sm text-green-700 font-medium mt-1">
                    {o.pricePerDay > 0 ? `₹${o.pricePerDay}/day` : "Rate on request"}
                    {o.mrp ? (
                      <span className="text-gray-500 font-normal"> • MRP ₹{o.mrp}</span>
                    ) : null}
                  </div>
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {o.sellerName}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {o.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {o.phone}
                    </div>
                  </div>
                  <button
                    onClick={() => contactSeller(o.sellerId, o.title)}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm"
                  >
                    Contact in DM
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* ---------- Offer Modal ---------- */}
      {offerOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] grid place-items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-green-100">
              <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" /> Post a Resource / Offer
              </h3>
              <button
                onClick={() => setOfferOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  value={offerForm.title}
                  onChange={(e) => updateOfferField("title", e.target.value)}
                  className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 bg-green-50/30"
                  placeholder="e.g., Tractor - Mahindra 575"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      ₹/day
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={offerForm.pricePerDay}
                      onChange={(e) =>
                        updateOfferField("pricePerDay", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 bg-green-50/30"
                      placeholder="800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      MRP (optional)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={offerForm.mrp}
                      onChange={(e) => updateOfferField("mrp", e.target.value)}
                      className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 bg-green-50/30"
                      placeholder="850000"
                    />
                  </div>
                </div>

                <label className="block text-sm font-medium text-gray-700">
                  Photo (required)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 text-sm">
                    <Camera className="h-4 w-4" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) updateOfferField("photoFile", file);
                      }}
                    />
                  </label>
                  {offerForm.photoPreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={offerForm.photoPreview}
                      alt="preview"
                      className="h-14 w-20 rounded-lg object-cover border border-green-200"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Seller *
                </label>
                <select
                  value={offerForm.sellerId}
                  onChange={(e) => updateOfferField("sellerId", e.target.value)}
                  className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 bg-green-50/30"
                >
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>

                <label className="block text-sm font-medium text-gray-700">
                  Location *
                </label>
                <input
                  value={offerForm.location}
                  onChange={(e) => updateOfferField("location", e.target.value)}
                  className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 bg-green-50/30"
                  placeholder="City, State"
                />

                <label className="block text-sm font-medium text-gray-700">
                  Phone *
                </label>
                <input
                  value={offerForm.phone}
                  onChange={(e) => updateOfferField("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 bg-green-50/30"
                  placeholder="+91 ..."
                />

                {offerError && (
                  <div className="text-red-600 text-sm">{offerError}</div>
                )}

                <button
                  onClick={submitOffer}
                  className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg"
                >
                  Post Offer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Community;
