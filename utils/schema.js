import Joi from "joi";

export const UserSchema={
    register:Joi.object({
        userName:Joi.string().min(3).max(10).required(),
        email:Joi.string().pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).required(),
        password:Joi.string().min(8).max(30).required(),
        phone:Joi.string().min(7).max(11).required(),
        confirmPassword:Joi.string().valid(Joi.ref("password")).required(),
        roles:Joi.string().valid('admin', 'guardian', 'teacher').required(),
        relationship:Joi.string().when(Joi.ref('roles'), {
            is: 'guardian',
            then: Joi.required(),
            otherwise: Joi.optional()
        })
    }),
    login:Joi.object({  
        email:Joi.string().pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).required(),
        password:Joi.string().min(8).max(30).required(),
    }),
    
}

export const SchoolSchema={
    create:Joi.object({
        schoolName:Joi.string().required(),
        email:Joi.string().pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).required(),
        phone:Joi.string().min(7).max(11).required(),
        address:Joi.string().required(),
    })
}

export const PostSchema = {
    create: Joi.object({
        heading: Joi.string().min(3).max(50).required(),
        body: Joi.string().min(3).max(500),
        contentType: Joi.string().valid("announcement", "feed").required(),
        classId: Joi.string().required(),
        grade: Joi.string().required()
    }).unknown(true),
    edit: Joi.object({
        heading: Joi.string().min(3).max(50),
        body: Joi.string().min(3).max(500)
    }).unknown(true)
}