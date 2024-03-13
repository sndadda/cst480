"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markerSchema = exports.mapPostSchema = exports.cuteCatLikeSchema = exports.cuteCatPostSchema = exports.dummyUsers = exports.userBodySchema = exports.loginUserBodySchema = void 0;
var zod_1 = require("zod");
var loginUserBodySchema = zod_1.z.object({
    name: zod_1.z
        .string().optional(),
    username: zod_1.z
        .string()
        .min(3, { message: "Username must be at least 3 characters long." }),
    password: zod_1.z
        .string()
        .min(8, { message: "Password must be at least 8 characters long." }),
    image: zod_1.z.
        any().optional()
});
exports.loginUserBodySchema = loginUserBodySchema;
var userBodySchema = zod_1.z.object({
    name: zod_1.z
        .string(),
    username: zod_1.z
        .string()
        .min(3, { message: "Username must be at least 3 characters long." }),
    password: zod_1.z
        .string()
        .min(8, { message: "Password must be at least 8 characters long." }),
    image: zod_1.z
        .any().optional()
});
exports.userBodySchema = userBodySchema;
var cuteCatPostSchema = zod_1.z.object({
    id: zod_1.z.number().gte(1),
    username: zod_1.z.string().min(3),
    image: zod_1.z.any(),
    likes: zod_1.z.number(),
    caption: zod_1.z.string(),
    timestamp: zod_1.z.string(),
});
exports.cuteCatPostSchema = cuteCatPostSchema;
var markerSchema = zod_1.z.object({
    id: zod_1.z.number().gte(1),
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
});
exports.markerSchema = markerSchema;
var mapPostSchema = zod_1.z.object({
    id: zod_1.z.number().gte(1),
    username: zod_1.z.string().min(3),
    marker_id: zod_1.z.number().gte(1),
    subject: zod_1.z.string().max(255),
    content: zod_1.z.string(),
    timestamp: zod_1.z.string(),
    likes: zod_1.z.number(),
    image: zod_1.z.any(),
});
exports.mapPostSchema = mapPostSchema;
var cuteCatLikeSchema = zod_1.z.object({
    post_id: zod_1.z.number().gte(1),
});
exports.cuteCatLikeSchema = cuteCatLikeSchema;
var dummyUsers = [
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
exports.dummyUsers = dummyUsers;
