import {Resolver, Mutation, InputType, Field, Arg, Ctx, ObjectType, Query} from  'type-graphql'
import argon2 from "argon2"
import { MyContext } from 'src/types';
import { User } from '../entities/User';

@InputType()
class UsernameAndPasswordInput {
    @Field()
    username: string;
    @Field()
    password: string;

}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[];

    @Field(() => User, {nullable: true})
    user?: User;
}

@ObjectType()
class FieldError {
    @Field()
    field: string
    @Field()
    message: string
}

@Resolver()
export class UserResolver {

    @Query(() => User, { nullable:true })
    async me(
        @Ctx() {req,em}: MyContext
        ) {
            // you are not logged in
            if(!req.session.userId) {
                return null
            }

        const user = await em.findOne(User, {id: req.session.userId});
        return user
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: UsernameAndPasswordInput,
        @Ctx() {em, req}: MyContext
    ): Promise<UserResponse> {
        
        if(options.username.length <= 2){
            return {
                errors: [
                    {
                        field: 'username',
                        message: "username length must be greater than 2"
                    }
                ]
            }
        }

        if(options.password.length <= 3){
            return {
                errors: [
                    {
                        field: 'password',
                        message: "password length must be greater than 3"
                    }
                ]
            }
        }

        const hashedPassword = await argon2.hash(options.password)
        const user = em.create(User, {username: options.username, password: hashedPassword})
        // duplicate username
        try {
            await em.persistAndFlush(user)
        } catch(err) {
            if(err.code === '23505') {
                return {
                    errors: [
                        {
                            field: 'username',
                            message: "username already exists"
                        }
                    ]
                }
            }
        }

        // store user id session
        // set cookie on the user
        // keep their sessions
        req.session.userId = user.id

        return {user}

    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("options") options: UsernameAndPasswordInput,
        @Ctx() {em, req}: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, {username: options.username})
        if(!user) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "that username doesn't exist"
                    }
                ]
            }
        }

        const valid = await argon2.verify(user.password, options.password)
        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "incorrect password"
                    }
                ]
            }
        }

        req.session!.userId = user.id;


        return {
            user, 
        }

    }
}

