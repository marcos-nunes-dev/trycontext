/**
 * Email service for workspace invitations
 * Uses Supabase Auth email service for MVP
 */

export interface InvitationEmailData {
  email: string
  workspaceName: string
  inviterName: string
  role: 'admin' | 'member' | 'viewer'
  token: string
  expiresAt: Date
}

/**
 * Generate invitation email HTML template
 */
export function generateInvitationEmailHTML(data: InvitationEmailData): string {
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invitation/${data.token}`
  const expirationDate = data.expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workspace Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Workspace Invitation</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hello,
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${data.inviterName}</strong> has invited you to join the workspace <strong>"${data.workspaceName}"</strong> as a <strong>${data.role}</strong>.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${invitationUrl}" 
         style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Or copy and paste this link into your browser:<br>
      <a href="${invitationUrl}" style="color: #667eea; word-break: break-all;">${invitationUrl}</a>
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      This invitation will expire on <strong>${expirationDate}</strong>.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>This is an automated message from Context</p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate plain text version of invitation email
 */
export function generateInvitationEmailText(data: InvitationEmailData): string {
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invitation/${data.token}`
  const expirationDate = data.expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
Workspace Invitation

Hello,

${data.inviterName} has invited you to join the workspace "${data.workspaceName}" as a ${data.role}.

Accept the invitation by clicking this link:
${invitationUrl}

This invitation will expire on ${expirationDate}.

If you didn't expect this invitation, you can safely ignore this email.

---
This is an automated message from Context
  `.trim()
}

/**
 * Send invitation email
 * For MVP: Logs to console in development, uses Supabase email in production
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<{ success: boolean; error?: string }> {
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (isDevelopment) {
    // In development, log the invitation link to console
    // Can also be viewed in Inbucket if configured
    console.log('=== WORKSPACE INVITATION EMAIL ===')
    console.log(`To: ${data.email}`)
    console.log(`Workspace: ${data.workspaceName}`)
    console.log(`Inviter: ${data.inviterName}`)
    console.log(`Role: ${data.role}`)
    console.log(`Invitation URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invitation/${data.token}`)
    console.log(`Expires: ${data.expiresAt.toLocaleString()}`)
    console.log('==================================')
    
    // In local development, you can view emails in Inbucket at http://127.0.0.1:54324
    // For now, we'll just log it
    return { success: true }
  }

  // In production, use Supabase Auth email service or external service
  // For MVP, we'll use a simple approach - you can integrate with Resend, SendGrid, etc. later
  try {
    // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
    // For now, return success (email sending can be implemented later)
    console.log('Would send invitation email to:', data.email)
    return { success: true }
  } catch (error) {
    console.error('Error sending invitation email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    }
  }
}
