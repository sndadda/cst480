import { z } from "zod";

let userBodySchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." }),
});
type User = z.infer<typeof userBodySchema>;

let dummyUsers: User[] = [
  {
    username: "francisco",
    password: "Francisco123#",
  },
  {
    username: "sandra",
    password: "Sandra123#",
  },
  {
    username: "kevin",
    password: "Kevin123#",
  },
];

export { userBodySchema, User, dummyUsers };
