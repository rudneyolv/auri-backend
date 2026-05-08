export function normalizePair({
  userIdA,
  userIdB,
}: {
  userIdA: string;
  userIdB: string;
}) {
  return userIdA < userIdB
    ? { user_a_id: userIdA, user_b_id: userIdB }
    : { user_a_id: userIdB, user_b_id: userIdA };
}
