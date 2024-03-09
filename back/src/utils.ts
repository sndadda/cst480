import { z } from "zod";

let userBodySchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
});
type User = z.infer<typeof userBodySchema>;

let cuteCatPostSchema = z.object({
  id: z.number().gte(1),
  username: z.string().min(3),
  image: z.any(),
  likes: z.number(),
  caption: z.string(),
  timestamp: z.string(),
});
type CuteCatPost = z.infer<typeof cuteCatPostSchema>;

let markerSchema = z.object({
  id: z.number().gte(1),
  latitude: z.number(),
  longitude: z.number(),
});
type Marker = z.infer<typeof markerSchema>;

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
type MapPost = z.infer<typeof mapPostSchema>;

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

export { userBodySchema, User, dummyUsers, cuteCatPostSchema, CuteCatPost, mapPostSchema, MapPost, markerSchema, Marker };
