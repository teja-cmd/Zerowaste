import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Heart,
  Leaf,
  Loader2,
  MapPin,
  Radio,
  Search,
  Utensils,
} from "lucide-react";
import MapView from "@/components/map/MapView";
import { supabase } from "@/integrations/supabase/client";

const LiveAvailability = () => {
  const [availableOffers, setAvailableOffers] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadAvailability = async () => {
      const { count, error } = await supabase
        .from("donations")
        .select("id", { count: "exact", head: true })
        .gt("expiry_time", new Date().toISOString())
        .in("status", ["fresh", "expiring_soon"]);

      if (!isActive) return;
      if (error) {
        setAvailableOffers(null);
        setLoadError("Live availability is temporarily unavailable.");
        return;
      }

      setAvailableOffers(count ?? 0);
      setLastUpdated(new Date());
      setLoadError(null);
    };

    void loadAvailability();
    const refreshInterval = window.setInterval(() => void loadAvailability(), 60_000);
    const channel = supabase
      .channel("home-live-donation-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, () => {
        void loadAvailability();
      })
      .subscribe();

    return () => {
      isActive = false;
      window.clearInterval(refreshInterval);
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-eco-green-200 bg-eco-green-800 p-6 text-white shadow-sm md:p-8">
      <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/5" />
      <div className="relative flex items-center gap-2 text-sm font-medium text-eco-green-100">
        <Radio className="h-4 w-4" aria-hidden="true" />
        ZeroWaste right now
      </div>
      <div className="relative mt-5 text-4xl font-bold tabular-nums md:text-5xl" aria-live="polite">
        {availableOffers === null ? (
          loadError ? (
            <span className="text-lg font-medium">{loadError}</span>
          ) : (
            <Loader2 className="h-9 w-9 animate-spin" aria-label="Loading live food offers" />
          )
        ) : (
          new Intl.NumberFormat("en-IN").format(availableOffers)
        )}
      </div>
      <p className="relative mt-2 text-eco-green-100">food offers available for pickup</p>
      <p className="relative mt-5 border-t border-white/15 pt-4 text-xs text-eco-green-100">
        {lastUpdated
          ? `Live from community listings · updated ${lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
          : "Live count from active community listings"}
      </p>
    </div>
  );
};

const impactStories = [
  {
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85",
    alt: "Freshly baked bread ready to be shared",
    label: "For food donors",
    title: "Give good food another destination",
    description: "Post surplus food with its quantity and pickup window, so nearby people can find it before it goes to waste.",
    icon: Heart,
  },
  {
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=85",
    alt: "People sharing a meal together",
    label: "For local communities",
    title: "Find food close to home",
    description: "Recipients can explore nearby listings on the map and request food that fits their needs and schedule.",
    icon: MapPin,
  },
  {
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=900&q=85",
    alt: "A colorful selection of fresh fruit",
    label: "For everyone",
    title: "Make every pickup count",
    description: "Clear food details and time-sensitive pickup information help good food reach people while it is still fresh.",
    icon: Leaf,
  },
];

const Index = () => {
  return (
    <Layout>
      <section className="overflow-hidden bg-gradient-to-br from-eco-green-50 via-white to-eco-blue-50 py-16 md:py-24">
        <div className="container mx-auto flex flex-col items-center gap-12 px-4 md:px-6 lg:flex-row">
          <div className="lg:w-1/2 lg:pr-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-eco-green-200 bg-white/80 px-4 py-2 text-sm font-semibold text-eco-green-800">
              <Leaf className="h-4 w-4 text-eco-green-600" aria-hidden="true" />
              Good food deserves a second chance
            </div>
            <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-eco-green-900 md:text-6xl">
              Share more food.
              <span className="block text-eco-green-600">Waste a little less.</span>
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-gray-700">
              ZeroWaste helps food donors share surplus with nearby people and community organizations. Post a listing, find it on the map, and arrange a pickup.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/donate">
                  <Heart className="mr-2 h-5 w-5" />
                  Share surplus food
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-eco-green-300 bg-white/80" asChild>
                <Link to="/map">
                  <Search className="mr-2 h-5 w-5" />
                  Find food nearby
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-eco-green-600" aria-hidden="true" />
              Connecting local communities across India
            </div>
          </div>

          <div className="relative w-full lg:w-1/2">
            <div className="absolute -left-5 -top-5 h-28 w-28 rounded-full bg-eco-green-200/70 blur-2xl" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-black/5">
              <img
                src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=90"
                alt="A fresh, colorful meal made with wholesome ingredients"
                className="h-full w-full object-cover"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3 text-white sm:bottom-7 sm:left-7 sm:right-7">
                <div>
                  <p className="text-sm font-medium text-white/80">A simple idea with a local impact</p>
                  <p className="mt-1 text-xl font-semibold sm:text-2xl">From surplus to shared</p>
                </div>
                <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                  <Utensils className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 left-4 rounded-xl border border-eco-green-100 bg-white p-4 shadow-lg sm:left-8">
              <p className="flex items-center gap-2 text-sm font-semibold text-eco-green-800">
                <span className="h-2.5 w-2.5 rounded-full bg-eco-green-500" />
                Shared in your community
              </p>
              <p className="mt-1 text-xs text-gray-500">Discover available food on the map</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-eco-green-600">The scale of the challenge</p>
            <h2 className="text-3xl font-bold text-eco-green-900 md:text-4xl">
              There is enough food. It needs to reach people.
            </h2>
            <p className="mt-4 text-gray-600">
              These global estimates show why local food sharing matters. They are published figures, not live counters.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-orange-100 bg-orange-50/70 p-6 md:p-8">
              <p className="text-sm font-semibold text-orange-800">Global food waste</p>
              <p className="mt-4 text-4xl font-bold tracking-tight text-orange-950 md:text-5xl">1.05B</p>
              <p className="mt-2 text-gray-700">tonnes of food wasted in 2022</p>
              <a
                href="https://www.unep.org/resources/publication/food-waste-index-report-2024"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex text-sm font-medium text-orange-800 underline decoration-orange-300 underline-offset-4 hover:text-orange-950"
              >
                UNEP Food Waste Index Report 2024
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </a>
            </article>

            <article className="rounded-2xl border border-amber-100 bg-amber-50/70 p-6 md:p-8">
              <p className="text-sm font-semibold text-amber-800">People facing hunger</p>
              <p className="mt-4 text-4xl font-bold tracking-tight text-amber-950 md:text-5xl">733M</p>
              <p className="mt-2 text-gray-700">people faced hunger in 2023</p>
              <a
                href="https://www.fao.org/publications/home/fao-flagship-publications/the-state-of-food-security-and-nutrition-in-the-world/en"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex text-sm font-medium text-amber-800 underline decoration-amber-300 underline-offset-4 hover:text-amber-950"
              >
                FAO · SOFI 2024
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </a>
            </article>

            <LiveAvailability />
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-eco-green-600">How ZeroWaste helps</p>
            <h2 className="text-3xl font-bold text-eco-green-900 md:text-4xl">A better route for good food</h2>
            <p className="mt-4 text-gray-600">
              We make it easier for people with surplus food and people who can use it to find each other.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {impactStories.map(({ image, alt, label, title, description, icon: Icon }) => (
              <article key={title} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg">
                <div className="aspect-[16/10] overflow-hidden bg-eco-green-50">
                  <img
                    src={image}
                    alt={alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-eco-green-700">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </p>
                  <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                  <p className="mt-3 leading-relaxed text-gray-600">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-eco-green-50 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-eco-green-600">Three steps, one shared goal</p>
            <h2 className="text-3xl font-bold text-eco-green-900 md:text-4xl">How it works</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <MapPin className="h-8 w-8 text-eco-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Post available food</h3>
              <p className="max-w-sm text-gray-600">Share the food type, quantity, location, and pickup details.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <Clock className="h-8 w-8 text-eco-blue-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Find a nearby match</h3>
              <p className="max-w-sm text-gray-600">Recipients can explore active listings and request a convenient pickup.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <BadgeCheck className="h-8 w-8 text-eco-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Complete the handoff</h3>
              <p className="max-w-sm text-gray-600">Coordinate directly and get good food to someone who can use it.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-eco-green-900 md:text-4xl">Available food near you</h2>
            <p className="text-gray-600">
              Browse current food donations around India. Use the full map to filter by food type and freshness.
            </p>
          </div>
          <div className="h-[400px] overflow-hidden rounded-2xl border border-eco-green-200 shadow-lg">
            <MapView showFilters={false} />
          </div>
          <div className="mt-6 text-center">
            <Button asChild>
              <Link to="/map">Explore the full map</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-eco-green-700 py-16 text-white md:py-20">
        <div className="container mx-auto px-4 text-center md:px-6">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Make your next meal matter</h2>
          <p className="mx-auto mb-8 max-w-2xl leading-relaxed text-eco-green-50">
            Whether you have extra food or are looking for support, join a community turning local surplus into shared meals.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Join ZeroWaste</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white/10 hover:text-white" asChild>
              <Link to="/about">Learn more</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
