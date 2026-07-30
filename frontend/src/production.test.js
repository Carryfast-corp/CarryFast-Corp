const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("production smoke checks", () => {
  test("public HTML exposes the React mount point", () => {
    expect(read("public/index.html")).toContain('<div id="root"></div>');
  });

  test("app keeps the public and admin routes registered", () => {
    const app = read("src/App.js");

    expect(app).toContain('path="/"');
    expect(app).toContain('path="/contact"');
    expect(app).toContain("ProtectedRoute");
    expect(app).toContain("ADMIN_URL");
  });

  test("Firebase data layer is used instead of a backend API client", () => {
    expect(read("src/lib/firebaseData.js")).toContain("subscribeSiteConfig");
  });
});
