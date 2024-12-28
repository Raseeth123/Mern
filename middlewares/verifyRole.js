import jwt from "jsonwebtoken";

export const verifyRole=(...roles)=>{
    return (req,res,next)=>{
        const token=req.header("Authorization").split(" ")[1];
        console.log(token);
        if(!token) return res.status(403).json({message:"Access denied. No token provided."});
        try{
            console.log(token);
            const decoded=jwt.verify(token,process.env.JWT_SECRET);
            req.user=decoded;
            if(!roles.includes(req.user.role)){
                return res.status(403).json({success:false,message:"Access Denied.Insufficient role"});
            }
            next();
        }
        catch(error){
            return res.status(400).json({message:"Invalid Token"});
        }
    }
}