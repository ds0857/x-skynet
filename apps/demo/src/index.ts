import { hello } from "@xskynet/core";

async function main() {
  console.log(hello("X-Skynet Developer"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
