// Pure helpers for the ward representative rating panel.

// Running totals kept on the ward item by the API.
export const ratingAggregate = (ward) => {
  const count = Number(ward.rating_count) || 0;
  const sum = Number(ward.rating_sum) || 0;
  return { count, average: count ? Math.round((sum / count) * 10) / 10 : null };
};

// What the rating panel should offer this visitor.
//   demo       data is not from the API, so keep the old local-only widget
//   login      not signed in
//   other-ward signed in, but locked to a different ward
//   loading    own ward, still asking the server whether they already rated
//   rated      own ward, already rated (myRating holds the stars)
//   can-rate   own ward, not rated yet
export function ratingPanelState({ live, signedIn, userWardId, wardId, myRating }) {
  if (!live) return "demo";
  if (!signedIn) return "login";
  if (userWardId !== wardId) return "other-ward";
  if (myRating === undefined) return "loading";
  return myRating ? "rated" : "can-rate";
}
