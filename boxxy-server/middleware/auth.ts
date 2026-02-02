
import type codeboxRequest from "../interface/codeboxRequest.interface";
const valid_token = ["xyz-123-abc"]

const auth = (req, res, next) => {

     
     
    // some kind of check 
    
    // some condition here pass on
    if(true)
    {
        next();
    }

    return res.status(401).json({ message: "Unauthorized" });

};

export default auth;
