import { createFileRoute } from "@tanstack/react-router";
import { StreakPlate } from "@/components/keyline/StreakPlate";

export const Route = createFileRoute("/streak-shot")({
  component: StreakShot,
});

/**
 * Local preview of the streak HUD, the driving trail, and the Streak Lord title.
 * It grants nothing and is not linked from play. The banner is part of the picture.
 */
function StreakShot() {
  return (
    <main className="mx-auto grid max-w-3xl gap-4 px-4 py-5" data-testid="streak-shot">
      <p className="shot-banner" data-testid="seed-banner">
        SEEDED DEMO — local test state, not a live account. Nothing here is paid to a wallet.
      </p>
      <section className="hud-plate" data-testid="shot-hud">
        <p className="kicker">Austin</p>
        <p className="font-display text-3xl leading-none">Streak perks</p>
        <StreakPlate run={50} auth lord={false} startOpen />
      </section>
      <section>
        <p className="kicker mb-1">Race Red Mustang · paint stays on the sprite</p>
        <div className="shot-cars">
          <figure>
            <div className="shot-car">
              <div className="pawn is-seated">
                <div className="cab-sprite" data-face="right" data-car="mustang" data-paint="red" />
              </div>
            </div>
            <figcaption>Parked · no turbo, no trail</figcaption>
          </figure>
          <figure>
            <div className="shot-car">
              <div className="pawn is-seated is-driving is-streak-trail is-streak-pixel">
                <div className="cab-sprite is-lamps" data-face="right" data-car="mustang" data-paint="red" />
              </div>
            </div>
            <figcaption>Driving · turbo +12% · blue trail · pixel speed</figcaption>
          </figure>
        </div>
        <p className="shot-note">The marks are on the pawn, only while driving. Reduced motion holds the trail and the pixel dashes still.</p>
      </section>
      <section className="lvl-panel" data-testid="shot-title">
        <p className="kicker">Journal · Titles</p>
        <p className="hq-row-title">
          Level 12 <span className="lvl-title">“Streak Lord”</span>
        </p>
        <div className="lvl-ladder">
          <p className="lvl-ladder-name">Bonus</p>
          <div className="lvl-rungs">
            <button type="button" className="lvl-rung is-earned" disabled>
              <span className="lvl-rung-name">Hot Streak</span>
              <span className="lvl-rung-bar" aria-hidden><i style={{ width: "100%" }} /></span>
              <span className="lvl-rung-n">✓</span>
            </button>
            <button type="button" className="lvl-rung is-earned is-on">
              <span className="lvl-rung-name">Streak Lord</span>
              <span className="lvl-rung-bar" aria-hidden><i style={{ width: "100%" }} /></span>
              <span className="lvl-rung-n">✓</span>
            </button>
            <button type="button" className="lvl-rung" disabled>
              <span className="lvl-rung-name">Globetrotter</span>
              <span className="lvl-rung-bar" aria-hidden><i style={{ width: "40%" }} /></span>
              <span className="lvl-rung-n">40/100</span>
            </button>
          </div>
        </div>
        <p className="shot-note mt-2">The title is equipped from the existing Journal picker. It stays after the streak breaks.</p>
      </section>
    </main>
  );
}
