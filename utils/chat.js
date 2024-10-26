import User from "../models/user.model.js";


export const initialize = async(io, socket) =>{
    const userName = await User.findById(socket.user.data._id);
    socket.emit("greet",{"Hello":userName.userName,"id":socket.user.data._id})
    socket.emit ("socketId","This is your socket id: "+socket.id)
    socket.on("message",(data)=>{
        console.log(data);
    })
}


