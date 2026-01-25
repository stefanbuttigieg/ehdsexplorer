import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useImplementationTrackerConfig } from '@/hooks/useImplementationTrackerConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
  Save, 
  RotateCcw, 
  Building2, 
  Scale, 
  Info,
  Percent,
  Settings2
} from 'lucide-react';
import { toast } from 'sonner';

const LEGISLATION_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'tabled', label: 'Tabled' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'adopted', label: 'Adopted' },
  { value: 'published', label: 'Published' },
  { value: 'in_force', label: 'In Force' },
  { value: 'superseded', label: 'Superseded' },
];

const formSchema = z.object({
  dha_weight: z.number().min(0).max(100),
  hdab_weight: z.number().min(0).max(100),
  legislation_weight: z.number().min(0).max(100),
  dha_active_value: z.number().min(0).max(100),
  dha_pending_value: z.number().min(0).max(100),
  dha_planned_value: z.number().min(0).max(100),
  dha_inactive_value: z.number().min(0).max(100),
  hdab_active_value: z.number().min(0).max(100),
  hdab_pending_value: z.number().min(0).max(100),
  hdab_planned_value: z.number().min(0).max(100),
  hdab_inactive_value: z.number().min(0).max(100),
  legislation_adopted_statuses: z.array(z.string()).min(1, 'Select at least one status'),
}).refine((data) => {
  return data.dha_weight + data.hdab_weight + data.legislation_weight === 100;
}, {
  message: 'Weights must sum to 100%',
  path: ['dha_weight'],
});

type FormData = z.infer<typeof formSchema>;

export default function AdminImplementationTrackerPage() {
  const { loading: authLoading, shouldRender } = useAdminGuard();
  const { config, isLoading: configLoading, updateConfig } = useImplementationTrackerConfig();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dha_weight: 33,
      hdab_weight: 33,
      legislation_weight: 34,
      dha_active_value: 100,
      dha_pending_value: 50,
      dha_planned_value: 25,
      dha_inactive_value: 0,
      hdab_active_value: 100,
      hdab_pending_value: 50,
      hdab_planned_value: 25,
      hdab_inactive_value: 0,
      legislation_adopted_statuses: ['adopted', 'in_force'],
    },
  });

  // Update form when config loads
  useEffect(() => {
    if (config) {
      form.reset({
        dha_weight: config.dha_weight,
        hdab_weight: config.hdab_weight,
        legislation_weight: config.legislation_weight,
        dha_active_value: config.dha_active_value,
        dha_pending_value: config.dha_pending_value,
        dha_planned_value: config.dha_planned_value,
        dha_inactive_value: config.dha_inactive_value,
        hdab_active_value: config.hdab_active_value,
        hdab_pending_value: config.hdab_pending_value,
        hdab_planned_value: config.hdab_planned_value,
        hdab_inactive_value: config.hdab_inactive_value,
        legislation_adopted_statuses: config.legislation_adopted_statuses,
      });
    }
  }, [config, form]);

  const onSubmit = (data: FormData) => {
    updateConfig.mutate(data);
  };

  const handleReset = () => {
    form.reset({
      dha_weight: 33,
      hdab_weight: 33,
      legislation_weight: 34,
      dha_active_value: 100,
      dha_pending_value: 50,
      dha_planned_value: 25,
      dha_inactive_value: 0,
      hdab_active_value: 100,
      hdab_pending_value: 50,
      hdab_planned_value: 25,
      hdab_inactive_value: 0,
      legislation_adopted_statuses: ['adopted', 'in_force'],
    });
    toast.info('Form reset to defaults. Click Save to apply.');
  };

  const watchedValues = form.watch();
  const totalWeight = watchedValues.dha_weight + watchedValues.hdab_weight + watchedValues.legislation_weight;

  if (authLoading || configLoading || !shouldRender) {
    return <AdminPageLoading />;
  }


  // Calculate example progress
  const exampleDhaProgress = (watchedValues.dha_active_value * watchedValues.dha_weight) / 100;
  const exampleHdabProgress = (watchedValues.hdab_pending_value * watchedValues.hdab_weight) / 100;
  const exampleLegProgress = (50 * watchedValues.legislation_weight) / 100; // Assume 50% legislation adopted
  const exampleTotal = Math.round(exampleDhaProgress + exampleHdabProgress + exampleLegProgress);

  return (
    <AdminPageLayout
      title="Implementation Tracker Config"
      description="Configure how country implementation progress is calculated"
      backTo="/admin"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Reset to Defaults</span>
            <span className="sm:hidden">Reset</span>
          </Button>
          <Button size="sm" onClick={form.handleSubmit(onSubmit)} disabled={updateConfig.isPending}>
            <Save className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Save Changes</span>
            <span className="sm:hidden">Save</span>
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Weight Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Percent className="h-5 w-5" />
                Progress Weight Distribution
              </CardTitle>
              <CardDescription>
                Define how much each factor contributes to the overall progress percentage. Weights must sum to 100%.
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
                  name="dha_weight"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-chart-1" />
                          Digital Health Authority (DHA)
                        </FormLabel>
                        <Badge variant="outline">{field.value}%</Badge>
                      </div>
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
                  name="hdab_weight"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-chart-2" />
                          Health Data Access Body (HDAB)
                        </FormLabel>
                        <Badge variant="outline">{field.value}%</Badge>
                      </div>
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
                  name="legislation_weight"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-chart-4" />
                          National Legislation
                        </FormLabel>
                        <Badge variant="outline">{field.value}%</Badge>
                      </div>
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
          <Accordion type="multiple" defaultValue={["dha", "hdab", "legislation"]} className="space-y-4">
            {/* DHA Status Values */}
            <AccordionItem value="dha" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-chart-1" />
                  <span>DHA Status Values</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Define what percentage each DHA status contributes when calculating progress.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="dha_active_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Active</FormLabel>
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
                    name="dha_pending_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pending</FormLabel>
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
                    name="dha_planned_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planned</FormLabel>
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
                    name="dha_inactive_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inactive</FormLabel>
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
              </AccordionContent>
            </AccordionItem>

            {/* HDAB Status Values */}
            <AccordionItem value="hdab" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-chart-2" />
                  <span>HDAB Status Values</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Define what percentage each HDAB status contributes when calculating progress.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="hdab_active_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Active</FormLabel>
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
                    name="hdab_pending_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pending</FormLabel>
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
                    name="hdab_planned_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planned</FormLabel>
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
                    name="hdab_inactive_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inactive</FormLabel>
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
              </AccordionContent>
            </AccordionItem>

            {/* Legislation Configuration */}
            <AccordionItem value="legislation" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-chart-4" />
                  <span>Legislation Configuration</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <FormField
                  control={form.control}
                  name="legislation_adopted_statuses"
                  render={() => (
                    <FormItem>
                      <FormLabel>Statuses Counted as "Adopted"</FormLabel>
                      <FormDescription>
                        Select which legislation statuses should count towards progress completion.
                      </FormDescription>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                        {LEGISLATION_STATUSES.map((status) => (
                          <FormField
                            key={status.value}
                            control={form.control}
                            name="legislation_adopted_statuses"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(status.value)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, status.value]);
                                      } else {
                                        field.onChange(current.filter((v) => v !== status.value));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {status.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Preview Card */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings2 className="h-5 w-5" />
                Example Calculation
              </CardTitle>
              <CardDescription>
                Preview how progress would be calculated with these settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-background border">
                  <p className="text-sm font-medium mb-3">Example: Country with Active DHA, Pending HDAB, 50% legislation adopted</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DHA (Active @ {watchedValues.dha_active_value}% × {watchedValues.dha_weight}% weight)</span>
                      <span>{exampleDhaProgress.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">HDAB (Pending @ {watchedValues.hdab_pending_value}% × {watchedValues.hdab_weight}% weight)</span>
                      <span>{exampleHdabProgress.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Legislation (50% adopted × {watchedValues.legislation_weight}% weight)</span>
                      <span>{exampleLegProgress.toFixed(1)}%</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Total Progress</span>
                      <span className="text-primary">{exampleTotal}%</span>
                    </div>
                  </div>
                  <Progress value={exampleTotal} className="mt-3 h-2" />
                </div>
                
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    The formula is: (DHA_status_value × DHA_weight) + (HDAB_status_value × HDAB_weight) + (legislation_percentage × legislation_weight) / 100
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </AdminPageLayout>
  );
}
