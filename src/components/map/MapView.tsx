import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { Donation, DonationStatus, FoodType } from "@/types/donations";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AlertCircle, Clock, Loader2, LocateFixed, MapPin, Navigation, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Import default marker icon
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix for default marker icon
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

// Create custom markers based on status
const createCustomMarker = (status: DonationStatus) => {
  let className = "marker-fresh";
  
  if (status === "expiring_soon") {
    className = "marker-expiring";
  } else if (status === "expired") {
    className = "marker-expired";
  }
  
  return L.divIcon({
    className: `custom-marker-icon ${className}`,
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#48972f" width="36" height="36">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
    </svg>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  showFilters?: boolean;
}

const INDIA_CENTER: [number, number] = [22.9734, 78.6569];
const INDIA_LIMITS = { north: 37.6, south: 6.4, east: 97.5, west: 68.1 };
const CITIES: Record<string, { label: string; center: [number, number]; zoom: number }> = {
  india: { label: "All India", center: INDIA_CENTER, zoom: 5 },
  bengaluru: { label: "Bengaluru", center: [12.9716, 77.5946], zoom: 11 },
  chennai: { label: "Chennai", center: [13.0827, 80.2707], zoom: 11 },
  delhi: { label: "Delhi", center: [28.6139, 77.209], zoom: 10 },
  hyderabad: { label: "Hyderabad", center: [17.385, 78.4867], zoom: 11 },
  kolkata: { label: "Kolkata", center: [22.5726, 88.3639], zoom: 11 },
  mumbai: { label: "Mumbai", center: [19.076, 72.8777], zoom: 11 },
};

const MapViewport = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, map, zoom]);

  return null;
};

const toDonation = (row: {
  id: string;
  title: string;
  description: string | null;
  food_type: string | null;
  quantity: string;
  latitude: number;
  longitude: number;
  address: string | null;
  status: string | null;
  image_url: string | null;
  expiry_time: string;
  pickup_window: string | null;
  donor_id: string;
  created_at: string | null;
}): Donation | null => {
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < INDIA_LIMITS.south || lat > INDIA_LIMITS.north || lng < INDIA_LIMITS.west || lng > INDIA_LIMITS.east) return null;

  const expiry = new Date(row.expiry_time).getTime();
  const status: DonationStatus = expiry <= Date.now()
    ? "expired"
    : expiry <= Date.now() + 24 * 60 * 60 * 1000
      ? "expiring_soon"
      : "fresh";

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    image: row.image_url ?? undefined,
    foodType: row.food_type === "non_veg" ? "non_veg" : "veg",
    quantity: row.quantity,
    location: { lat, lng, address: row.address ?? undefined },
    status,
    expiryTime: row.expiry_time,
    pickupWindow: row.pickup_window ?? "Contact donor",
    donorId: row.donor_id,
    donorName: "Food donor",
    createdAt: row.created_at ?? row.expiry_time,
  };
};

const MapView = ({ center = INDIA_CENTER, zoom = 5, showFilters = true }: MapViewProps) => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [foodFilter, setFoodFilter] = useState<"all" | FoodType>("all");
  const [statusFilters, setStatusFilters] = useState<Record<DonationStatus, boolean>>({
    fresh: true,
    expiring_soon: true,
    expired: false,
  });
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [city, setCity] = useState("india");
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadDonations = async () => {
      setIsLoading(true);
      setLoadError(null);
      const expiredCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .gt("expiry_time", expiredCutoff)
        .in("status", ["fresh", "expiring_soon", "expired"])
        .order("created_at", { ascending: false });

      if (!isActive) return;
      if (error) {
        setLoadError(error.message);
        setDonations([]);
      } else {
        setDonations((data ?? []).map(toDonation).filter((donation): donation is Donation => donation !== null));
      }
      setIsLoading(false);
    };

    void loadDonations();
    const refreshInterval = window.setInterval(() => void loadDonations(), 60_000);
    return () => {
      isActive = false;
      window.clearInterval(refreshInterval);
    };
  }, []);

  const filteredDonations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return donations.filter((donation) => {
      const matchesFood = foodFilter === "all" || donation.foodType === foodFilter;
      const matchesStatus = statusFilters[donation.status];
      const matchesSearch = !normalizedSearch || [
        donation.title,
        donation.description,
        donation.location.address ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
      return matchesFood && matchesStatus && matchesSearch;
    });
  }, [donations, foodFilter, search, statusFilters]);

  const handleStatusFilterChange = (status: DonationStatus, checked: boolean) => {
    setStatusFilters((previous) => ({ ...previous, [status]: checked }));
  };

  const handleCityChange = (value: string) => {
    const selected = CITIES[value];
    if (!selected) return;
    setCity(value);
    setMapCenter(selected.center);
    setMapZoom(selected.zoom);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast({ title: "Location unavailable", description: "This browser does not support location access.", variant: "destructive" });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLocating(false);
        if (coords.latitude < INDIA_LIMITS.south || coords.latitude > INDIA_LIMITS.north || coords.longitude < INDIA_LIMITS.west || coords.longitude > INDIA_LIMITS.east) {
          toast({ title: "Outside map area", description: "Your location is outside India.", variant: "destructive" });
          return;
        }
        setCity("");
        setMapCenter([coords.latitude, coords.longitude]);
        setMapZoom(13);
      },
      () => {
        setIsLocating(false);
        toast({ title: "Location permission needed", description: "Allow location access in your browser and try again.", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleRequestPickup = async (donation: Donation) => {
    if (donation.status === "expired") {
      toast({ title: "Donation has expired", description: "Expired food cannot be requested for pickup.", variant: "destructive" });
      return;
    }
    if (!session?.user) {
      toast({ title: "Sign in to request pickup", description: "Create an account or sign in before requesting food." });
      navigate("/login");
      return;
    }
    if (donation.donorId === session.user.id) {
      toast({ title: "This is your donation", description: "You cannot request pickup for your own listing." });
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();
    if (profileError || profile?.role !== "receiver") {
      toast({
        title: "Receiver account required",
        description: profileError?.message ?? "Sign up with the receiver role to request a pickup.",
        variant: "destructive",
      });
      return;
    }

    setRequestingId(donation.id);
    const { error } = await supabase.from("pickup_requests").insert({
      donation_id: donation.id,
      requester_id: session.user.id,
    });
    setRequestingId(null);

    if (error) {
      toast({
        title: error.code === "23505" ? "Pickup already requested" : "Request could not be sent",
        description: error.code === "23505" ? "You already requested this donation." : error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Pickup requested", description: "The donor can now review your request." });
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={4}
        maxBounds={[[INDIA_LIMITS.south, INDIA_LIMITS.west], [INDIA_LIMITS.north, INDIA_LIMITS.east]]}
        maxBoundsViscosity={0.7}
        style={{ height: "100%", width: "100%", background: "#e5eee8" }}
      >
        <MapViewport center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredDonations.map((donation) => (
          <Marker
            key={donation.id}
            position={[donation.location.lat, donation.location.lng]}
            icon={createCustomMarker(donation.status)}
          >
            <Popup>
              <div className="min-w-52 space-y-2 p-1">
                <h3 className="font-semibold text-eco-green-800">{donation.title}</h3>
                <p className="text-sm text-gray-600">{donation.description}</p>
                <p className="text-xs text-gray-600">{donation.location.address || "Address shared after request"}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${donation.foodType === "veg" ? "bg-eco-green-100 text-eco-green-800" : "bg-orange-100 text-orange-800"}`}>
                    {donation.foodType === "veg" ? "Vegetarian" : "Non-vegetarian"}
                  </span>
                  <span>{donation.quantity}</span>
                  <span className="flex items-center"><Clock className="mr-1 h-3 w-3" />{new Date(donation.expiryTime).toLocaleString()}</span>
                  {donation.status === "expiring_soon" && <span className="flex items-center text-amber-700"><AlertCircle className="mr-1 h-3 w-3" />Expiring soon</span>}
                  {donation.status === "expired" && <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">Expired</span>}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1" onClick={() => void handleRequestPickup(donation)} disabled={requestingId === donation.id || donation.status === "expired"}>
                    {requestingId === donation.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <MapPin className="mr-1 h-4 w-4" />}
                    {donation.status === "expired" ? "Expired" : "Request pickup"}
                  </Button>
                  <Button size="icon" variant="outline" asChild>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${donation.location.lat},${donation.location.lng}`} target="_blank" rel="noreferrer" aria-label="Get directions">
                      <Navigation className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {showFilters && (
        <section className="absolute left-4 top-4 z-[1000] w-[min(22rem,calc(100%-2rem))] space-y-3 rounded-md border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur" aria-label="Donation map controls">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">Food near you</h2>
              <p className="text-xs text-gray-500">India-wide donation map</p>
            </div>
            <Button variant="outline" size="icon" onClick={handleLocate} disabled={isLocating} title="Use my location" aria-label="Use my location">
              {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            </Button>
          </div>
          <label className="relative block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search food or area" className="pl-9" aria-label="Search donations" />
          </label>
          <select value={city} onChange={(event) => handleCityChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" aria-label="Choose a city">
            {Object.entries(CITIES).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
            {city === "" && <option value="">Current location</option>}
          </select>
          <div className="grid grid-cols-3 gap-1 rounded-md bg-gray-100 p-1" aria-label="Filter by food type">
            {(["all", "veg", "non_veg"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={foodFilter === value}
                onClick={() => setFoodFilter(value)}
                className={`rounded px-2 py-1.5 text-xs font-medium ${foodFilter === value ? "bg-white text-eco-green-800 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
              >
                {value === "all" ? "All food" : value === "veg" ? "Vegetarian" : "Non-veg"}
              </button>
            ))}
          </div>
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-gray-700">Food condition</legend>
            {([
              ["fresh", "Fresh"],
              ["expiring_soon", "Near expiry"],
              ["expired", "Already expired (last 24 hours)"],
            ] as const).map(([status, label]) => (
              <label key={status} htmlFor={`filter-${status}`} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <Checkbox
                  id={`filter-${status}`}
                  checked={statusFilters[status]}
                  onCheckedChange={(checked) => handleStatusFilterChange(status, checked === true)}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <p className="text-xs text-gray-600" aria-live="polite">
            {isLoading ? "Loading donations…" : `${filteredDonations.length} available ${filteredDonations.length === 1 ? "donation" : "donations"}`}
          </p>
          {loadError && <p role="alert" className="text-xs text-red-700">Could not load donations: {loadError}. Check the Supabase connection and database policies.</p>}
          {!isLoading && !loadError && filteredDonations.length === 0 && (
            <p className="text-xs text-gray-600">No matching active donations in India yet. Try another search or check back soon.</p>
          )}
          {!session && <Link to="/register" className="block text-xs font-medium text-eco-green-700 hover:underline">Sign up to request a pickup</Link>}
        </section>
      )}
    </div>
  );
};

export default MapView;
