import { walk } from "../fileOperations";

describe("fileOperations", () => {
  it("walks through the files in the current directory", async () => {
    const dirnames = await walk(`${__dirname}`);
    expect(dirnames).toEqual(["SomeComponent.tsx"]);
  });

  it("opens the files", () => {});
});
