import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignInActions } from "@/components/keyline/AuthChip";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  if (!isPending && user) return <Navigate to="/" />;

  return (
    <div className="title-night">
      <div className="title-pave" aria-hidden />
      <main className="title-folio">
        <div className="street-blade" aria-label="Keyline">
          <span>Standings</span>
          <strong>KEYLINE</strong>
        </div>
        <p className="lede">Sign in to post plates under your name. Guests can still read the board.</p>
        {isPending ? (
          <div className="h-11 animate-pulse rounded-md bg-bg-subtle" aria-hidden />
        ) : (
          <SignInActions />
        )}
        <Link to="/" className="title-more">
          Back to the street
        </Link>
      </main>
    </div>
  );
}
