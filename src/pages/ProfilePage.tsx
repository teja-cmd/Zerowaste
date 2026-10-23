import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CircleHelp,
  Clock3,
  Gift,
  Heart,
  Leaf,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  Utensils,
} from "lucide-react";

type DonationSummary = {
  id: string;
  title: string;
  quantity: string;
  status: string | null;
  expiry_time: string;
  created_at: string | null;
  image_url: string | null;
};

const checklistItems = [
  "Food is fresh and safe to share",
  "I know the quantity and ingredients",
  "I can set a clear pickup time",
];

const ProfilePage = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<DonationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const fetchDonations = useCallback(async () => {
    if (!user) {
      setDonations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("donations")
      .select("id, title, quantity, status, expiry_time, created_at, image_url")
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError("We couldn't load your donation activity. Please try again.");
      console.error("Error loading profile donations:", error);
    } else {
      setDonations(data ?? []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchDonations();
  }, [fetchDonations]);

  const activeDonations = useMemo(
    () => donations.filter((donation) =>
      new Date(donation.expiry_time).getTime() > Date.now()
      && ["fresh", "expiring_soon"].includes(donation.status ?? "fresh"),
    ).length,
    [donations],
  );

  const metadataName = user?.user_metadata?.name;
  const displayName = typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim()
    : user?.email?.split("@")[0] ?? "Food sharer";
  const initial = displayName.charAt(0).toUpperCase();

  const toggleChecklistItem = (item: string) => {
    setCheckedItems((current) => current.includes(item)
      ? current.filter((checked) => checked !== item)
      : [...current, item],
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-eco-green-50/50 pb-16">
        <section className="relative isolate overflow-hidden bg-eco-green-900 text-white">
          <img
            src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1800&q=85"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-eco-green-900 via-eco-green-900/95 to-eco-green-800/70" />
          <div className="container relative z-20 mx-auto px-4 py-12 md:px-6 md:py-16">
            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-bold text-white shadow-lg backdrop-blur sm:h-20 sm:w-20 sm:text-3xl">
                  {initial}
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium text-eco-green-100">
                    <Sparkles className="h-4 w-4" />
                    Your community impact starts here
                  </p>
                  <h1 className="text-3xl font-bold md:text-4xl">Welcome, {displayName}</h1>
                  <p className="mt-2 text-sm text-white/75">{user?.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" asChild>
                  <Link to="/donate"><Heart className="h-4 w-4" /> Share food</Link>
                </Button>
                <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" asChild>
                  <Link to="/donations">My listings</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto space-y-8 px-4 py-8 md:px-6 md:py-10">
          <section aria-label="Your donation activity" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-eco-green-100 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-xl bg-eco-green-100 p-3 text-eco-green-700"><Gift className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-gray-500">Food listings shared</p>
                  <p className="text-2xl font-bold text-gray-900">{isLoading ? "—" : donations.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-eco-blue-100 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-xl bg-eco-blue-100 p-3 text-eco-blue-700"><MapPin className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-gray-500">Available for pickup</p>
                  <p className="text-2xl font-bold text-gray-900">{isLoading ? "—" : activeDonations}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-100 shadow-sm sm:col-span-2 lg:col-span-1">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-xl bg-amber-100 p-3 text-amber-700"><Leaf className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-gray-500">Your next step</p>
                  <p className="text-lg font-bold text-gray-900">{donations.length ? "Keep sharing" : "Post your first offer"}</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="overflow-hidden border-eco-green-100 shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Your recent food shares</h2>
                  <p className="mt-1 text-sm text-gray-500">A little surplus can mean a lot to someone nearby.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => void fetchDonations()} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh
                </Button>
              </div>
              <CardContent className="p-5">
                {loadError ? (
                  <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <p>{loadError}</p>
                    <Button className="mt-3" size="sm" variant="outline" onClick={() => void fetchDonations()}>Try again</Button>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin text-eco-green-600" /> Loading your activity…
                  </div>
                ) : donations.length === 0 ? (
                  <div className="rounded-2xl bg-eco-green-50 p-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-eco-green-700 shadow-sm">
                      <Utensils className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Your first food share starts here</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
                      Have extra groceries, produce, or a freshly prepared meal? Post the details and help a neighbor find it.
                    </p>
                    <Button className="mt-4" asChild><Link to="/donate">Create your first listing <ArrowRight className="h-4 w-4" /></Link></Button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {donations.slice(0, 4).map((donation) => {
                      const isActive = new Date(donation.expiry_time).getTime() > Date.now()
                        && ["fresh", "expiring_soon"].includes(donation.status ?? "fresh");
                      return (
                        <div key={donation.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-eco-green-100">
                            {donation.image_url ? (
                              <img src={donation.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-eco-green-700"><Utensils className="h-5 w-5" /></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-gray-900">{donation.title}</p>
                            <p className="mt-1 text-sm text-gray-500">{donation.quantity}</p>
                            {donation.created_at && (
                              <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                <CalendarDays className="h-3 w-3" />
                                Shared {formatDistanceToNow(new Date(donation.created_at), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                          <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "shrink-0 bg-eco-green-100 text-eco-green-800 hover:bg-eco-green-100" : "shrink-0"}>
                            {isActive ? "Available" : "Past listing"}
                          </Badge>
                        </div>
                      );
                    })}
                    {donations.length > 4 && (
                      <Button variant="link" className="mt-3 px-0" asChild><Link to="/donations">View all {donations.length} listings <ArrowRight className="h-4 w-4" /></Link></Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-eco-green-700 to-eco-green-900 text-white shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><CircleHelp className="h-6 w-6" /></div>
                  <h2 className="text-xl font-bold">Your next donation, made easy</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    Fresh produce, pantry staples, packaged meals, and surplus from a gathering can all be a great start. Add clear pickup details so food gets collected in time.
                  </p>
                  <Button variant="secondary" className="mt-5" asChild>
                    <Link to="/donate">Start a food listing <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-eco-green-100 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="rounded-lg bg-eco-green-100 p-2 text-eco-green-700"><BadgeCheck className="h-5 w-5" /></div>
                    <div>
                      <h2 className="font-bold text-gray-900">Donation prep checklist</h2>
                      <p className="mt-1 text-xs text-gray-500">Tap each step as you get ready.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {checklistItems.map((item) => {
                      const checked = checkedItems.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          aria-pressed={checked}
                          onClick={() => toggleChecklistItem(item)}
                          className="flex w-full items-center gap-3 rounded-lg border border-gray-100 p-3 text-left text-sm transition-colors hover:bg-eco-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green-600"
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? "border-eco-green-600 bg-eco-green-600 text-white" : "border-gray-300 bg-white"}`}>
                            {checked && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span className={checked ? "text-gray-400 line-through" : "text-gray-700"}>{item}</span>
                        </button>
                      );
                    })}
                  </div>
                  {checkedItems.length === checklistItems.length && (
                    <p className="mt-3 flex items-center gap-2 text-sm font-medium text-eco-green-700">
                      <Sparkles className="h-4 w-4" /> You're ready to make a food listing!
                    </p>
                  )}
                  <p className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                    <Clock3 className="h-3.5 w-3.5" /> Checklist resets when you leave this page.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
