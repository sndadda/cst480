import { z } from "zod";

let loginUserBodySchema = z.object({
  name: z
    .string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." }),
  image: z.
    any().optional()
});

let userBodySchema = z.object({
  name: z
    .string(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." }),
  image: z
    .any().optional()
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
let cuteCatLikeSchema = z.object({
  post_id: z.number().gte(1),
});
type CuteCatLike = z.infer<typeof cuteCatLikeSchema>;

let dummyUsers: User[] = [
  {
    name: "Francisco",
    username: "francisco",
    password: "Francisco123#",
    image: null,
  },
  {
    name: "Sandra",
    username: "sandra",
    password: "Sandra123#",
    image: null,

  },
  {
    name: "Kevin",
    username: "kevin",
    password: "Kevin123#",
    image: null,
  },
];

export {
  loginUserBodySchema,
  userBodySchema,
  User,
  dummyUsers,
  cuteCatPostSchema,
  CuteCatPost,
  cuteCatLikeSchema,
  CuteCatLike,
  mapPostSchema, 
  MapPost, 
  markerSchema,
   Marker
};
