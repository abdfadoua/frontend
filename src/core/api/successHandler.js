import { toast } from "react-hot-toast";
import codeMessage from "./codeMessage";

const successHandler = (
  response,
  options = { notifyOnSuccess: false, notifyOnFailed: true }
) => {
  const { data } = response;

  if (data) {
    const message = data.message || codeMessage[response.status];
    if (options.notifyOnSuccess) {
      toast.success(`Request success: ${message}`, {
        duration: 6000,
      });
    }
  } else {
    const message = data.message || codeMessage[response.status];
    const { status } = response;
    if (options.notifyOnFailed) {
      console.log("failed", message);
      toast.error(`Request error ${status}: ${message}`, {
        duration: 6000,
      });
    }
  }
};

export default successHandler;
