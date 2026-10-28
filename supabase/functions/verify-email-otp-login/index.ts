import { handleEmailMfa } from '../_shared/mfa-email.ts';
Deno.serve(req => handleEmailMfa(req, true));
