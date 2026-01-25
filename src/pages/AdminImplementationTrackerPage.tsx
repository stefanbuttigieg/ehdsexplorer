import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useImplementationTrackerConfig } from '@/hooks/useImplementationTrackerConfig';
import { 
  useEhdsObligations, 
  useCountryObligationStatuses, 
  useUpdateObligationStatus,
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  type ObligationCategory,
  type ObligationStatus
} from '@/hooks/useEhdsObligations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Save, 
  RotateCcw, 
  Percent,
  Settings2,
  FileText,
  Globe,
  Shield,
  Info,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const EU_COUNTRIES = [
  { code: "AT", name: "Austria" }, { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" }, { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" }, { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" }, { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" }, { code: "FR", name: "France" },
  { code: "DE", name: "Germany" }, { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" }, { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" }, { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" }, { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" }, { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" }, { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" }, { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" }
];

const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const CATEGORY_ICONS: Record<ObligationCategory, React.ReactNode> = {
  primary_use: <FileText className="h-4 w-4" />,
  secondary_use: <Globe className="h-4 w-4" />,
  general: <Shield className="h-4 w-4" />,
};

const formSchema = z.object({
  primary_use_weight: z.number().min(0).max(100),
  secondary_use_weight: z.number().min(0).max(100),
  general_weight: z.number().min(0).max(100),
  status_not_started_value: z.number().min(0).max(100),
  status_in_progress_value: z.number().min(0).max(100),
  status_partial_value: z.number().min(0).max(100),
  status_completed_value: z.number().min(0).max(100),
}).refine((data) => {
  return data.primary_use_weight + data.secondary_use_weight + data.general_weight === 100;
}, {
  message: 'Category weights must sum to 100%',
  path: ['primary_use_weight'],
});

type FormData = z.infer<typeof formSchema>;

export default function AdminImplementationTrackerPage() {
  const { loading: authLoading, shouldRender } = useAdminGuard();
  const { config, isLoading: configLoading, updateConfig } = useImplementationTrackerConfig();
  const { data: obligations, isLoading: obligationsLoading } = useEhdsObligations();
  const { data: countryStatuses, isLoading: statusesLoading } = useCountryObligationStatuses();
  const updateObligationStatus = useUpdateObligationStatus();
  
  const [selectedCountry, setSelectedCountry] = useState<string>("AT");
  const [activeTab, setActiveTab] = useState<"config" | "status">("config");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      primary_use_weight: 50,
      secondary_use_weight: 35,
      general_weight: 15,
      status_not_started_value: 0,
      status_in_progress_value: 33,
      status_partial_value: 66,
      status_completed_value: 100,
    },
  });

  // Update form when config loads
  useEffect(() => {
    if (config) {
      form.reset({
        primary_use_weight: config.primary_use_weight,
        secondary_use_weight: config.secondary_use_weight,
        general_weight: config.general_weight,
        status_not_started_value: config.status_not_started_value,
        status_in_progress_value: config.status_in_progress_value,
        status_partial_value: config.status_partial_value,
        status_completed_value: config.status_completed_value,
      });
    }
  }, [config, form]);

  const onSubmit = (data: FormData) => {
    updateConfig.mutate(data);
  };

  const handleReset = () => {
    form.reset({
      primary_use_weight: 50,
      secondary_use_weight: 35,
      general_weight: 15,
      status_not_started_value: 0,
      status_in_progress_value: 33,
      status_partial_value: 66,
      status_completed_value: 100,
    });
    toast.info('Form reset to defaults. Click Save to apply.');
  };

  const handleStatusChange = (obligationId: string, status: ObligationStatus) => {
    updateObligationStatus.mutate({
      country_code: selectedCountry,
      obligation_id: obligationId,
      status,
    });
  };

  const watchedValues = form.watch();
  const totalWeight = watchedValues.primary_use_weight + watchedValues.secondary_use_weight + watchedValues.general_weight;

  // Group obligations by category
  const obligationsByCategory = useMemo(() => {
    if (!obligations) return {};
    return obligations.reduce((acc, ob) => {
      if (!acc[ob.category]) acc[ob.category] = [];
      acc[ob.category].push(ob);
      return acc;
    }, {} as Record<ObligationCategory, typeof obligations>);
  }, [obligations]);

  // Get statuses for selected country
  const countryStatusMap = useMemo(() => {
    if (!countryStatuses) return {};
    return countryStatuses
      .filter(s => s.country_code === selectedCountry)
      .reduce((acc, s) => {
        acc[s.obligation_id] = s.status;
        return acc;
      }, {} as Record<string, ObligationStatus>);
  }, [countryStatuses, selectedCountry]);

  // Calculate example progress
  const calculateCategoryProgress = (category: ObligationCategory): number => {
    const categoryObligations = obligationsByCategory[category] || [];
    if (categoryObligations.length === 0) return 0;

    let total = 0;
    for (const ob of categoryObligations) {
      const status = countryStatusMap[ob.id] || 'not_started';
      switch (status) {
        case 'completed': total += watchedValues.status_completed_value; break;
        case 'partial': total += watchedValues.status_partial_value; break;
        case 'in_progress': total += watchedValues.status_in_progress_value; break;
        default: total += watchedValues.status_not_started_value;
      }
    }
    return total / categoryObligations.length;
  };

  const examplePrimaryProgress = calculateCategoryProgress('primary_use');
  const exampleSecondaryProgress = calculateCategoryProgress('secondary_use');
  const exampleGeneralProgress = calculateCategoryProgress('general');

  const weightedPrimary = (examplePrimaryProgress * watchedValues.primary_use_weight) / 100;
  const weightedSecondary = (exampleSecondaryProgress * watchedValues.secondary_use_weight) / 100;
  const weightedGeneral = (exampleGeneralProgress * watchedValues.general_weight) / 100;
  const exampleTotal = Math.round(weightedPrimary + weightedSecondary + weightedGeneral);

  const isLoading = authLoading || configLoading || obligationsLoading || statusesLoading;

  if (isLoading || !shouldRender) {
    return <AdminPageLoading />;
  }

  return (
    <AdminPageLayout
      title="Implementation Tracker Config"
      description="Configure Member State obligations tracking based on EHDS Regulation requirements"
      backTo="/admin"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button size="sm" onClick={form.handleSubmit(onSubmit)} disabled={updateConfig.isPending}>
            <Save className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="config">Weight Configuration</TabsTrigger>
          <TabsTrigger value="status">Country Status</TabsTrigger>
        </TabsList>

        {/* Weight Configuration Tab */}
        <TabsContent value="config">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Category Weight Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Percent className="h-5 w-5" />
                    Obligation Category Weights
                  </CardTitle>
                  <CardDescription>
                    Define how much each category of Member State obligations contributes to overall progress. Weights must sum to 100%.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Weight Balance Indicator */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Weight</span>
                      <span className={totalWeight === 100 ? 'text-chart-2 font-medium' : 'text-destructive font-medium'}>
                        {totalWeight}%
                      </span>
                    </div>
                    <Progress value={totalWeight} className="h-2" />
                    {totalWeight !== 100 && (
                      <p className="text-xs text-destructive">Weights must sum to exactly 100%</p>
                    )}
                  </div>

                  {/* Weight Sliders */}
                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="primary_use_weight"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-chart-1" />
                              Primary Use Obligations (7 items)
                            </FormLabel>
                            <Badge variant="outline">{field.value}%</Badge>
                          </div>
                          <FormDescription className="text-xs">
                            eHDA Services, HP Access, EHR Registration, DHA, NCP Digital Health, Training, Storage
                          </FormDescription>
                          <FormControl>
                            <Slider
                              value={[field.value]}
                              onValueChange={([val]) => field.onChange(val)}
                              max={100}
                              step={1}
                              className="mt-2"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondary_use_weight"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-chart-2" />
                              Secondary Use Obligations (6 items)
                            </FormLabel>
                            <Badge variant="outline">{field.value}%</Badge>
                          </div>
                          <FormDescription className="text-xs">
                            HDAB, NCP Secondary, Secure Processing, Opt-out, Trusted Holders, Storage
                          </FormDescription>
                          <FormControl>
                            <Slider
                              value={[field.value]}
                              onValueChange={([val]) => field.onChange(val)}
                              max={100}
                              step={1}
                              className="mt-2"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="general_weight"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-chart-4" />
                              General Obligations (2 items)
                            </FormLabel>
                            <Badge variant="outline">{field.value}%</Badge>
                          </div>
                          <FormDescription className="text-xs">
                            Penalties, Public Procurement & Funding
                          </FormDescription>
                          <FormControl>
                            <Slider
                              value={[field.value]}
                              onValueChange={([val]) => field.onChange(val)}
                              max={100}
                              step={1}
                              className="mt-2"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Status Value Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings2 className="h-5 w-5" />
                    Status Progress Values
                  </CardTitle>
                  <CardDescription>
                    Define what percentage each obligation status contributes when calculating progress.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="status_not_started_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Not Started</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                              <span className="text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status_in_progress_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>In Progress</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                              <span className="text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status_partial_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partial</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                              <span className="text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status_completed_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Completed</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                              <span className="text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Obligations Reference */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">EHDS Obligations Reference</CardTitle>
                  <CardDescription>
                    Member State obligations defined in the EHDS Regulation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" defaultValue={["primary_use"]} className="space-y-2">
                    {(['primary_use', 'secondary_use', 'general'] as ObligationCategory[]).map(category => (
                      <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            {CATEGORY_ICONS[category]}
                            <span>{CATEGORY_LABELS[category]} ({obligationsByCategory[category]?.length || 0})</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <div className="space-y-3">
                            {obligationsByCategory[category]?.map(ob => (
                              <div key={ob.id} className="p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="font-medium text-sm">{ob.name}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">{ob.description}</p>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    {ob.article_references.map(ref => (
                                      <Badge key={ref} variant="outline" className="text-[10px]">{ref}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Preview Card */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5" />
                    Example Calculation for {EU_COUNTRIES.find(c => c.code === selectedCountry)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-background border">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Primary Use ({examplePrimaryProgress.toFixed(0)}% avg × {watchedValues.primary_use_weight}% weight)</span>
                          <span>{weightedPrimary.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Secondary Use ({exampleSecondaryProgress.toFixed(0)}% avg × {watchedValues.secondary_use_weight}% weight)</span>
                          <span>{weightedSecondary.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">General ({exampleGeneralProgress.toFixed(0)}% avg × {watchedValues.general_weight}% weight)</span>
                          <span>{weightedGeneral.toFixed(1)}%</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Total Progress</span>
                          <span className="text-primary">{exampleTotal}%</span>
                        </div>
                      </div>
                      <Progress value={exampleTotal} className="mt-3 h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </TabsContent>

        {/* Country Status Tab */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Country Obligation Status</CardTitle>
                  <CardDescription>Track each country's progress on EHDS obligations</CardDescription>
                </div>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EU_COUNTRIES.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {getFlagEmoji(country.code)} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(['primary_use', 'secondary_use', 'general'] as ObligationCategory[]).map(category => (
                  <div key={category}>
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      {CATEGORY_ICONS[category]}
                      {CATEGORY_LABELS[category]}
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Obligation</TableHead>
                            <TableHead className="w-[120px]">Articles</TableHead>
                            <TableHead className="w-[150px]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {obligationsByCategory[category]?.map(ob => {
                            const currentStatus = countryStatusMap[ob.id] || 'not_started';
                            return (
                              <TableRow key={ob.id}>
                                <TableCell>
                                  <div>
                                    <span className="font-medium text-sm">{ob.name}</span>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{ob.description}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1 flex-wrap">
                                    {ob.article_references.map(ref => (
                                      <Badge key={ref} variant="outline" className="text-[10px]">{ref}</Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Select 
                                    value={currentStatus} 
                                    onValueChange={(v) => handleStatusChange(ob.id, v as ObligationStatus)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(['not_started', 'in_progress', 'partial', 'completed'] as ObligationStatus[]).map(status => (
                                        <SelectItem key={status} value={status}>
                                          <Badge className={`${STATUS_COLORS[status]} text-xs`}>
                                            {STATUS_LABELS[status]}
                                          </Badge>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}
