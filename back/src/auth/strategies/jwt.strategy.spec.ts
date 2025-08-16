import { JwtStrategy } from "./jwt.strategy";

describe("JwtStrategy", () => {
  it("should be defined", () => {
    expect(JwtStrategy).toBeDefined();
  });

  it("should be a class", () => {
    expect(typeof JwtStrategy).toBe("function");
  });
});
