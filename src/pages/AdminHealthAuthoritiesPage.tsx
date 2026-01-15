import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Globe, Phone, Mail, MapPin, ExternalLink, Search } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useHealthAuthorities, HealthAuthority, HealthAuthorityInsert, AuthorityType, AuthorityStatus } from '@/hooks/useHealthAuthorities';

const EU_COUNTRIES = [
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czechia' },
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

const statusColors: Record<AuthorityStatus, string> = {
  active: 'bg-green-500/10 text-green-700 dark:text-green-400',
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  planned: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  inactive: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
};

const AdminHealthAuthoritiesPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { authorities, isLoading, createAuthority, updateAuthority, deleteAuthority } = useHealthAuthorities();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAuthority, setSelectedAuthority] = useState<HealthAuthority | null>(null);
  
  const [formData, setFormData] = useState<Partial<HealthAuthorityInsert>>({
    name: '',
    country_code: '',
    country_name: '',
    authority_type: 'digital_health_authority',
    status: 'planned',
    email: '',
    phone: '',
    website: '',
    address: '',
    description: '',
    ehds_role: '',
    key_contacts: [],
    related_legislation: [],
    news_updates: [],
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    navigate('/admin/auth');
    return null;
  }

  const filteredAuthorities = authorities?.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.country_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const resetForm = () => {
    setFormData({
      name: '',
      country_code: '',
      country_name: '',
      authority_type: 'digital_health_authority',
      status: 'planned',
      email: '',
      phone: '',
      website: '',
      address: '',
      description: '',
      ehds_role: '',
      key_contacts: [],
      related_legislation: [],
      news_updates: [],
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.country_code) return;
    
    const country = EU_COUNTRIES.find(c => c.code === formData.country_code);
    createAuthority.mutate({
      ...formData,
      name: formData.name!,
      country_code: formData.country_code!,
      country_name: country?.name || formData.country_code!,
      authority_type: formData.authority_type as AuthorityType,
      status: formData.status as AuthorityStatus,
      key_contacts: formData.key_contacts || [],
      news_updates: formData.news_updates || [],
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleEdit = () => {
    if (!selectedAuthority || !formData.name) return;
    
    const country = EU_COUNTRIES.find(c => c.code === formData.country_code);
    updateAuthority.mutate({
      id: selectedAuthority.id,
      updates: {
        ...formData,
        country_name: country?.name || formData.country_name,
      }
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setSelectedAuthority(null);
        resetForm();
      }
    });
  };

  const handleDelete = () => {
    if (!selectedAuthority) return;
    
    deleteAuthority.mutate(selectedAuthority.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedAuthority(null);
      }
    });
  };

  const openEditDialog = (authority: HealthAuthority) => {
    setSelectedAuthority(authority);
    setFormData({
      name: authority.name,
      country_code: authority.country_code,
      country_name: authority.country_name,
      authority_type: authority.authority_type,
      status: authority.status,
      email: authority.email || '',
      phone: authority.phone || '',
      website: authority.website || '',
      address: authority.address || '',
      description: authority.description || '',
      ehds_role: authority.ehds_role || '',
      key_contacts: authority.key_contacts,
      related_legislation: authority.related_legislation || [],
      news_updates: authority.news_updates,
    });
    setIsEditDialogOpen(true);
  };

  const AuthorityForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Authority Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Federal Health Agency"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Select
            value={formData.country_code}
            onValueChange={(value) => setFormData({ ...formData, country_code: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {EU_COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Authority Type</Label>
          <Select
            value={formData.authority_type}
            onValueChange={(value) => setFormData({ ...formData, authority_type: value as AuthorityType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="digital_health_authority">Digital Health Authority</SelectItem>
              <SelectItem value="health_data_access_body">Health Data Access Body</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as AuthorityStatus })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contact@authority.gov"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 234 567 890"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          placeholder="https://authority.gov"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Street, City, Country"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the authority's role..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ehds_role">EHDS Role</Label>
        <Textarea
          id="ehds_role"
          value={formData.ehds_role}
          onChange={(e) => setFormData({ ...formData, ehds_role: e.target.value })}
          placeholder="Specific responsibilities under EHDS..."
          rows={2}
        />
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif">Health Authorities</h1>
            <p className="text-muted-foreground">
              Manage Digital Health Authorities and Health Data Access Bodies
            </p>
          </div>
          <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Authority
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Authorities ({filteredAuthorities.length})</CardTitle>
            <CardDescription>
              Click on an authority to edit its details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredAuthorities.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No health authorities found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Authority
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAuthorities.map((authority) => (
                    <TableRow key={authority.id}>
                      <TableCell className="font-medium">
                        <span className="text-lg mr-2">{getFlagEmoji(authority.country_code)}</span>
                        {authority.country_name}
                      </TableCell>
                      <TableCell>{authority.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {authority.authority_type === 'digital_health_authority' ? 'DHA' : 'HDAB'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[authority.status]}>
                          {authority.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {authority.email && (
                            <a href={`mailto:${authority.email}`} title={authority.email}>
                              <Mail className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </a>
                          )}
                          {authority.phone && (
                            <a href={`tel:${authority.phone}`} title={authority.phone}>
                              <Phone className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </a>
                          )}
                          {authority.website && (
                            <a href={authority.website} target="_blank" rel="noopener noreferrer" title="Website">
                              <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(authority)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedAuthority(authority);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Health Authority</DialogTitle>
              <DialogDescription>
                Add a new Digital Health Authority or Health Data Access Body
              </DialogDescription>
            </DialogHeader>
            <AuthorityForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createAuthority.isPending}>
                {createAuthority.isPending ? 'Creating...' : 'Create Authority'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Health Authority</DialogTitle>
              <DialogDescription>
                Update the details of this authority
              </DialogDescription>
            </DialogHeader>
            <AuthorityForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={updateAuthority.isPending}>
                {updateAuthority.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Authority</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedAuthority?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteAuthority.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default AdminHealthAuthoritiesPage;
