import { SignUpForm } from "@/components/auth/signup-form"

interface SignUpPageProps {
  searchParams: Promise<{ invitation?: string }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams
  const invitationToken = params.invitation
  
  return <SignUpForm invitationToken={invitationToken} />
}
