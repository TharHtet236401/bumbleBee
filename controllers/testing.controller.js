import { fMsg } from "../utils/libby.js";
export const testing = (req, res) => {
  console.log(req.body);

  //the usage of FMsg insted of helloworld you can use any message , the last parameter is the result
  fMsg(res, "hellword", req.body, 200);
};
