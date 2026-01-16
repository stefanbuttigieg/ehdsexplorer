import { useState } from 'react';
import { Plus, Search, Trash2, Edit, ExternalLink, Filter, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  useCountryLegislation, 
  useCreateLegislation, 
  useUpdateLegislation, 
  useDeleteLegislation,
  type CountryLegislation,
  type CreateLegislationInput 
} from '@/hooks/useCountryLegislation';
import { useArticles } from '@/hooks/useArticles';
import { useImplementingActs } from '@/hooks/useImplementingActs';
import { 
  LEGISLATION_STATUSES, 
  LEGISLATION_TYPES, 
  ENFORCEMENT_MEASURES,
  type LegislationStatus,
  type LegislationType,
  type EnforcementMeasure 
} from '@/data/legislationConstants';

const EU_COUNTRIES = [
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
];

const formSchema = z.object({
  country_code: z.string().min(1, 'Country is required'),
  title: z.string().min(1, 'Title is required'),
  official_title: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  summary: z.string().optional(),
  draft_date: z.string().optional(),
  tabled_date: z.string().optional(),
  adoption_date: z.string().optional(),
  publication_date: z.string().optional(),
  effective_date: z.string().optional(),
  legislation_type: z.enum(['transposition', 'related', 'amendment', 'preparatory']),
  status: z.enum(['draft', 'tabled', 'under_review', 'adopted', 'published', 'in_force', 'superseded']),
  status_notes: z.string().optional(),
  ehds_articles_referenced: z.array(z.number()).optional(),
  implementing_act_ids: z.array(z.string()).optional(),
  enforcement_measures: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function AdminCountryLegislationPage() {
  const { user, loading, isEditor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLegislation, setEditingLegislation] = useState<CountryLegislation | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [selectedActs, setSelectedActs] = useState<string[]>([]);
  const [selectedEnforcement, setSelectedEnforcement] = useState<string[]>([]);

  const { data: legislation, isLoading } = useCountryLegislation();
  const { data: articles } = useArticles();
  const { data: implementingActs } = useImplementingActs();
  const createMutation = useCreateLegislation();
  const updateMutation = useUpdateLegislation();
  const deleteMutation = useDeleteLegislation();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      country_code: '',
      title: '',
      official_title: '',
      url: '',
      summary: '',
      draft_date: '',
      tabled_date: '',
      adoption_date: '',
      publication_date: '',
      effective_date: '',
      legislation_type: 'transposition',
      status: 'draft',
      status_notes: '',
      ehds_articles_referenced: [],
      implementing_act_ids: [],
      enforcement_measures: [],
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isEditor) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [user, loading, isEditor, navigate, toast]);

  const handleOpenDialog = (leg?: CountryLegislation) => {
    if (leg) {
      setEditingLegislation(leg);
      form.reset({
        country_code: leg.country_code,
        title: leg.title,
        official_title: leg.official_title || '',
        url: leg.url || '',
        summary: leg.summary || '',
        draft_date: leg.draft_date || '',
        tabled_date: leg.tabled_date || '',
        adoption_date: leg.adoption_date || '',
        publication_date: leg.publication_date || '',
        effective_date: leg.effective_date || '',
        legislation_type: leg.legislation_type,
        status: leg.status,
        status_notes: leg.status_notes || '',
        ehds_articles_referenced: leg.ehds_articles_referenced || [],
        implementing_act_ids: leg.implementing_act_ids || [],
        enforcement_measures: leg.enforcement_measures || [],
      });
      setSelectedArticles(leg.ehds_articles_referenced || []);
      setSelectedActs(leg.implementing_act_ids || []);
      setSelectedEnforcement(leg.enforcement_measures || []);
    } else {
      setEditingLegislation(null);
      form.reset();
      setSelectedArticles([]);
      setSelectedActs([]);
      setSelectedEnforcement([]);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: FormData) => {
    const country = EU_COUNTRIES.find(c => c.code === data.country_code);
    if (!country) return;

    const input: CreateLegislationInput = {
      ...data,
      country_name: country.name,
      url: data.url || undefined,
      official_title: data.official_title || undefined,
      summary: data.summary || undefined,
      draft_date: data.draft_date || undefined,
      tabled_date: data.tabled_date || undefined,
      adoption_date: data.adoption_date || undefined,
      publication_date: data.publication_date || undefined,
      effective_date: data.effective_date || undefined,
      status_notes: data.status_notes || undefined,
      ehds_articles_referenced: selectedArticles,
      implementing_act_ids: selectedActs,
      enforcement_measures: selectedEnforcement,
    };

    try {
      if (editingLegislation) {
        await updateMutation.mutateAsync({ id: editingLegislation.id, ...input });
      } else {
        await createMutation.mutateAsync(input);
      }
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this legislation?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const filteredLegislation = legislation?.filter(leg => {
    const matchesSearch = leg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         leg.country_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || leg.status === statusFilter;
    const matchesType = typeFilter === 'all' || leg.legislation_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading || !user || !isEditor) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-serif">National Legislation</h1>
            <p className="text-muted-foreground mt-1">
              Manage national EHDS-linked legislation across EU member states
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Legislation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLegislation ? 'Edit Legislation' : 'Add New Legislation'}
                </DialogTitle>
                <DialogDescription>
                  {editingLegislation ? 'Update the legislation details below.' : 'Enter the details for the new national legislation.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {EU_COUNTRIES.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  {getFlagEmoji(country.code)} {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="legislation_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(LEGISLATION_TYPES).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Digital Health Data Act" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="official_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Official Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Full official title if different" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Official Source URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(LEGISLATION_STATUSES).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="draft_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Draft Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tabled_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tabled Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="adoption_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adoption Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="publication_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Publication Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="effective_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Effective Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Summary</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the legislation..."
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional notes about the current status..."
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* EHDS Articles */}
                  <div>
                    <FormLabel>Related EHDS Articles</FormLabel>
                    <FormDescription>Select articles this legislation relates to</FormDescription>
                    <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                      {articles?.map((article) => (
                        <Badge
                          key={article.id}
                          variant={selectedArticles.includes(article.article_number) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedArticles(prev =>
                              prev.includes(article.article_number)
                                ? prev.filter(a => a !== article.article_number)
                                : [...prev, article.article_number]
                            );
                          }}
                        >
                          Art. {article.article_number}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Enforcement Measures */}
                  <div>
                    <FormLabel>Enforcement Measures</FormLabel>
                    <FormDescription>Select enforcement mechanisms in place</FormDescription>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {Object.entries(ENFORCEMENT_MEASURES).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={`enforcement-${key}`}
                              checked={selectedEnforcement.includes(key)}
                              onCheckedChange={(checked) => {
                                setSelectedEnforcement(prev =>
                                  checked
                                    ? [...prev, key]
                                    : prev.filter(e => e !== key)
                                );
                              }}
                            />
                            <label 
                              htmlFor={`enforcement-${key}`} 
                              className="text-sm flex items-center gap-1 cursor-pointer"
                            >
                              <Icon className="h-3 w-3" />
                              {config.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingLegislation ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search legislation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(LEGISLATION_STATUSES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(LEGISLATION_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Legislation Entries</CardTitle>
            <CardDescription>
              {filteredLegislation?.length || 0} entries found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Enforcement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLegislation?.map((leg) => (
                    <TableRow key={leg.id}>
                      <TableCell>
                        <span className="text-lg mr-1">{getFlagEmoji(leg.country_code)}</span>
                        {leg.country_name}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {leg.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {LEGISLATION_TYPES[leg.legislation_type]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>
                          {LEGISLATION_STATUSES[leg.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {leg.ehds_articles_referenced?.length > 0 ? (
                          <span className="text-sm">
                            {leg.ehds_articles_referenced.slice(0, 3).join(', ')}
                            {leg.ehds_articles_referenced.length > 3 && '...'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {leg.enforcement_measures?.length > 0 ? (
                          <Badge variant="secondary">{leg.enforcement_measures.length}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {leg.url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={leg.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(leg)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(leg.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLegislation?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No legislation entries found. Click "Add Legislation" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
