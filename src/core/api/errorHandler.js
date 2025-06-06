import { toast } from "react-hot-toast";
import codeMessage from "./codeMessage";

const errorHandler = (error) => {
  const { response } = error;

  if (response && response.status) {
    const message = response.data && response.data.message;
    const errorText = message || codeMessage[response.status];
    const { status } = response;

    toast.error(`Request error ${status}: ${errorText}`, {
      duration: 6000,
    });
  } else {
    toast.error(
      "No internet connection: Cannot connect to the server, check your internet network",
      {
        duration: 6000,
      }
    );
  }
};

export default errorHandler;
