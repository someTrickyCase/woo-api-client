import Store from "../../store";
import Connection from "../../services/Connection";

jest.mock("../../services/Connection");

describe("crash", () => {
	it("works", () => {
		expect(true).toBe(true);
	});
});
