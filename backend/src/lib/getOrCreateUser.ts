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
  try {
    console.log("[getOrCreateUser] Starting for clerkId:", clerkId);
    let userData = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        teamMemberships: {
          include: {
            team: {
              include: {
                projects: true
              }
            }
          }
        }
      }
    });

    if (!userData) {
      console.log("[getOrCreateUser] User not found, creating new one...");
      const { email, name } = await fetchClerkUser(clerkId);
      console.log("[getOrCreateUser] Clerk data fetched:", { email, name });

      const createdUser = await prisma.user.create({
        data: {
          clerkId,
          email,
          name
        }
      });

      const team = await prisma.team.create({
        data: {
          name: "Personal Workspace"
        }
      });

      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: createdUser.id,
          role: 'owner'
        }
      });

      await prisma.project.create({
        data: {
          teamId: team.id,
          name: "My First Architecture"
        }
      });

      // Fetch again with includes
      userData = (await prisma.user.findUnique({
        where: { clerkId },
        include: {
          teamMemberships: {
            include: {
              team: {
                include: {
                  projects: true
                }
              }
            }
          }
        }
      }))!

      console.log("[getOrCreateUser] User created successfully");
    }

    // Ensure an existing user who somehow lacks a team/project gets one
    if (userData && userData.teamMemberships.length === 0) {
      console.log("[getOrCreateUser] User lacks team, creating default...");
      const newTeam = await prisma.team.create({
        data: {
          name: "Personal Workspace"
        }
      });
      await prisma.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId: userData.id,
          role: 'owner'
        }
      });
      const newProject = await prisma.project.create({
        data: {
          name: "My First Architecture",
          teamId: newTeam.id
        }
      });
      // Update user include
      userData.teamMemberships = [{
        id: '', // dummy
        teamId: newTeam.id,
        userId: userData.id,
        role: 'owner',
        joinedAt: new Date(),
        updatedAt: new Date(),
        team: { ...newTeam, projects: [newProject] }
      }];
    } else if (userData && userData.teamMemberships[0].team.projects.length === 0) {
      console.log("[getOrCreateUser] User lacks project, creating default...");
      const newProject = await prisma.project.create({
        data: {
          name: "My First Architecture",
          teamId: userData.teamMemberships[0].team.id
        }
      });
      userData.teamMemberships[0].team.projects = [newProject];
    }

    console.log("[getOrCreateUser] Returning user with project:", userData.teamMemberships?.[0]?.team?.projects?.[0]?.id);
    return userData;
  } catch (err: any) {
    console.error("[getOrCreateUser] FATAL ERROR:", err.message);
    throw err;
  }
}
