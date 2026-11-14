/** 0.1.167: right answers needed to pass the player above me on a Ladders board (a tie needs one more).
 * Its own module so the client never imports ladderBoard.ts, which loads the trivia bank on the server. */
export const toPass = (rival: { gap: number }) => Math.max(0, rival.gap) + 1;
