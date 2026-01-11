import { SignInForm } from "@/components/auth/signin-form"

interface SignInPageProps {
  searchParams: Promise<{ redirect?: string; invitation?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams
  // Extract invitation token from redirect URL if present, or from direct invitation param
  let invitationToken = params.invitation
  
  // If redirect contains invitation, extract it
  if (!invitationToken && params.redirect) {
    const redirectMatch = params.redirect.match(/\/accept-invitation\/([^/?]+)/)
    if (redirectMatch) {
      invitationToken = redirectMatch[1]
    }
  }
  
  return <SignInForm invitationToken={invitationToken} />
}
