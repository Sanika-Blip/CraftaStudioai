import { getOrCreateUser } from "./src/lib/getOrCreateUser";

async function main() {
  try {
    const user = await getOrCreateUser("user_2k1B3P8q0L2V5Z9M7Y4X6W8N0A2");
    console.log("Success:", user);
  } catch (err) {
    console.error("Error:", err);
  }
}

main().catch(console.error);
