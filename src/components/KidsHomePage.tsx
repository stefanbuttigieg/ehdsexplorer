import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Gamepad2, Heart, Globe, Shield, Sparkles, Star } from "lucide-react";
import { EuropeMap } from "@/components/EuropeMap";
import { useState, useMemo } from "react";
import { useHealthAuthorities } from "@/hooks/useHealthAuthorities";

export function KidsHomePage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const { authorities } = useHealthAuthorities();

  const countryData = useMemo(() => {
    const data: Record<string, number> = {};
    authorities?.forEach(a => { data[a.country_code] = (data[a.country_code] || 0) + 1; });
    return data;
  }, [authorities]);

  const countryDetails = useMemo(() => {
    const details: Record<string, { entities?: Array<{ name: string; type: string; status: string }> }> = {};
    authorities?.forEach(a => {
      if (!details[a.country_code]) details[a.country_code] = { entities: [] };
      details[a.country_code].entities!.push({
        name: a.name,
        type: a.authority_type === 'digital_health_authority' ? 'DHA' : 'HDAB',
        status: a.status.charAt(0).toUpperCase() + a.status.slice(1),
      });
    });
    return details;
  }, [authorities]);

  const entityCount = authorities?.length ?? 0;
  const countriesWithEntities = Object.keys(countryData).length;

  return (
    <div className="animate-fade-in">
      {/* Hero Section - Fun & Playful */}
      <section className="text-center py-10 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 text-primary text-base font-bold mb-4 animate-bounce">
            <Sparkles className="h-5 w-5" />
            Welcome, Young Explorer!
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4">
            🏥 Your Health Data Adventure
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 leading-relaxed">
            Did you know? The European Union is building something amazing called the{" "}
            <strong className="text-primary">European Health Data Space</strong> — 
            and every country in Europe is helping to shape it right now! 🌍
          </p>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <Globe className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Who's Building the EHDS? 🏗️</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base">
              Countries across the EU are setting up special organisations to make the EHDS work.
              The <strong className="text-primary">blue dots</strong> show countries that already have entities — 
              click on one to learn more!
            </p>
          </div>

          <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
            <CardContent className="p-0">
              <EuropeMap
                countryData={countryData}
                countryDetails={countryDetails}
                selectedCountry={selectedCountry}
                onCountryClick={setSelectedCountry}
                isLegislationView={false}
                mode="count"
                className="border-0 rounded-none"
              />
            </CardContent>
          </Card>

          {selectedCountry && (
            <Card className="mt-4 border-2 border-primary/30 bg-primary/5">
              <CardContent className="p-4 text-center">
                <p className="text-lg font-semibold">
                  🏛️ This country has{" "}
                  <span className="text-primary text-xl">
                    {countryData[selectedCountry] ?? 0}
                  </span>{" "}
                  {(countryData[selectedCountry] ?? 0) === 1 ? 'entity' : 'entities'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  These are the organisations helping to build the health data space!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Fun Nav Cards */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">
            What Would You Like to Explore? ✨
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Link to="/kids">
              <Card className="h-full border-2 border-primary/20 hover:border-primary hover:shadow-xl transition-all cursor-pointer group bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">📚 Comic Stories</h3>
                  <p className="text-muted-foreground">
                    Read exciting comic books about health data heroes!
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/games">
              <Card className="h-full border-2 border-secondary/20 hover:border-secondary hover:shadow-xl transition-all cursor-pointer group bg-gradient-to-br from-secondary/10 to-secondary/5">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Gamepad2 className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-bold">🎮 Play Games</h3>
                  <p className="text-muted-foreground">
                    Quizzes, flashcards, word search — test what you know!
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/for/citizens">
              <Card className="h-full border-2 border-accent/40 hover:border-accent-foreground/40 hover:shadow-xl transition-all cursor-pointer group bg-gradient-to-br from-accent/30 to-accent/10">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-accent/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">🛡️ Your Rights</h3>
                  <p className="text-muted-foreground">
                    Learn what rights you have over your health data!
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/help">
              <Card className="h-full border-2 border-muted hover:border-foreground/20 hover:shadow-xl transition-all cursor-pointer group bg-gradient-to-br from-muted to-muted/50">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-foreground/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Heart className="h-8 w-8 text-foreground/60" />
                  </div>
                  <h3 className="text-xl font-bold">❓ Help Center</h3>
                  <p className="text-muted-foreground">
                    Got questions? We've got answers!
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Fun Fact */}
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">🌟 Did You Know?</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                The EHDS will make it easier for doctors across <strong>27 EU countries</strong> to 
                securely share your health information. This means if you travel to another country 
                and need to see a doctor, they can quickly access your records and help you faster! 🚀
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
