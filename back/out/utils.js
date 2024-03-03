import { z } from "zod";
let userBodySchema = z.object({
    username: z
        .string()
        .min(3, { message: "Username must be at least 3 characters long." }),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long." }),
    name: z.string()
});
let cuteCatPostSchema = z.object({
    id: z.number().gte(1),
    username: z.string().min(3),
    image: z.any(),
    likes: z.number(),
    caption: z.string(),
    timestamp: z.string(),
});
let dummyUsers = [
    {
        username: "francisco",
        password: "Francisco123#",
        name: "Francisco",
    },
    {
        username: "sandra",
        password: "Sandra123#",
        name: "Sandra",
    },
    {
        username: "kevin",
        password: "Kevin123#",
        name: "Kevin",
    },
];
export { userBodySchema, dummyUsers, cuteCatPostSchema };
