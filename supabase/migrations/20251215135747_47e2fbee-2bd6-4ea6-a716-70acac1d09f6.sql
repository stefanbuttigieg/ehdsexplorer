-- Create email_templates table for managing invitation and notification emails
CREATE TABLE public.email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  description TEXT,
  available_variables TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can read email templates (needed for edge functions)
CREATE POLICY "Anyone can read email templates"
ON public.email_templates
FOR SELECT
USING (true);

-- Only admins can modify email templates
CREATE POLICY "Admins can insert email templates"
ON public.email_templates
FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update email templates"
ON public.email_templates
FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete email templates"
ON public.email_templates
FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default invitation email template
INSERT INTO public.email_templates (id, name, subject, body_html, description, available_variables)
VALUES (
  'user-invitation',
  'User Invitation Email',
  'You''ve been invited to EHDS Explorer Admin',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #0ea5e9;">Welcome to EHDS Explorer</h1>
  <p>Hello,</p>
  <p>You have been invited to join the EHDS Explorer administration team as an <strong>{{role}}</strong>.</p>
  <p>Click the button below to set up your account:</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{login_url}}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Set Up Your Account</a>
  </div>
  <p>If the button doesn''t work, copy and paste this link into your browser:</p>
  <p style="word-break: break-all; color: #666;">{{login_url}}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px;">This invitation was sent by {{inviter_email}}. If you didn''t expect this invitation, you can safely ignore this email.</p>
</div>',
  'Email sent when inviting new users to the admin panel',
  ARRAY['role', 'login_url', 'inviter_email']
),
(
  'test-email',
  'Test Email',
  'EHDS Explorer - Email Test Successful',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #22c55e;">✓ Email Test Successful</h1>
  <p>Hello {{user_email}},</p>
  <p>This is a test email from EHDS Explorer to verify that email delivery is working correctly.</p>
  <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0; color: #166534;"><strong>Email Configuration Status:</strong> Working</p>
    <p style="margin: 8px 0 0 0; color: #166534;"><strong>Sent at:</strong> {{sent_at}}</p>
  </div>
  <p>Your Resend integration is configured correctly and emails are being delivered.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px;">This is an automated test email from EHDS Explorer.</p>
</div>',
  'Test email to verify email delivery is working',
  ARRAY['user_email', 'sent_at']
);