import prisma from "./prisma";

interface ClerkUserData {
  email: string | null;
  name: string | null;
}

/**
 * Fetches the user's email and name from the Clerk API.
 * Used when creating a new user record in our database.
 */
async function fetchClerkUser(clerkId: string): Promise<ClerkUserData> {
  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!res.ok) {
      console.error(`Clerk API error: ${res.status} for user ${clerkId}`);
      return { email: null, name: null };
    }

    const data = await res.json() as any;

    const email =
      data.email_addresses?.find((e: any) => e.id === data.primary_email_address_id)
        ?.email_address ??
      data.email_addresses?.[0]?.email_address ??
      null;

    const name =
      [data.first_name, data.last_name].filter(Boolean).join(" ").trim() || null;

    return { email, name };
  } catch (err) {
    console.error("Failed to fetch user from Clerk API:", err);
    return { email: null, name: null };
  }
}

/**
 * Finds an existing user by their Clerk ID, or creates a new one
 * by fetching their profile from Clerk and saving it to the database.
 */
export async function getOrCreateUser(clerkId: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    const { email, name } = await fetchClerkUser(clerkId);

    user = await prisma.user.create({
      data: {
        clerkId,
        email,
        name,
      },
    });
  }

  return user;
}
