# Supabase Password Reset OTP Setup

The app now uses Supabase built-in password reset again:

- `supabase.auth.resetPasswordForEmail(email)` to send the OTP email
- `supabase.auth.verifyOtp({ email, token, type: 'recovery' })` to verify the code
- `supabase.auth.updateUser({ password })` to save the new password

## What The App Expects

- Supabase sends the reset code to the registered email address.
- The app accepts numeric reset codes between 6 and 8 digits.
- After OTP verification succeeds, the app lets the user enter a new password and saves it with `updateUser`.

## Required Supabase Template Change

To receive a PIN code in email instead of a reset link, your Supabase Reset Password template must use `{{ .Token }}`.

Dashboard steps:

1. Open Supabase Dashboard.
2. Go to Authentication.
3. Open Email Templates.
4. Open Reset Password or Recovery.
5. Set the subject to `Your password reset code`.
6. Replace the body with the content from [supabase/recovery-otp-template.html](supabase/recovery-otp-template.html), or use this HTML:

```html
<h2>Reset Your Password</h2>
<p>Your password reset code is: <strong>{{ .Token }}</strong></p>
<p>Enter this code in the app to reset your password.</p>
<p>If you didn't request this, you can ignore this email.</p>
```

Important:

- Use `{{ .Token }}`, not `{{ .ConfirmationURL }}`
- If the template still contains a link flow, the app will not receive the manual OTP experience you want

## Rate Limit Requirement

This part cannot be solved only in app code.

If you use Supabase hosted default email delivery, Supabase applies strict email-send limits. Their docs state password-reset email sends are limited and the hosted built-in provider is especially restrictive.

If you want this to work reliably in production:

1. Configure Custom SMTP in Supabase.
2. Open Authentication > Rate Limits.
3. Increase the password reset and email send limits for your project.

Without Custom SMTP, you can still hit `email rate limit exceeded` from Supabase even if the app code is correct.

## Management API Option

If you want to update the template and rate limits programmatically, use the Supabase Management API with your project access token.

```bash
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
	-H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
		"mailer_subjects_recovery": "Your password reset code",
		"mailer_templates_recovery_content": "<h2>Reset Your Password</h2><p>Your password reset code is: <strong>{{ .Token }}</strong></p><p>Enter this code in the app to reset your password.</p><p>If you didn\u0027t request this, you can ignore this email.</p>"
	}'
```

Supabase also allows Auth rate limit changes from the same config endpoint. The exact values depend on your production traffic and SMTP provider limits.

## Troubleshooting

If the app shows `JSON Parse error: Unexpected character: N`, the password reset request is not hitting Supabase directly and is receiving a non-JSON response from another endpoint. The current code has been switched back to direct Supabase Auth calls to remove that failure path.

If the user does not receive the code:

1. Confirm the email exists in Supabase Auth.
2. Confirm the Reset Password template uses `{{ .Token }}`.
3. Confirm Custom SMTP is configured if you need production volume.
4. Confirm Auth rate limits are high enough for your expected traffic.
5. Check Supabase Auth logs for recovery email send failures.

## Signup Confirmation Template

If your signup confirmation email is still opening `localhost:3000`, replace the Confirm Signup template in Supabase with [supabase/signup-confirmation-template.html](supabase/signup-confirmation-template.html).

That template sends users through `https://properavista.com/api/auth/confirm-signup`, which verifies the token, redirects them to Properavista, and triggers a second confirmation-complete email.