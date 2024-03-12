import { z } from "zod";
let userBodySchema = z.object({
    username: z
        .string()
        .min(3, { message: "Username must be at least 3 characters long." }),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long." })
});
let cuteCatPostSchema = z.object({
    id: z.number().gte(1),
    username: z.string().min(3),
    image: z.any(),
    likes: z.number(),
    caption: z.string(),
    timestamp: z.string(),
});
let markerSchema = z.object({
    id: z.number().gte(1),
    latitude: z.number(),
    longitude: z.number(),
});
let mapPostSchema = z.object({
    id: z.number().gte(1),
    username: z.string().min(3),
    marker_id: z.number().gte(1),
    subject: z.string().max(255),
    content: z.string(),
    timestamp: z.string(),
    likes: z.number(),
    image: z.any(),
});
let cuteCatLikeSchema = z.object({
    post_id: z.number().gte(1),
});
let dummyUsers = [
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
export { userBodySchema, dummyUsers, cuteCatPostSchema, cuteCatLikeSchema, mapPostSchema, markerSchema };
