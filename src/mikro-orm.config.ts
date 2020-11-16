import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import path from 'path'

// require('dotenv').config()
// const user = process.env.USER;
// const password = process.env.PASSWORD;

// console.log('PASS = ', typeof password)

export default {
    migrations: {
        path: path.join(__dirname, './migrations'), // path to the folder with migrations
        pattern: /^[\w-]+\d+\.[tj]s$/, // regex pattern for the migration files
        
    },
    entities: [Post], 
    dbName: 'reddit-fullstack',
    type: 'postgresql',
    // this was might quick fix, not very elegant
    user: 'postgres',
    password: 'postgres',
    debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];