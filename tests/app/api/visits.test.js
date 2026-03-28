import { describe, expect, it } from "vitest";

import { POST as visitsPostRoute } from "../../../app/api/visits/route.js";

describe("visits api", () => {
  it("returns 204 because middleware now owns visit logging", async () => {
    const response = await visitsPostRoute(new Request("http://localhost:3000/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        path: "/posts",
        referer: "https://google.com",
      }),
    }));

    expect(response.status).toBe(204);
  });
});
