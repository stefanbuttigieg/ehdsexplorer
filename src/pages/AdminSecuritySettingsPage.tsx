import { useState, useEffect } from 'react';
import { Shield, Calendar, Clock, Users, Check, X } from 'lucide-react';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useMFASettings } from '@/hooks/useMFASettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { format, addMonths } from 'date-fns';

const AdminSecuritySettingsPage = () => {
  const { shouldRender, isLoading: authLoading, isSuperAdmin } = useAdminGuard({ 
    requireSuperAdmin: true 
  });
  const { settings, isLoading, updateSettings } = useMFASettings();
  
  const [localSettings, setLocalSettings] = useState<{
    enforcement_enabled: boolean;
    grace_period_end_date: string;
    reminder_enabled: boolean;
    allowed_methods: string[];
  } | null>(null);

  // Initialize local settings when data loads
  useEffect(() => {
    if (settings && !localSettings) {
      // Just reset to null to use computed values
    }
  }, [settings]);

  const currentSettings = localSettings ?? {
    enforcement_enabled: settings?.enforcement_enabled ?? false,
    grace_period_end_date: settings?.grace_period_end_date 
      ? format(new Date(settings.grace_period_end_date), 'yyyy-MM-dd')
      : format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
    reminder_enabled: settings?.reminder_enabled ?? true,
    allowed_methods: settings?.allowed_methods ?? ['totp', 'email'],
  };

  if (authLoading || isLoading) return <AdminPageLoading />;
  if (!shouldRender || !isSuperAdmin) return <AdminPageLoading />;

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      enforcement_enabled: currentSettings.enforcement_enabled,
      enforcement_start_date: currentSettings.enforcement_enabled ? new Date().toISOString() : null,
      grace_period_end_date: currentSettings.enforcement_enabled 
        ? new Date(currentSettings.grace_period_end_date).toISOString() 
        : null,
      reminder_enabled: currentSettings.reminder_enabled,
      allowed_methods: currentSettings.allowed_methods,
    });
    setLocalSettings(null);
  };

  const updateLocal = (updates: Partial<typeof currentSettings>) => {
    setLocalSettings({ ...currentSettings, ...updates });
  };

  const toggleMethod = (method: string) => {
    const methods = currentSettings.allowed_methods;
    const updated = methods.includes(method)
      ? methods.filter(m => m !== method)
      : [...methods, method];
    
    // Ensure at least one method is selected
    if (updated.length > 0) {
      updateLocal({ allowed_methods: updated });
    }
  };

  const hasChanges = localSettings !== null;

  const isEnforcementActive = settings?.enforcement_enabled && 
    settings?.grace_period_end_date && 
    new Date(settings.grace_period_end_date) < new Date();

  const daysUntilEnforcement = settings?.grace_period_end_date
    ? Math.ceil((new Date(settings.grace_period_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <AdminPageLayout 
      title="Security Settings" 
      description="Configure two-factor authentication and security policies"
    >
      <div className="space-y-6">
        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              MFA Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Enforcement</span>
                </div>
                <div className="flex items-center gap-2">
                  {settings?.enforcement_enabled ? (
                    isEnforcementActive ? (
                      <span className="text-primary font-semibold flex items-center gap-1">
                        <Check className="h-4 w-4" /> Active
                      </span>
                    ) : (
                      <span className="text-accent-foreground font-semibold flex items-center gap-1">
                        <Clock className="h-4 w-4" /> Grace Period
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <X className="h-4 w-4" /> Disabled
                    </span>
                  )}
                </div>
              </div>

              {settings?.grace_period_end_date && settings?.enforcement_enabled && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Enforcement Date</span>
                  </div>
                  <p className="font-semibold">
                    {format(new Date(settings.grace_period_end_date), 'MMM d, yyyy')}
                  </p>
                  {daysUntilEnforcement && daysUntilEnforcement > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {daysUntilEnforcement} days remaining
                    </p>
                  )}
                </div>
              )}

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Allowed Methods</span>
                </div>
                <div className="flex gap-2">
                  {settings?.allowed_methods?.includes('totp') && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Authenticator</span>
                  )}
                  {settings?.allowed_methods?.includes('email') && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Email</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MFA Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>MFA Configuration</CardTitle>
            <CardDescription>
              Configure how two-factor authentication works for your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reminder Banner */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reminder-enabled">Show reminder banner</Label>
                <p className="text-sm text-muted-foreground">
                  Display a gentle reminder to users who haven't set up MFA
                </p>
              </div>
              <Switch
                id="reminder-enabled"
                checked={currentSettings.reminder_enabled}
                onCheckedChange={(checked) => updateLocal({ reminder_enabled: checked })}
              />
            </div>

            <Separator />

            {/* Allowed Methods */}
            <div className="space-y-4">
              <div>
                <Label>Allowed Authentication Methods</Label>
                <p className="text-sm text-muted-foreground">
                  Select which MFA methods users can choose from
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="method-totp"
                    checked={currentSettings.allowed_methods.includes('totp')}
                    onCheckedChange={() => toggleMethod('totp')}
                  />
                  <Label htmlFor="method-totp" className="font-normal">
                    Authenticator App (TOTP) — Google Authenticator, Authy, etc.
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="method-email"
                    checked={currentSettings.allowed_methods.includes('email')}
                    onCheckedChange={() => toggleMethod('email')}
                  />
                  <Label htmlFor="method-email" className="font-normal">
                    Email OTP — Receive a one-time code via email
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Enforcement Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enforcement-enabled">Require MFA for all users</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, all users must set up MFA to access the application
                </p>
              </div>
              <Switch
                id="enforcement-enabled"
                checked={currentSettings.enforcement_enabled}
                onCheckedChange={(checked) => updateLocal({ enforcement_enabled: checked })}
              />
            </div>

            {/* Grace Period Date */}
            {currentSettings.enforcement_enabled && (
              <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                <Label htmlFor="grace-period-date">Enforcement Date</Label>
                <p className="text-sm text-muted-foreground">
                  Users will have until this date to set up MFA. After this date, MFA will be required to sign in.
                </p>
                <Input
                  id="grace-period-date"
                  type="date"
                  value={currentSettings.grace_period_end_date}
                  onChange={(e) => updateLocal({ grace_period_end_date: e.target.value })}
                  className="max-w-[200px]"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            )}

            <Separator />

            <div className="flex justify-end gap-2">
              {hasChanges && (
                <Button variant="outline" onClick={() => setLocalSettings(null)}>
                  Cancel
                </Button>
              )}
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || updateSettings.isPending}
              >
                {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
};

export default AdminSecuritySettingsPage;
