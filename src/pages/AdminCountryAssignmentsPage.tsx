import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCountryAssignments } from '@/hooks/useCountryAssignments';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, UserPlus, Trash2, Globe, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';

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

import { CountryFlag } from '@/components/CountryFlag';

interface UserWithRoles {
  id: string;
  email: string | null;
  display_name: string | null;
  roles: string[];
}

export default function AdminCountryAssignmentsPage() {
  const { isLoading: authLoading, isAdmin } = useAdminGuard({ requireAdmin: true });
  const { assignments, isLoading: assignmentsLoading, assignUser, removeAssignment, bulkAssignCountries } = useCountryAssignments();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'by-country' | 'by-user'>('by-country');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  // Fetch users with profiles
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, email, display_name')
        .order('email');

      if (error) throw error;

      // Get roles for each user
      const usersWithRoles: UserWithRoles[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id);

          return {
            id: profile.user_id,
            email: profile.email,
            display_name: profile.display_name,
            roles: (roles || []).map(r => r.role),
          };
        })
      );

      return usersWithRoles;
    },
    enabled: isAdmin,
  });

  // Group assignments by country
  const assignmentsByCountry = useMemo(() => {
    const grouped: Record<string, typeof assignments> = {};
    EU_COUNTRIES.forEach(country => {
      grouped[country.code] = assignments.filter(a => a.country_code === country.code);
    });
    return grouped;
  }, [assignments]);

  // Group assignments by user
  const assignmentsByUser = useMemo(() => {
    const grouped: Record<string, typeof assignments> = {};
    assignments.forEach(assignment => {
      if (!grouped[assignment.user_id]) {
        grouped[assignment.user_id] = [];
      }
      grouped[assignment.user_id].push(assignment);
    });
    return grouped;
  }, [assignments]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return EU_COUNTRIES;
    const query = searchQuery.toLowerCase();
    return EU_COUNTRIES.filter(
      c => c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      u => u.email?.toLowerCase().includes(query) || u.display_name?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleOpenAssignDialog = (countryCode?: string) => {
    setSelectedCountry(countryCode || '');
    setSelectedCountries(countryCode ? [countryCode] : []);
    setSelectedUser('');
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedUser || selectedCountries.length === 0) return;

    await bulkAssignCountries.mutateAsync({
      userId: selectedUser,
      countryCodes: selectedCountries,
    });

    setAssignDialogOpen(false);
    setSelectedUser('');
    setSelectedCountries([]);
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    await removeAssignment.mutateAsync(assignmentId);
  };

  const toggleCountrySelection = (countryCode: string) => {
    setSelectedCountries(prev =>
      prev.includes(countryCode)
        ? prev.filter(c => c !== countryCode)
        : [...prev, countryCode]
    );
  };

  if (authLoading) {
    return (
      <AdminPageLayout title="Country Assignments" description="Loading...">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Country Assignments"
      description="Assign users to manage implementation tracking for specific countries"
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={viewMode === 'by-country' ? 'Search countries...' : 'Search users...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={viewMode} onValueChange={(v: 'by-country' | 'by-user') => setViewMode(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="by-country">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  View by Country
                </div>
              </SelectItem>
              <SelectItem value="by-user">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  View by User
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleOpenAssignDialog()}>
            <UserPlus className="h-4 w-4 mr-2" />
            Assign User
          </Button>
        </div>

        {/* Content */}
        {viewMode === 'by-country' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCountries.map(country => {
              const countryAssignments = assignmentsByCountry[country.code] || [];
              return (
                <Card key={country.code}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CountryFlag countryCode={country.code} size="lg" />
                        {country.name}
                      </CardTitle>
                      <Badge variant={countryAssignments.length > 0 ? 'default' : 'secondary'}>
                        {countryAssignments.length} assigned
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {countryAssignments.length === 0 ? (
                      <p className="text-sm text-muted-foreground mb-3">No users assigned</p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {countryAssignments.map(assignment => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-2 bg-muted rounded-md"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {assignment.profile?.display_name || assignment.profile?.email || 'Unknown user'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {assignment.profile?.email}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveAssignment(assignment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleOpenAssignDialog(country.code)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map(user => {
              const userAssignments = assignmentsByUser[user.id] || [];
              return (
                <Card key={user.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {user.display_name || user.email || 'Unknown user'}
                        </CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.roles.map(role => (
                          <Badge key={role} variant="outline">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {userAssignments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No countries assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {userAssignments.map(assignment => {
                          const country = EU_COUNTRIES.find(c => c.code === assignment.country_code);
                          return (
                            <Badge
                              key={assignment.id}
                              variant="secondary"
                              className="flex items-center gap-1 pr-1"
                            >
                              <CountryFlag countryCode={assignment.country_code} size="sm" />
                              {country?.name || assignment.country_code}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-1 hover:bg-destructive/20"
                                onClick={() => handleRemoveAssignment(assignment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign User to Countries</DialogTitle>
            <DialogDescription>
              Select a user and the countries they should be able to manage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{user.display_name || user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Countries</label>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                <div className="space-y-2">
                  {EU_COUNTRIES.map(country => (
                    <div
                      key={country.code}
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                      onClick={() => toggleCountrySelection(country.code)}
                    >
                      <Checkbox
                        checked={selectedCountries.includes(country.code)}
                        onCheckedChange={() => toggleCountrySelection(country.code)}
                      />
                      <CountryFlag countryCode={country.code} size="md" />
                      <span className="text-sm">{country.name}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {selectedCountries.length} countries selected
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedUser || selectedCountries.length === 0 || bulkAssignCountries.isPending}
            >
              {bulkAssignCountries.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
