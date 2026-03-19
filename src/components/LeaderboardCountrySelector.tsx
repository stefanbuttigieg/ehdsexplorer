import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Check } from "lucide-react";
import { CountryFlag } from "@/components/CountryFlag";
import { Loader2 } from "lucide-react";

const EU_COUNTRIES = [
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  // EEA countries
  { code: "IS", name: "Iceland" },
  { code: "LI", name: "Liechtenstein" },
  { code: "NO", name: "Norway" },
  // Other
  { code: "CH", name: "Switzerland" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "OTHER", name: "Other" },
];

export function LeaderboardCountrySelector() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("leaderboard_country_code")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.leaderboard_country_code) {
          setSelectedCode(data.leaderboard_country_code);
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user || !selectedCode) return;
    setSaving(true);

    const country = EU_COUNTRIES.find((c) => c.code === selectedCode);

    const { error } = await supabase
      .from("profiles")
      .update({
        leaderboard_country_code: selectedCode,
        leaderboard_country_name: country?.name ?? "Other",
      })
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to update country", variant: "destructive" });
    } else {
      // Update session storage so tracker picks it up immediately
      sessionStorage.setItem(
        "user-country",
        JSON.stringify({ code: selectedCode, name: country?.name ?? "Other" })
      );
      toast({ title: "Country updated", description: `You're now representing ${country?.name ?? selectedCode}!` });
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Leaderboard Country
        </CardTitle>
        <CardDescription>
          Choose which country you represent on the EHDS Explorer leaderboard. Your reading, games, and exploration points will count toward this country's score.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Your Country</Label>
              <Select value={selectedCode} onValueChange={setSelectedCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {EU_COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        {c.code !== "OTHER" && <CountryFlag countryCode={c.code} size="sm" />}
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCode && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {selectedCode !== "OTHER" && <CountryFlag countryCode={selectedCode} size="md" />}
                <span>
                  All your future points will count toward{" "}
                  <strong>{EU_COUNTRIES.find((c) => c.code === selectedCode)?.name}</strong>
                </span>
              </div>
            )}

            <Button onClick={handleSave} disabled={!selectedCode || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Save Country
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
