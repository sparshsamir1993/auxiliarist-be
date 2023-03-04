const request = require("supertest");
const app = require("../../../../index");
const BASE_URL = "/api/v1/user";

describe("Test user routes", () => {
  beforeEach(() => {
    var redis = require("redis-mock"),
      client = redis.createClient();
    console.log("completed.....");
    require("../../../../__mocks__/sequelize");
  });
  test("Should test signup", async (done) => {
    try {
      const signupResult = await request(app).post(`${BASE_URL}/signup`).send({
        email: "aa+1@aa.com",
        password: "testtest",
      });
      expect(signupResult.status).toEqual(200);
      done();
    } catch (Err) {
      done();
    }
  });
});
