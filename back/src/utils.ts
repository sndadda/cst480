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

let cuteCatPostSchema = z.object({
  id: z.number().gte(1),
  username: z.string().min(3),
  image: z.any(),
  likes: z.number(),
  caption: z.string(),
  timestamp: z.string(),
});
type CuteCatPost = z.infer<typeof cuteCatPostSchema>;

let cuteCatLikeSchema = z.object({
  postId: z.number().gte(1),
  userId: z.number().gte(1),
});
type CuteCatLike = z.infer<typeof cuteCatLikeSchema>;

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

export {
  userBodySchema,
  User,
  dummyUsers,
  cuteCatPostSchema,
  CuteCatPost,
  cuteCatLikeSchema,
  CuteCatLike,
};
